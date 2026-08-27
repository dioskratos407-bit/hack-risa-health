'use client';

import React from 'react';
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
import { mockDigitalTwinData, DigitalTwinPoint } from '@/lib/mockTwinData';
import { Activity, ShieldAlert } from 'lucide-react';

export interface DigitalTwinChartProps {
  data?: DigitalTwinPoint[];
  title?: string;
}

export const DigitalTwinChart: React.FC<DigitalTwinChartProps> = ({
  data = mockDigitalTwinData,
  title = 'Análisis de Trayectoria vs. Patrón de Riesgo',
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex flex-col justify-between h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Evolución temporal del Gemelo Digital (Frecuencia Cardíaca - 12 Horas)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-800">
          <ShieldAlert className="h-4 w-4 text-orange-600 shrink-0" />
          <span className="text-xs font-semibold">
            Umbral Crítico Superado a las 10:00
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[360px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              unit=" bpm"
              domain={[60, 150]}
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
              wrapperStyle={{ paddingBottom: '16px', fontSize: '13px', fontWeight: 500 }}
            />

            {/* Base Curve: Historical Risk Shadow */}
            <Line
              type="monotone"
              dataKey="riskPatternHR"
              name="Patrón Histórico de Riesgo"
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#94a3b8' }}
            />

            {/* Patient Real-time Curve */}
            <Line
              type="monotone"
              dataKey="patientHR"
              name="Frecuencia Cardíaca Paciente"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Details */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Frecuencia de telemetría: Continuo (5 sec sync)</span>
        <span className="font-semibold text-slate-700">Similitud de Modelo: 89.4%</span>
      </div>
    </div>
  );
};

export default DigitalTwinChart;
