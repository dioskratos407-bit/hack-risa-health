import { SupabaseClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

export interface QualityAuditRow {
  id?: number;
  stage: string;
  category: string;
  dropped_count: number;
  created_at?: string;
}

export interface RawSampleRow {
  id?: number;
  source_file: string;
  patient_id: string | null;
  device_id: string | null;
  variable_code: string;
  raw_timestamp: string | null;
  raw_value: string | null;
  unit: string | null;
  quality_flag: string | null;
  signal_quality: number | null;
  was_kept_in_clean: boolean;
  rejection_reason: string | null;
  created_at?: string;
}

export interface QualitySummaryMetrics {
  totalRawRecords: number;
  totalCleanRecords: number;
  totalDroppedRecords: number;
  retentionRatePercent: number;
  categories: QualityAuditRow[];
}

export interface RawSampleQueryResult {
  rows: RawSampleRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RawSampleFilters {
  sourceFile?: string;
  keptFilter?: boolean | null;
  rejectionReason?: string;
  patientId?: string;
  page?: number;
  pageSize?: number;
}

// Fallback loader desde CSV local si la tabla en Supabase aún no existe o está vacía
function loadAuditCsvFallback(): QualityAuditRow[] {
  try {
    const csvPath = path.join(process.cwd(), 'datos', 'data_quality_audit.csv');
    if (!fs.existsSync(csvPath)) return [];
    const content = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
    const lines = content.split('\n');
    const rows: QualityAuditRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        rows.push({
          id: i,
          stage: parts[0].trim(),
          category: parts[1].trim(),
          dropped_count: parseInt(parts[2].trim(), 10) || 0,
        });
      }
    }
    return rows;
  } catch (err) {
    console.error('Error leyendo data_quality_audit.csv:', err);
    return [];
  }
}

function loadSampleCsvFallback(filters: RawSampleFilters): RawSampleQueryResult {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize || 50));

  try {
    const csvPath = path.join(process.cwd(), 'datos', 'raw_data_sample.csv');
    if (!fs.existsSync(csvPath)) {
      return { rows: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const content = fs.readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
    const lines = content.split('\n');
    if (lines.length <= 1) {
      return { rows: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const allRows: RawSampleRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',');
      if (vals.length < headers.length) continue;
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = vals[idx] === '' || vals[idx] === undefined ? null : vals[idx].trim();
      });

      const wasKept = rowObj.was_kept_in_clean === 'True' || rowObj.was_kept_in_clean === 'true';

      allRows.push({
        id: i,
        source_file: rowObj.source_file,
        patient_id: rowObj.patient_id,
        device_id: rowObj.device_id,
        variable_code: rowObj.variable_code,
        raw_timestamp: rowObj.raw_timestamp,
        raw_value: rowObj.raw_value,
        unit: rowObj.unit,
        quality_flag: rowObj.quality_flag,
        signal_quality: rowObj.signal_quality ? Number(rowObj.signal_quality) : null,
        was_kept_in_clean: wasKept,
        rejection_reason: wasKept ? null : rowObj.rejection_reason,
      });
    }

    // Filtrar
    const filtered = allRows.filter((r) => {
      if (filters.sourceFile && filters.sourceFile !== 'ALL' && r.source_file !== filters.sourceFile) {
        return false;
      }
      if (filters.keptFilter !== undefined && filters.keptFilter !== null) {
        if (r.was_kept_in_clean !== filters.keptFilter) return false;
      }
      if (filters.rejectionReason && filters.rejectionReason !== 'ALL') {
        if (r.rejection_reason !== filters.rejectionReason) return false;
      }
      if (filters.patientId && filters.patientId.trim() !== '') {
        if (!r.patient_id?.toLowerCase().includes(filters.patientId.toLowerCase().trim())) return false;
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      rows: paginated,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error('Error procesando fallback de raw_data_sample.csv:', err);
    return { rows: [], total: 0, page, pageSize, totalPages: 0 };
  }
}

/**
 * Obtiene el resumen de auditoría del pipeline ETL (15 categorías).
 */
export async function fetchQualityAuditSummary(
  supabase: SupabaseClient
): Promise<QualitySummaryMetrics> {
  let categories: QualityAuditRow[] = [];

  try {
    const { data, error } = await supabase
      .from('risa_etl_quality_audit')
      .select('id, stage, category, dropped_count, created_at')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      categories = loadAuditCsvFallback();
    } else {
      categories = data.map((d: any) => ({
        id: d.id,
        stage: d.stage,
        category: d.category,
        dropped_count: Number(d.dropped_count) || 0,
        created_at: d.created_at,
      }));
    }
  } catch {
    categories = loadAuditCsvFallback();
  }

  // Cálculos consolidados del dataset RISA
  // Fuentes crudas aproximadas según ejecución del pipeline:
  // Vital Signs: 1,780,240 | Devices: 14,036 | Wearables: 804,460 -> Total Entrada: 2,598,736
  const totalRawRecords = 2598736;
  const totalDroppedRecords = categories
    .filter((c) => c.category.startsWith('descartado_'))
    .reduce((acc, curr) => acc + curr.dropped_count, 0);

  const totalCleanRecords = Math.max(0, totalRawRecords - totalDroppedRecords);
  const retentionRatePercent = totalRawRecords > 0 ? (totalCleanRecords / totalRawRecords) * 100 : 0;

  return {
    totalRawRecords,
    totalCleanRecords,
    totalDroppedRecords,
    retentionRatePercent: Number(retentionRatePercent.toFixed(2)),
    categories,
  };
}

/**
 * Consulta la muestra de datos crudos con filtros y paginación acotada (~50 filas/página).
 */
export async function fetchRawDataSample(
  supabase: SupabaseClient,
  filters: RawSampleFilters = {}
): Promise<RawSampleQueryResult> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize || 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('risa_raw_data_sample')
      .select('*', { count: 'exact' });

    if (filters.sourceFile && filters.sourceFile !== 'ALL') {
      query = query.eq('source_file', filters.sourceFile);
    }
    if (filters.keptFilter !== undefined && filters.keptFilter !== null) {
      query = query.eq('was_kept_in_clean', filters.keptFilter);
    }
    if (filters.rejectionReason && filters.rejectionReason !== 'ALL') {
      query = query.eq('rejection_reason', filters.rejectionReason);
    }
    if (filters.patientId && filters.patientId.trim() !== '') {
      query = query.ilike('patient_id', `%${filters.patientId.trim()}%`);
    }

    const { data, count, error } = await query
      .order('id', { ascending: true })
      .range(from, to);

    if (error || !data || data.length === 0) {
      return loadSampleCsvFallback(filters);
    }

    const total = count ?? data.length;
    const totalPages = Math.ceil(total / pageSize);

    const rows: RawSampleRow[] = data.map((d: any) => ({
      id: d.id,
      source_file: d.source_file,
      patient_id: d.patient_id,
      device_id: d.device_id,
      variable_code: d.variable_code,
      raw_timestamp: d.raw_timestamp,
      raw_value: d.raw_value,
      unit: d.unit,
      quality_flag: d.quality_flag,
      signal_quality: d.signal_quality !== null ? Number(d.signal_quality) : null,
      was_kept_in_clean: Boolean(d.was_kept_in_clean),
      rejection_reason: d.rejection_reason,
      created_at: d.created_at,
    }));

    return {
      rows,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch {
    return loadSampleCsvFallback(filters);
  }
}
