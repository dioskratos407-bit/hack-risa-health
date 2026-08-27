'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CrossDataCorrelations as CorrelationsData } from '@/lib/dataCorrelations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import {
  GitCompare,
  WifiOff,
  HeartPulse,
  FlaskConical,
  Database,
  Info,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { CrossTableSchemaGraph } from '@/components/prioritized/CrossTableSchemaGraph';

export const CrossDataCorrelations: React.FC = () => {
  const [data, setData] = useState<CorrelationsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCorrelations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/correlations');
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'No se pudieron calcular las correlaciones cruzadas.');
        return;
      }
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión al cargar correlaciones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCorrelations();
  }, [fetchCorrelations]);

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>{error || 'No hay datos de correlación disponibles.'}</span>
            </div>
            <button
              onClick={() => fetchCorrelations()}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        </div>
        <CrossTableSchemaGraph />
      </div>
    );
  }

  const {
    totalPatientsInRoster,
    connectivityVsAlerts,
    conditionsVsPriority,
    labsVsInsights,
    coverage,
  } = data;

  const withIssuesPct =
    connectivityVsAlerts.withIssuesTotal > 0
      ? Math.round((connectivityVsAlerts.withIssuesHighRiskCount / connectivityVsAlerts.withIssuesTotal) * 100)
      : 0;

  const withoutIssuesPct =
    connectivityVsAlerts.withoutIssuesTotal > 0
      ? Math.round(
          (connectivityVsAlerts.withoutIssuesHighRiskCount / connectivityVsAlerts.withoutIssuesTotal) * 100
        )
      : 0;

  const labsDangerPct =
    labsVsInsights.outOfRangeTotal > 0
      ? Math.round(
          (labsVsInsights.outOfRangeWithDangerInsightCount / labsVsInsights.outOfRangeTotal) * 100
        )
      : 0;

  // Chart data for Connectivity vs Risk
  const connectivityChartData = [
    {
      group: 'Con Fallas Red',
      criticosAltos: connectivityVsAlerts.withIssuesHighRiskCount,
      otros: Math.max(0, connectivityVsAlerts.withIssuesTotal - connectivityVsAlerts.withIssuesHighRiskCount),
    },
    {
      group: 'Sin Fallas Red',
      criticosAltos: connectivityVsAlerts.withoutIssuesHighRiskCount,
      otros: Math.max(0, connectivityVsAlerts.withoutIssuesTotal - connectivityVsAlerts.withoutIssuesHighRiskCount),
    },
  ];

  // Chart data for Conditions vs Priority
  const allCategories = Array.from(
    new Set([
      ...conditionsVsPriority.topCategoriesCriticalHigh.map((c) => c.category),
      ...conditionsVsPriority.topCategoriesOther.map((c) => c.category),
    ])
  ).slice(0, 4);

  const conditionsChartData = allCategories.map((cat) => {
    const critCount = conditionsVsPriority.topCategoriesCriticalHigh.find((c) => c.category === cat)?.count || 0;
    const otherCount = conditionsVsPriority.topCategoriesOther.find((c) => c.category === cat)?.count || 0;
    return {
      category: cat.replace('_HISTORY', '').replace(/_/g, ' '),
      'Alto Riesgo': critCount,
      Otros: otherCount,
    };
  });

  // Chart data for Table Coverage
  const coverageChartData = coverage.map((cov) => ({
    name: cov.label,
    pacientes: cov.patientCount,
    coberturaPct: totalPatientsInRoster > 0 ? Math.round((cov.patientCount / totalPatientsInRoster) * 100) : 0,
  }));

  return (
    <div className="space-y-8">
      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Correlaciones Cruzadas Multi-Fuente & Gráficos Estadísticos
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Cruce visual entre telemetría de conectividad, antecedentes clínicos, laboratorios y niveles de alerta del roster ({totalPatientsInRoster} pacientes)
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchCorrelations()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar Cruces</span>
          </button>
        </div>

        {/* 4 Graphical Relationship Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Conectividad vs Alertas de Alto Riesgo */}
          <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Conectividad Problemática vs. Nivel de Alerta
                  </h3>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  {withIssuesPct}% vs {withoutIssuesPct}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Comparativa de pacientes con incidentes de red vs pacientes estables según severidad
              </p>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-44 w-full relative">
              {mounted ? (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={connectivityChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="criticosAltos" name="Críticos / Altos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="otros" name="Otros Pacientes" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
              )}
            </div>

            {connectivityVsAlerts.statusBreakdown.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Incidentes:</span>
                {connectivityVsAlerts.statusBreakdown.map((sb) => (
                  <span
                    key={sb.status}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {sb.status}: {sb.patientCount} pac.
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 2. Antecedentes Activos vs Prioridad */}
          <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Antecedentes Activos por Estrato de Riesgo
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {conditionsVsPriority.criticalHighPatientTotal} en Alto Riesgo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Frecuencia de comorbilidades activas en pacientes críticos vs resto de la población
              </p>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-44 w-full relative">
              {mounted ? (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={conditionsChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Alto Riesgo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Otros" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Categorías ordenadas por impacto fisiológico y prevalencia clínica.
            </div>
          </div>

          {/* 3. Labs Fuera de Rango vs Hallazgos Peligrosos IA */}
          <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Laboratorios Alterados vs. Diagnóstico IA
                  </h3>
                </div>
                <span className="text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md">
                  {labsDangerPct}% Concordancia
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pacientes con biomarcadores fuera de rango que dispararon anomalías de peligro en IA
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Pacientes con laboratorios fuera de rango:</span>
                <span className="text-sm font-black font-mono text-cyan-700">{labsVsInsights.outOfRangeTotal}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Con anomalía crítica detectada por Gemini:</span>
                <span className="text-sm font-black font-mono text-rose-600">
                  {labsVsInsights.outOfRangeWithDangerInsightCount} ({labsDangerPct}%)
                </span>
              </div>

              {/* Progress Visual Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-600 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, labsDangerPct))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Evaluación contra límites séricos de referencia <code className="font-mono text-[10px]">[reference_low, reference_high]</code>.
            </div>
          </div>

          {/* 4. Cobertura por Tabla Clínica */}
          <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Cobertura de Pacientes por Dominio Clínico
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {totalPatientsInRoster} pac. total
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Disponibilidad de registros únicos en cada tabla de la base de datos
              </p>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-44 w-full relative">
              {mounted ? (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={coverageChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <XAxis type="number" domain={[0, totalPatientsInRoster]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
                    <Tooltip
                      formatter={(val: any) => [`${val} pacientes`, 'Cobertura']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="pacientes" fill="#10b981" radius={[0, 4, 4, 0]}>
                      {coverageChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : index === 2 ? '#8b5cf6' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse" />
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Dispositivos (<code className="font-mono text-[10px]">risa_devices</code>) cubre ~100% de la población.
            </div>
          </div>
        </div>

        {/* Statistical Disclaimer Note */}
        <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-4 text-xs text-blue-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Nota metodológica de interpretación:</span> Las correlaciones presentadas corresponden a conteos y proporciones descriptivas sobre una cohorte clínica de {totalPatientsInRoster} pacientes. No constituyen un estudio inferencial ni garantizan causalidad, sino que ilustran la concordancia cruzada entre las fuentes de telemetría, eventos de red, antecedentes y el motor de alertas.
          </p>
        </div>
      </div>

      {/* Cross-Database Join Graph & Architecture Topology */}
      <CrossTableSchemaGraph />
    </div>
  );
};

export default CrossDataCorrelations;
