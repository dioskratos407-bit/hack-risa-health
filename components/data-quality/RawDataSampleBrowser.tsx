'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RawSampleRow } from '@/lib/dataQualityAudit';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const RawDataSampleBrowser: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<string>('ALL');
  const [keptFilter, setKeptFilter] = useState<'ALL' | 'KEPT' | 'DROPPED'>('ALL');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const [rows, setRows] = useState<RawSampleRow[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSample = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sourceFile !== 'ALL') params.append('sourceFile', sourceFile);
      if (keptFilter === 'KEPT') params.append('kept', 'true');
      if (keptFilter === 'DROPPED') params.append('kept', 'false');
      if (patientSearch.trim()) params.append('patientId', patientSearch.trim());
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const res = await fetch(`/api/data-quality?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'No se pudo cargar la muestra cruda.');
        return;
      }

      setRows(json.sample || []);
      setTotalRows(json.sampleTotal || 0);
      setTotalPages(json.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error de red al consultar los datos.');
    } finally {
      setLoading(false);
    }
  }, [sourceFile, keptFilter, patientSearch, page]);

  useEffect(() => {
    fetchSample();
  }, [fetchSample]);

  const handleSourceChange = (src: string) => {
    setSourceFile(src);
    setPage(1);
  };

  const handleKeptChange = (status: 'ALL' | 'KEPT' | 'DROPPED') => {
    setKeptFilter(status);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSample();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Explorador de Muestra Cruda Estratificada (~12,000 Filas)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registros originales directos antes de filtrado, etiquetados con trazabilidad de destino (<code className="font-mono text-slate-700">was_kept_in_clean</code>) y motivo de rechazo
          </p>
        </div>
        <button
          onClick={() => fetchSample()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Source File Filter Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Fuente de Datos
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'Todas las Fuentes' },
              { id: 'observations', label: 'Vital Signs (Clínico)' },
              { id: 'device_observations', label: 'Monitores Dispositivo' },
              { id: 'wearable_observations', label: 'Wearables' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSourceChange(tab.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  sourceFile === tab.id
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kept Status Filter Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Estado de Calidad
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'KEPT', label: 'Conservados en Limpio' },
              { id: 'DROPPED', label: 'Descartados por Filtro' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleKeptChange(tab.id as any)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  keptFilter === tab.id
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search by Patient */}
        <form onSubmit={handleSearchSubmit} className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Buscar por Paciente
          </span>
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Ej. PAT-0002"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-44"
            />
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Fuente</th>
                <th className="py-2.5 px-3">Paciente</th>
                <th className="py-2.5 px-3">Dispositivo</th>
                <th className="py-2.5 px-3">Variable & Valor Crudo</th>
                <th className="py-2.5 px-3">Calidad Señal</th>
                <th className="py-2.5 px-3">Timestamp Crudo</th>
                <th className="py-2.5 px-3">Estado Limpio</th>
                <th className="py-2.5 px-3">Motivo Descarte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={8} className="py-3 px-3">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No se encontraron registros en la muestra para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {r.source_file}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {r.patient_id || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      {r.device_id || '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{r.variable_code}</span>:{' '}
                      <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {r.raw_value ?? 'NULL'}
                      </span>{' '}
                      <span className="text-slate-400 text-[11px]">{r.unit || ''}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {r.quality_flag ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            r.quality_flag === 'OK'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {r.quality_flag}
                        </span>
                      ) : r.signal_quality !== null ? (
                        <span className="font-mono text-slate-600">
                          Q: {r.signal_quality}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {r.raw_timestamp ? r.raw_timestamp.replace('T', ' ').replace('Z', '') : '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {r.was_kept_in_clean ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Conservado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Descartado
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {r.rejection_reason ? (
                        <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {r.rejection_reason}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Aprobado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-800">{rows.length}</span> de{' '}
            <span className="font-bold text-slate-800">{totalRows.toLocaleString()}</span> registros coincidentes
            (Página {page} de {totalPages || 1})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <span className="px-2 font-mono font-bold text-slate-700">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawDataSampleBrowser;
