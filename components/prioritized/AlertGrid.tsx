'use client';

import React from 'react';
import Link from 'next/link';
import { PrioritizedPatient } from '@/lib/mockPrioritized';
import PriorityBadge from '@/components/ui/PriorityBadge';
import { AlertTriangle, Clock, ArrowRight, BrainCircuit } from 'lucide-react';

export interface AlertGridProps {
  patients: PrioritizedPatient[];
}

export const AlertGrid: React.FC<AlertGridProps> = ({ patients }) => {
  const getTopBorderStyle = (priority: PrioritizedPatient['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-t-4 border-red-600';
      case 'HIGH':
        return 'border-t-4 border-orange-500';
      case 'MEDIUM':
        return 'border-t-4 border-yellow-500';
      default:
        return 'border-t-4 border-slate-400';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 0.85) return 'bg-red-600 text-red-700';
    if (score >= 0.70) return 'bg-orange-500 text-orange-700';
    return 'bg-yellow-500 text-yellow-700';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {patients.length === 0 ? (
        <div className="col-span-full bg-white rounded-xl p-12 border border-slate-200 text-center text-slate-400 font-medium">
          No hay alertas de pacientes en esta categoría de prioridad.
        </div>
      ) : (
        patients.map((patient) => {
          const percentage = Math.round(patient.riskScore * 100);
          return (
            <div
              key={patient.id}
              className={`bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow duration-200 border border-slate-200 flex flex-col justify-between overflow-hidden ${getTopBorderStyle(
                patient.priority
              )}`}
            >
              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Header: Patient Name, ID & Priority Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight font-mono">
                      {patient.id}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {patient.timestamp}
                      </span>
                      {patient.hasDiagnosis && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                          <BrainCircuit className="w-3 h-3" />
                          {patient.insightCount}{' '}
                          {patient.insightCount === 1 ? 'diagnóstico' : 'diagnósticos'}
                        </span>
                      )}
                    </div>
                  </div>

                  <PriorityBadge priorityLevel={patient.priority} />
                </div>

                {/* Middle: Risk Score Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      Score de Riesgo Clínico
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {percentage}% ({patient.riskScore.toFixed(2)})
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${getProgressColor(
                        patient.riskScore
                      ).split(' ')[0]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Reason Box */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70 flex items-start gap-2.5">
                  {patient.source === 'DIAGNOSIS' ? (
                    <BrainCircuit className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                      {patient.source === 'DIAGNOSIS' ? 'Análisis contextual de IA' : 'Motor de reglas'}
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {patient.alertReason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                <Link
                  href={`/pacientes/${patient.id}`}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Revisar Expediente Clínico</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AlertGrid;
