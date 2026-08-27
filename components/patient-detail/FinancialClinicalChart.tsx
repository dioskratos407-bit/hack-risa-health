'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TimeFilterRange,
  DataPoint,
  FILTER_OPTIONS,
  downsampleData,
  formatFinancialDate,
  formatFullTooltipDate,
} from '@/lib/downsample';
import { TrendingUp, TrendingDown, Clock, ShieldAlert, ChevronDown } from 'lucide-react';

export interface FinancialClinicalChartProps {
  rawData: DataPoint[];
  timeTISO: string;
  variableName?: string;
  variableUnit?: string;
  lineColor?: string;
  title?: string;
}

// Custom Google Finance Style Tooltip
const FinancialCustomTooltip = ({ active, payload, unit }: any) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0].payload;
    const rawVal = payload[0].value;
    const formattedVal = typeof rawVal === 'number' ? rawVal.toFixed(2) : rawVal;
    const formattedDate = formatFullTooltipDate(dataObj.timestamp);

    return (
      <div className="bg-[#1e222d] border border-[#2a2e39] shadow-xl rounded-lg px-3.5 py-2 text-white flex items-baseline gap-2 z-50">
        <span className="text-base font-extrabold tracking-tight text-white">
          {formattedVal} <span className="text-xs font-normal text-slate-400">{unit}</span>
        </span>
        <span className="text-xs font-medium text-slate-300">
          {formattedDate}
        </span>
      </div>
    );
  }
  return null;
};

export const FinancialClinicalChart: React.FC<FinancialClinicalChartProps> = ({
  rawData = [],
  timeTISO,
  variableName = 'HR',
  variableUnit = 'bpm',
  lineColor = '#f43f5e', // Google Finance / Trading Pink Accent
  title = 'Tendencia',
}) => {
  const [filterRange, setFilterRange] = useState<TimeFilterRange>('5H');

  // Procesar datos con submuestreo y filtrado relativo a timeT
  const processedData = useMemo(() => {
    return downsampleData(rawData, filterRange, timeTISO);
  }, [rawData, filterRange, timeTISO]);

  // Cálculos métricos para el encabezado financiero
  const values = processedData.map((d) => Number(d.value)).filter((v) => !isNaN(v));
  const latestValue = values.length > 0 ? values[values.length - 1] : null;
  const firstValue = values.length > 0 ? values[0] : null;

  let changeDiff = 0;
  let changePercent = 0;
  if (latestValue !== null && firstValue !== null && firstValue !== 0) {
    changeDiff = latestValue - firstValue;
    changePercent = (changeDiff / firstValue) * 100;
  }

  const isPositive = changeDiff >= 0;
  const activeOptionLabel = FILTER_OPTIONS.find((o) => o.value === filterRange)?.label || filterRange;

  return (
    <div className="bg-[#131722] text-slate-100 rounded-2xl p-5 border border-[#2a2e39] shadow-2xl space-y-4">
      {/* Header: Title, Metric Summary & Dropdown Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#2a2e39]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-400 tracking-wide uppercase">
              {title} de {variableName}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1e222d] text-slate-300 border border-[#2a2e39]">
              Reloj T &le; {timeTISO.replace('T', ' ').replace('Z', '')}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {latestValue !== null ? latestValue.toFixed(2) : '--'}
              <span className="text-sm font-normal text-slate-400 ml-1">{variableUnit}</span>
            </span>

            {latestValue !== null && firstValue !== null && (
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                  isPositive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {changeDiff.toFixed(2)} ({isPositive ? '+' : ''}
                  {changePercent.toFixed(2)}%)
                </span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  en {activeOptionLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Selector de Escalas de Tiempo (Estilo Trading) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Full Custom Dropdown with all 14 Time Scales */}
          <div className="relative flex items-center bg-[#1e222d] border border-[#2a2e39] rounded-xl px-3 py-2 shadow-sm hover:border-slate-500 transition-all">
            <Clock className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Escala Temporal
              </span>
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value as TimeFilterRange)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-4 appearance-none"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#18191c] text-white py-1">
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Recharts AreaChart con Gradiente Financiero */}
      <div className="w-full h-[300px] relative">
        {processedData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 text-slate-600 animate-pulse" />
            <p className="text-sm font-medium">Sin datos para la escala ({activeOptionLabel}) antes de timeT</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={processedData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="financialGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="2 4" stroke="#2a2e39" vertical={false} />

              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => formatFinancialDate(val, filterRange)}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={{ stroke: '#2a2e39' }}
                tickLine={false}
              />

              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                content={<FinancialCustomTooltip unit={variableUnit} />}
                cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#financialGradient)"
                activeDot={{
                  r: 6,
                  fill: lineColor,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Meta info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-[#2a2e39]">
        <span>
          Escala activa: <strong className="text-blue-400">{activeOptionLabel}</strong> &bull; Puntos renderizados: <strong className="text-slate-300">{processedData.length}</strong>
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldAlert className="w-3 h-3 text-emerald-400" /> Filtro anti-fuga futuro activo
        </span>
      </div>
    </div>
  );
};
