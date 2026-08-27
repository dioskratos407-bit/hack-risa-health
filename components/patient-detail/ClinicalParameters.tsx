'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { mockClinicalParameters, ClinicalParameter } from '@/lib/mockPatientDetails';
import { Activity, TrendingUp, TrendingDown, Clock, Filter, AlertTriangle } from 'lucide-react';

export interface ClinicalParametersProps {
  parameters?: ClinicalParameter[];
  isPrioritized?: boolean;
}

export const ClinicalParameters: React.FC<ClinicalParametersProps> = ({
  parameters = mockClinicalParameters,
  isPrioritized = true,
}) => {
  const [selectedId, setSelectedId] = useState<string>('hr');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentParameter =
    parameters.find((p) => p.id === selectedId) || parameters[0];

  // Helper to format ISO date string for X-Axis tick display
  const formatDateLabel = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const hours = d.getUTCHours().toString().padStart(2, '0');
      const minutes = d.getUTCMinutes().toString().padStart(2, '0');
      const day = d.getUTCDate();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = monthNames[d.getUTCMonth()];

      if (selectedId === 'hemoglobina') {
        return `${day} ${month}`;
      }
      return `${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  // Calculate dynamic stats
  const values = currentParameter.data.map((d) => d.value);
  const latestVal = values[values.length - 1] ?? 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const minVal = values.length ? Math.min(...values) : 0;
  const unit = currentParameter.data[0]?.unit || '';

  // Chart formatted data with 3 curves
  const chartData = currentParameter.data.map((point) => ({
    timeLabel: formatDateLabel(point.date),
    valor: point.value,
    healthyBaseline: point.healthyBaseline,
    riskPattern: point.riskPattern,
    isoDate: point.date,
  }));

  const isAnomaly = selectedId === 'hr' && latestVal > 100;
  const isDrop = selectedId === 'spo2' && latestVal < 95;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header section with Select Biomarker Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Monitor de Parámetros Clínicos Multicurva
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Evolución biológica real vs. patrón de riesgo y línea base sana
            </p>
          </div>
        </div>

        {/* Select Biomarker Dropdown */}
        <div className="relative w-full sm:w-auto flex items-center">
          <div className="absolute left-3 pointer-events-none text-slate-400">
            <Filter className="h-4 w-4" />
          </div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full sm:w-auto pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
          >
            {parameters.map((param) => (
              <option key={param.id} value={param.id}>
                Biomarcador: {param.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert banner if anomaly detected */}
      {(isAnomaly || isDrop) && (
        <div className="flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {isAnomaly
                ? 'Desviación Anómala: Se detectó un incremento abrupto de la Frecuencia Cardíaca (>100 bpm).'
                : 'Desviación Anómala: Se detectó una caída en la Saturación de Oxígeno (<95%).'}
            </span>
          </div>
          <span className="font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200">
            {latestVal} {unit}
          </span>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-[340px] pt-2 min-h-[340px]">
        {isMounted ? (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              key={selectedId}
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                unit={` ${unit}`}
                domain={[(dataMin: number) => Math.floor(dataMin * 0.9), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  padding: '10px 14px',
                }}
                labelStyle={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}
                itemStyle={{ fontSize: '13px', fontWeight: 600 }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '13px', fontWeight: 600 }}
              />

              {/* Curve 1: Healthy Baseline (Dotted Green) */}
              <Line
                type="monotone"
                dataKey="healthyBaseline"
                name="Línea Base Sana"
                stroke="#22c55e"
                strokeDasharray="3 3"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e' }}
              />

              {/* Curve 2: Risk Pattern / Sepsis (Dashed Red - Rendered if prioritized) */}
              {isPrioritized && (
                <Line
                  type="monotone"
                  dataKey="riskPattern"
                  name="Patrón de Riesgo / Sepsis"
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#ef4444' }}
                />
              )}

              {/* Curve 3: Current Patient Real Measurement (Solid Blue Thick) */}
              <Line
                type="monotone"
                dataKey="valor"
                name="Paciente Actual"
                stroke="#2563eb"
                strokeWidth={3.5}
                dot={{ r: 5, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[340px] flex items-center justify-center text-slate-400 text-xs font-medium">
            Cargando gráfica de biomarcadores...
          </div>
        )}
      </div>

      {/* Bottom Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Última Medición
            </span>
            <span className={`text-xl font-extrabold mt-1 block font-mono ${isAnomaly || isDrop ? 'text-red-600' : 'text-slate-900'}`}>
              {latestVal} {unit}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Máximo Histórico
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
              {maxVal} {unit}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Mínimo Histórico
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block font-mono">
              {minVal} {unit}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-100 text-orange-700">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalParameters;
