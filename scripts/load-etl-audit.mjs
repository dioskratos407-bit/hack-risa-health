#!/usr/bin/env node
// Carga a Supabase los 2 CSV que genera clean_health_data.py para el sistema de
// visualización de calidad (auditoría por etapa + muestra cruda). Ejecutar DESPUÉS de
// pegar supabase/etl_quality_audit.sql en el SQL Editor -- este script no crea tablas,
// solo escribe filas.
//
// A diferencia de lib/supabaseClient.ts (que degrada a la clave anónima si falta la de
// service_role), este script EXIGE SUPABASE_SERVICE_ROLE_KEY: cargar miles de filas con
// la clave equivocada fallaría silenciosamente contra RLS.
//
// Uso:
//   node scripts/load-etl-audit.mjs --dry-run   (valida y muestra conteos, no escribe)
//   node scripts/load-etl-audit.mjs             (carga real)

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;

const ALLOWED_TABLES = new Set(['risa_etl_quality_audit', 'risa_raw_data_sample']);

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    throw new Error(`No se encontró ${envPath}. Este script necesita las mismas variables que usa la app.`);
  }
  const content = readFileSync(envPath, 'utf-8').replace(/^﻿/, '');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// Parser de CSV mínimo: ninguno de los 2 archivos que carga este script tiene comas
// dentro de un campo (son códigos, ids, números y timestamps ISO) -- un split simple
// alcanza, no hace falta añadir una dependencia nueva solo para esto.
function parseCsv(filePath) {
  const content = readFileSync(filePath, 'utf-8').replace(/^﻿/, '').replace(/\r\n/g, '\n').trim();
  const [headerLine, ...lines] = content.split('\n');
  const headers = headerLine.split(',');
  return lines.filter(Boolean).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] === undefined || values[i] === '' ? null : values[i];
    });
    return row;
  });
}

function toBool(value) {
  return value === 'True' || value === 'true';
}

function toNumOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

async function upsertInBatches(supabase, table, rows, onConflict) {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Tabla no permitida por el allowlist de este script: ${table}`);
  }

  const { count: before, error: countError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (countError) {
    throw new Error(
      `[${table}] no se pudo leer la tabla (¿ya ejecutaste supabase/etl_quality_audit.sql en el SQL Editor?): ${countError.message}`
    );
  }
  console.log(`[${table}] filas existentes antes de cargar: ${before ?? 0}`);

  if (DRY_RUN) {
    console.log(`[${table}] --dry-run: se cargarían ${rows.length} filas (sin escribir).`);
    return;
  }

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict, ignoreDuplicates: false });
    if (error) {
      throw new Error(`[${table}] error en lote ${i}-${i + batch.length}: ${error.message}`);
    }
    console.log(`[${table}] cargado lote ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  const { count: after } = await supabase.from(table).select('*', { count: 'exact', head: true });
  console.log(`[${table}] filas existentes después de cargar: ${after ?? 0}`);
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL en .env.local');
  if (!serviceKey) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local. Este script no degrada a la clave anónima: ' +
        'cargar miles de filas con esa clave fallaría silenciosamente contra RLS o quedaría con el privilegio incorrecto.'
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(DRY_RUN ? '=== MODO --dry-run: no se escribirá nada ===' : '=== Carga real a Supabase ===');

  const auditRows = parseCsv(path.join(ROOT, 'datos', 'data_quality_audit.csv')).map((r) => ({
    stage: r.etapa,
    category: r.categoria,
    dropped_count: toNumOrNull(r.conteo) ?? 0,
  }));
  await upsertInBatches(supabase, 'risa_etl_quality_audit', auditRows, 'stage,category');

  const sampleRows = parseCsv(path.join(ROOT, 'datos', 'raw_data_sample.csv')).map((r) => ({
    source_file: r.source_file,
    patient_id: r.patient_id,
    device_id: r.device_id,
    variable_code: r.variable_code,
    raw_timestamp: r.raw_timestamp,
    raw_value: r.raw_value,
    unit: r.unit,
    quality_flag: r.quality_flag,
    signal_quality: toNumOrNull(r.signal_quality),
    was_kept_in_clean: toBool(r.was_kept_in_clean),
    rejection_reason: r.rejection_reason,
  }));
  await upsertInBatches(
    supabase,
    'risa_raw_data_sample',
    sampleRows,
    'source_file,patient_id,device_id,variable_code,raw_timestamp'
  );

  console.log('=== Listo ===');
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
