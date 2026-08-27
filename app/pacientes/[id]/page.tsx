'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { getPatientDetailById } from '@/lib/mockTwinData';
import { PatientHeader } from '@/components/patient-detail/PatientHeader';
import { AIClinicalInsights } from '@/components/patient-detail/AIClinicalInsights';
import { DocumentRepository } from '@/components/patient-detail/DocumentRepository';
import { ClinicalParameters } from '@/components/patient-detail/ClinicalParameters';
import { PatientEventLog } from '@/components/patient-detail/PatientEventLog';
import { TimeTravelClock } from '@/components/patient-detail/TimeTravelClock';
import { FileText, Activity, Clock, History } from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'PAT-0001';
  const patient = getPatientDetailById(rawId);

  // Active tab state: 'documentos' | 'parametros' | 'eventos' | 'reloj'
  const [activeTab, setActiveTab] = useState<'reloj' | 'parametros' | 'documentos' | 'eventos'>('reloj');

  const tabs = [
    {
      id: 'reloj',
      label: 'Viaje en el Tiempo',
      icon: History,
    },
    {
      id: 'parametros',
      label: 'Parámetros Clínicos',
      icon: Activity,
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: FileText,
    },
    {
      id: 'eventos',
      label: 'Log de Eventos',
      icon: Clock,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Patient Header Container */}
      <section className="w-full">
        <PatientHeader patient={patient} />
      </section>

      {/* AI Clinical Insights Panel (Analytical Support - Non Diagnostic) */}
      <section className="w-full">
        <AIClinicalInsights />
      </section>

      {/* Tabs Navigation Bar */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 md:px-6 pt-2">
        <div className="flex items-center gap-2 sm:gap-8 border-b border-slate-200 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 py-3 px-1 text-sm transition-all duration-150 border-b-2 cursor-pointer whitespace-nowrap
                  ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dynamic Tab Content Renderer */}
      <section className="w-full">
        {activeTab === 'reloj' && <TimeTravelClock patientId={rawId} />}
        {activeTab === 'documentos' && <DocumentRepository />}
        {activeTab === 'parametros' && (
          <ClinicalParameters isPrioritized={patient.isPrioritized} />
        )}
        {activeTab === 'eventos' && <PatientEventLog />}
      </section>
    </div>
  );
}
