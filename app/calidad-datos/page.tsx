'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { QualitySummaryMetrics } from '@/lib/dataQualityAudit';
import { QualityFunnelChart } from '@/components/data-quality/QualityFunnelChart';
import { CategoryBreakdown } from '@/components/data-quality/CategoryBreakdown';
import { RawDataSampleBrowser } from '@/components/data-quality/RawDataSampleBrowser';
import { ShieldCheck, Info, RefreshCw, AlertCircle } from 'lucide-react';

export default function CalidadDatosPage() {
  const [metrics, setMetrics] = useState<QualitySummaryMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/data-quality?pageSize=1');
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'No se pudo obtener el resumen de auditoría ETL.');
        return;
      }
      setMetrics(json.summary);
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Auditoría de Calidad ETL & Muestra Cruda
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Trazabilidad transparente del proceso de purificación desde ~2.59M de registros crudos hasta el conjunto maestro
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchSummary()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 transition-colors cursor-pointer self-start md:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar Métricas</span>
          </button>
        </div>

        {/* Methodology & Limitations Note */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Metodología de Muestreo y Límites de Calidad</span>
          </div>
          <p className="leading-relaxed">
            El pipeline <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">clean_health_data.py</code> procesa 3 fuentes crudas independientes: observaciones clínicas directas, telemetría de monitores de cabecera y sensores vestibles (wearables). Cada fila descartada o conservada es atribuida mediante reglas deterministas (calidad de señal, deduplicación jerárquica con prioridad Clínico &gt; Monitor &gt; Wearable, rangos fisiológicos biológicos y detección de picos transitorios con Modified Z-Score).
          </p>
          <p className="text-[11px] text-slate-500 italic">
            La tabla inferior muestra una muestra estratificada reproducible de ~12,000 registros antes de cualquier filtro, asegurando que categorías con baja frecuencia (ej. picos transitorios aislados o unidades convertidas) puedan ser inspeccionadas fila a fila.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-5 py-4 rounded-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !metrics ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-80 bg-slate-100 rounded-xl" />
        </div>
      ) : metrics ? (
        <>
          {/* Funnel & Retention KPIs */}
          <QualityFunnelChart metrics={metrics} />

          {/* 15 Audit Categories Breakdown */}
          <CategoryBreakdown categories={metrics.categories} />

          {/* Raw Data Sample Browser */}
          <RawDataSampleBrowser />
        </>
      ) : null}
    </div>
  );
}
