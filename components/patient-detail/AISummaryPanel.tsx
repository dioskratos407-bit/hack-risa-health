'use client';

import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { defaultAiClinicalSummary } from '@/lib/mockPatientDetails';

export interface AISummaryPanelProps {
  summary?: string;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({
  summary = defaultAiClinicalSummary,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/60 border border-blue-100 rounded-xl shadow-xs p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Síntesis Clínica de IA
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Motor predictivo de soporte a la decisión médica
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold bg-indigo-100/80 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
          Soporte Clínico Activo
        </span>
      </div>

      {/* Main Summary Text */}
      <p className="text-slate-700 leading-relaxed font-normal text-xs sm:text-sm pt-1">
        {summary}
      </p>

      {/* Disclaimer Note */}
      <div className="pt-2 border-t border-indigo-100/60 flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>
          Análisis generado por IA como soporte a la decisión clínica. El médico debe validar la evidencia.
        </span>
      </div>
    </div>
  );
};

export default AISummaryPanel;
