'use client';

import React from 'react';
import { Sparkles, Download, FileSpreadsheet, FileText, AlertTriangle } from 'lucide-react';
import PriorityBadge from '@/components/ui/PriorityBadge';

export interface AIExplanationPanelProps {
  similarityScore?: number;
  onExportSignals?: () => void;
  onExportEvidence?: () => void;
}

export const AIExplanationPanel: React.FC<AIExplanationPanelProps> = ({
  similarityScore = 89,
  onExportSignals,
  onExportEvidence,
}) => {
  const handleExportSignalsDefault = () => {
    alert('Exportando dataset signals.csv...');
  };

  const handleExportEvidenceDefault = () => {
    alert('Exportando reporte de evidencia.csv...');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex flex-col justify-between h-full space-y-6">
      {/* Top Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Análisis de Riesgo IA
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Modelo Predictivo Clinically-Trained
              </p>
            </div>
          </div>

          <PriorityBadge priorityLevel="HIGH" />
        </div>

        {/* Similarity pill */}
        <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-lg border border-purple-100">
          <span className="text-xs font-semibold text-purple-900">
            Nivel de Coincidencia de Patrón:
          </span>
          <span className="text-sm font-extrabold text-purple-700 font-mono">
            {similarityScore}%
          </span>
        </div>

        {/* Simulated LLM / Model explanation text box */}
        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>Dictamen del Algoritmo</span>
          </div>
          <p className="text-slate-600 font-normal">
            Se ha detectado una similitud del{' '}
            <strong className="text-slate-900 font-semibold">{similarityScore}%</strong>{' '}
            con el patrón de riesgo de sepsis temprana. La frecuencia cardíaca ha
            aumentado sostenidamente en las últimas 4 horas, coincidiendo con una
            caída en la calidad de la señal. Esta trayectoria justifica una alerta de
            prioridad <strong className="text-orange-700 font-bold">ALTA</strong>.
          </p>
        </div>
      </div>

      {/* Action Export Buttons */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <button
          onClick={onExportSignals || handleExportSignalsDefault}
          className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-300" />
          <span>Exportar signals.csv</span>
          <Download className="w-4 h-4 text-slate-400 ml-auto" />
        </button>

        <button
          onClick={onExportEvidence || handleExportEvidenceDefault}
          className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Exportar evidence.csv</span>
          <Download className="w-4 h-4 text-slate-400 ml-auto" />
        </button>
      </div>
    </div>
  );
};

export default AIExplanationPanel;
