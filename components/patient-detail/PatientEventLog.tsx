'use client';

import React from 'react';
import { mockPatientEvents, PatientEvent, EventType } from '@/lib/mockPatientDetails';
import { Clock, ShieldAlert, FileSpreadsheet, LogIn, Syringe } from 'lucide-react';

export interface PatientEventLogProps {
  events?: PatientEvent[];
}

export const PatientEventLog: React.FC<PatientEventLogProps> = ({
  events = mockPatientEvents,
}) => {
  const getBadgeStyle = (type: EventType) => {
    switch (type) {
      case 'INGRESO':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EXAMEN':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'TRATAMIENTO':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ALERTA':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'INGRESO':
        return <LogIn className="w-4 h-4 text-blue-600" />;
      case 'EXAMEN':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'TRATAMIENTO':
        return <Syringe className="w-4 h-4 text-purple-600" />;
      case 'ALERTA':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  // Helper to format ISO timestamp into clean local Spanish representation
  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const day = d.getUTCDate().toString().padStart(2, '0');
      const monthNames = ['Ago', 'Ago', 'Ago', 'Ago', 'Ago', 'Ago', 'Ago', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = 'Ago'; // 2026-08
      const year = d.getUTCFullYear();
      const hours = d.getUTCHours().toString().padStart(2, '0');
      const minutes = d.getUTCMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year} - ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Registro Cronológico de Eventos Clínicos
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Línea de tiempo auditada de ingresos, exámenes, tratamientos y alertas
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-center">
          {events.length} Eventos Registrados
        </span>
      </div>

      {/* Vertical Timeline Container */}
      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event) => (
          <div key={event.id} className="relative group">
            {/* Connector Node / Circle */}
            <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-blue-600 transition-colors shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-600 transition-colors" />
            </div>

            {/* Event Item Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 hover:bg-slate-100/50 hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(
                      event.type
                    )}`}
                  >
                    {getEventIcon(event.type)}
                    <span>{event.type}</span>
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {event.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatTimestamp(event.timestamp)}</span>
                </div>
              </div>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                {event.description}
              </p>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                <span>ID de Registro: <strong className="text-slate-700 font-mono">{event.id}</strong></span>
                <span className="text-[11px] text-slate-400 font-mono">ISO: {event.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientEventLog;
