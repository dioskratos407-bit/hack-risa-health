'use client';

import React from 'react';
import { Sparkles, Download, FileSpreadsheet, FileText, ShieldCheck, Database } from 'lucide-react';

export interface ObservationRecord {
  id: string;
  type: 'PRIMARY' | 'SUPPORTING';
  description: string;
}

export interface ExplainabilityPanelProps {
  onExportSignals?: () => void;
  onExportEvidence?: () => void;
}

export const evidenceRecords: ObservationRecord[] = [
  { id: 'WOBS-0001', type: 'PRIMARY', description: 'ECG ST Elevation & Tachypnea' },
  { id: 'DOBS-0042', type: 'SUPPORTING', description: 'SpO2 Desaturation Trend' },
  { id: 'SOBS-0108', type: 'SUPPORTING', description: 'Autonomic HRV Decline' },
];

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  onExportSignals,
  onExportEvidence,
}) => {
  const handleExportSignalsDefault = () => {
    alert('Descargando dataset signals.csv...');
  };

  const handleExportEvidenceDefault = () => {
    alert('Descargando reporte de evidencia.csv...');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex flex-col justify-between h-full space-y-6">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Justificación Clínica de la IA
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Explicabilidad del Modelo RISA
            </p>
          </div>
        </div>

        {/* AI Dictamen Box */}
        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Dictamen Automatizado</span>
          </div>
          <p className="text-slate-600 font-normal text-xs md:text-sm">
            Se ha detectado una correlación del{' '}
            <strong className="text-slate-900 font-semibold">89%</strong> con el patrón de declive por sepsis. La frecuencia cardíaca cruzó el umbral de riesgo a las 10:00, coincidiendo con una alteración en los niveles de SpO2. Evidencia soportada por fuentes de monitoreo continuo.
          </p>
        </div>

        {/* Traceability Observations Table */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Registros de Evidencia</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
            {evidenceRecords.map((record) => (
              <div
                key={record.id}
                className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">
                    {record.id}
                  </span>
                  <span className="text-slate-500 font-medium truncate max-w-[130px]">
                    {record.description}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                    record.type === 'PRIMARY'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {record.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Official Export Buttons */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <button
          onClick={onExportSignals || handleExportSignalsDefault}
          className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-300" />
          <span>Descargar signals.csv</span>
          <Download className="w-4 h-4 text-slate-400 ml-auto" />
        </button>

        <button
          onClick={onExportEvidence || handleExportEvidenceDefault}
          className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Descargar evidence.csv</span>
          <Download className="w-4 h-4 text-slate-400 ml-auto" />
        </button>
      </div>
    </div>
  );
};

export default ExplainabilityPanel;
