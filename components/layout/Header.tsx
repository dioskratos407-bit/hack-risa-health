'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight, Play, Square, Activity, Clock } from 'lucide-react';
import { useGlobalSimulation } from '@/components/simulation/GlobalSimulationContext';

function formatClockLabel(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface HeaderProps {
  onOpenSidebar: () => void;
  title?: string;
  category?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  title,
  category = 'Plataforma Clínica',
}) => {
  const pathname = usePathname();
  const { running, start, stop, alertsThisSession, insightsThisSession, ticks, passesCompleted, focusedPatientId, focusedCursor } =
    useGlobalSimulation();

  const getTitle = () => {
    if (title) return title;
    if (pathname === '/pacientes') return 'Directorio de Pacientes';
    if (pathname === '/priorizados') return 'Pacientes Priorizados';
    if (pathname.startsWith('/pacientes/')) return 'Expediente del Paciente';
    return 'Dashboard General';
  };

  return (
    <header className="h-16 w-full bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Left side: Mobile Menu Button & Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Context Title / Breadcrumb */}
        <div className="flex items-center text-sm">
          <span className="text-slate-400 font-medium hidden sm:inline">
            {category}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-300 mx-1.5 hidden sm:inline" />
          <h1 className="text-slate-800 font-semibold text-sm sm:text-base">
            {getTitle()}
          </h1>
        </div>
      </div>

      {/* Right side: Global Simulation Control & Generic User Profile */}
      <div className="flex items-center gap-3">
        {/* System-wide Simulated Clock Control */}
        <div className="hidden sm:flex items-center gap-2">
          {running && (
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-mono"
              title={
                focusedPatientId
                  ? `Reloj del paciente enfocado (${focusedPatientId})`
                  : 'Vueltas completas sobre el roster de 100 pacientes'
              }
            >
              <Clock className="w-3 h-3" />
              {focusedPatientId && focusedCursor
                ? `${focusedPatientId} · ${formatClockLabel(focusedCursor)}`
                : `Vuelta ${passesCompleted + 1} · ${ticks} ticks`}
            </span>
          )}
          {running && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Activity className="w-3 h-3 animate-pulse" />
              {alertsThisSession} alertas · {insightsThisSession} análisis IA
            </span>
          )}
          <button
            onClick={running ? stop : start}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer border ${
              running
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            }`}
            title="Avanza el tiempo simulado para todo el roster de pacientes, generando alertas en tiempo real"
          >
            {running ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{running ? 'Detener Simulación' : 'Iniciar Simulación del Sistema'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pl-3 py-1 border-l border-slate-100 sm:border-l-0">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              Dr. RISA - Red Integrada
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Médico Especialista
            </span>
          </div>

          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center border border-blue-200 shadow-xs shrink-0">
            DR
          </div>
        </div>
      </div>
    </header>
  );
};
