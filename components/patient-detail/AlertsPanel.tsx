'use client';

import React from 'react';
import { AlertTriangle, Clock, WifiOff } from 'lucide-react';

export interface AlertRecord {
  id: string | number;
  patient_id: string;
  variable_code: string;
  value: number | null;
  timestamp: string;
  severity: 'WARNING' | 'CRITICAL';
  rule_reason: string;
  kind: 'VALUE_ANOMALY' | 'DATA_GAP';
  priority_tier: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority_score?: number;
}

export interface AlertsPanelProps {
  alerts: AlertRecord[];
}

const getTopBorderStyle = (tier: AlertRecord['priority_tier']) => {
  if (tier === 'CRITICAL') return 'border-t-4 border-red-600';
  if (tier === 'HIGH') return 'border-t-4 border-orange-500';
  return 'border-t-4 border-amber-500';
};

const getTierBadge = (tier: AlertRecord['priority_tier']) => {
  if (tier === 'CRITICAL') return 'bg-red-50 text-red-700 border-red-200';
  if (tier === 'HIGH') return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Alertas Priorizadas de la Simulación
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Motor de reglas + patrones de gestión de falsas alarmas (prioridad ≥ MEDIA)
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-8">
          Sin alertas relevantes hasta el momento simulado actual.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border border-slate-200 overflow-hidden ${getTopBorderStyle(alert.priority_tier)}`}
            >
              <div className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{alert.variable_code}</span>
                      {alert.value !== null && (
                        <span className="font-mono text-xs text-slate-600">{alert.value}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp.replace('T', ' ').replace('Z', '')}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${getTierBadge(
                      alert.priority_tier
                    )}`}
                  >
                    {alert.priority_tier}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70 flex items-start gap-2.5">
                  {alert.kind === 'DATA_GAP' ? (
                    <WifiOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{alert.rule_reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
