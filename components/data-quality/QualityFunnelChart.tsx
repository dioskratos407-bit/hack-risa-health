'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Filter, CheckCircle2, AlertTriangle, Layers, Activity } from 'lucide-react';
import { QualitySummaryMetrics } from '@/lib/dataQualityAudit';

interface QualityFunnelChartProps {
  metrics: QualitySummaryMetrics;
}

const STAGE_COLORS = ['#3b82f6', '#0ea5e9', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

export const QualityFunnelChart: React.FC<QualityFunnelChartProps> = ({ metrics }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { totalRawRecords, totalCleanRecords, totalDroppedRecords, retentionRatePercent, categories } =
    metrics;

  // Agrupación por etapa
  const stageGroups = [
    {
      stageKey: '1.1',
      name: '1.1 Vital Signs',
      desc: 'Observaciones clínicas directas',
      dropped: categories
        .filter((c) => c.stage.includes('1.1') && c.category.startsWith('descartado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
      recovered: categories
        .filter((c) => c.stage.includes('1.1') && c.category.startsWith('recuperado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
    },
    {
      stageKey: '1.2',
      name: '1.2 Dispositivos',
      desc: 'Monitores continuos de cabecera',
      dropped: categories
        .filter((c) => c.stage.includes('1.2') && c.category.startsWith('descartado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
      recovered: 0,
    },
    {
      stageKey: '1.3',
      name: '1.3 Wearables',
      desc: 'Dispositivos vestibles / remotos',
      dropped: categories
        .filter((c) => c.stage.includes('1.3') && c.category.startsWith('descartado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
      recovered: 0,
    },
    {
      stageKey: '2.',
      name: '2.0 Deduplicación',
      desc: 'Jerarquía Clínico > Monitor > Wearable',
      dropped: categories
        .filter((c) => c.stage.includes('2.') && c.category.startsWith('descartado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
      recovered: 0,
    },
    {
      stageKey: '3.',
      name: '3.0 Rango Biológico',
      desc: 'Límites fisiológicos y tipado',
      dropped: categories
        .filter((c) => c.stage.includes('3.') && c.category.startsWith('descartado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
      recovered: 0,
    },
    {
      stageKey: '4.',
      name: '4.0 Picos Transitorios',
      desc: 'Glitches y ruido no persistente',
      dropped: categories
        .filter((c) => c.stage.includes('4.') && c.category.startsWith('descartado_'))
        .reduce((acc, c) => acc + c.dropped_count, 0),
      recovered: 0,
    },
  ];

  const chartData = stageGroups.map((g) => ({
    name: g.name,
    descartados: g.dropped,
    recuperados: g.recovered,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Crudo Ingresado
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalRawRecords.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">3 archivos fuente (vitales, dispositivos, wearables)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Descartados
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">
              {totalDroppedRecords.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {((totalDroppedRecords / totalRawRecords) * 100).toFixed(1)}% del volumen crudo total
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registros Limpios (Master)
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              {totalCleanRecords.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Base operativa para reglas e IA</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-blue-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tasa de Retención
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
              {retentionRatePercent.toFixed(1)}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, retentionRatePercent))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Visual Bars */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Embudo de Purificación por Etapa ETL
            </h3>
            <p className="text-xs text-slate-500">
              Registros filtrados y normalizados secuencialmente desde las fuentes crudas hasta el conjunto maestro
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
              <span className="text-slate-600">Descartados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-600">Recuperados / Normalizados</span>
            </div>
          </div>
        </div>

        {/* Stage Cards Progression */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageGroups.map((stage, idx) => (
            <div
              key={stage.stageKey}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{stage.name}</span>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                  Etapa {idx + 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{stage.desc}</p>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Descartes</span>
                  <span className="text-sm font-bold font-mono text-rose-600">
                    {stage.dropped.toLocaleString()}
                  </span>
                </div>
                {stage.recovered > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Recuperados</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">
                      +{stage.recovered.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recharts Bar Comparison */}
        <div className="pt-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Magnitud de Descartes por Etapa
          </h4>
          <div className="h-64 w-full min-h-[250px] relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                  <Tooltip
                    formatter={(val: any) => [Number(val).toLocaleString(), 'Registros']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="descartados" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityFunnelChart;
