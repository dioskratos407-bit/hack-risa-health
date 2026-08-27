'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PatientItem } from '@/lib/mockPatients';
import {
  PatientState,
  PatientStateInfo,
  PATIENT_STATE_LABELS,
  PATIENT_STATE_STYLES,
} from '@/lib/patientStates';
import {
  PatientDemographics,
  REGION_TYPE_LABELS,
  CARE_PROGRAM_LABELS,
} from '@/lib/patientDemographics';
import { ChevronRight, User, BrainCircuit, Minus } from 'lucide-react';

export interface PatientDirectoryTableProps {
  patients: PatientItem[];
  stateById: Record<string, PatientStateInfo>;
  demoById?: Record<string, PatientDemographics>;
  loading?: boolean;
  onSelectPatient?: (patient: PatientItem) => void;
}

function formatSimulatedMoment(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const StateBadge: React.FC<{ state: PatientState }> = ({ state }) => {
  const style = PATIENT_STATE_STYLES[state];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot} ${style.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {PATIENT_STATE_LABELS[state]}
    </span>
  );
};

export const PatientDirectoryTable: React.FC<PatientDirectoryTableProps> = ({
  patients,
  stateById,
  demoById = {},
  loading,
  onSelectPatient,
}) => {
  const router = useRouter();

  const handleRowClick = (patient: PatientItem) => {
    if (onSelectPatient) {
      onSelectPatient(patient);
    } else {
      router.push(`/pacientes/${patient.id}`);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse min-w-[860px]">
        <thead>
          <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Paciente
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Perfil
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Diagnósticos IA
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Estado
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6 text-right">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="py-4 px-4 md:px-6" colSpan={5}>
                  <div className="h-5 w-full rounded-md bg-slate-100 animate-pulse" />
                </td>
              </tr>
            ))
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                No se encontraron pacientes que coincidan con la búsqueda.
              </td>
            </tr>
          ) : (
            patients.map((patient) => {
              const info = stateById[patient.id];
              const demo = demoById[patient.id];
              const state: PatientState = info?.state ?? 'SIN_ACTIVIDAD';
              const hasDiagnosis = (info?.insightCount ?? 0) > 0;

              return (
                <tr
                  key={patient.id}
                  onClick={() => handleRowClick(patient)}
                  className="bg-white hover:bg-slate-50/80 transition-colors duration-150 group cursor-pointer"
                >
                  {/* Paciente Column with Avatar + ID */}
                  <td className="py-4 px-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0 shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {patient.id}
                      </span>
                    </div>
                  </td>

                  {/* Perfil demográfico */}
                  <td className="py-4 px-4 md:px-6">
                    {demo ? (
                      <div className="leading-tight">
                        <span className="block text-slate-700 text-xs font-semibold">
                          {demo.ageYears} años · {demo.sexAtBirth}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {REGION_TYPE_LABELS[demo.regionType] ?? demo.regionType} ·{' '}
                          {CARE_PROGRAM_LABELS[demo.careProgram] ?? demo.careProgram}
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Minus className="w-3.5 h-3.5" />
                        Sin datos
                      </span>
                    )}
                  </td>

                  {/* Diagnósticos IA */}
                  <td className="py-4 px-4 md:px-6">
                    {hasDiagnosis ? (
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="leading-tight">
                          <span className="block text-slate-800 font-semibold text-xs">
                            {info!.insightCount}{' '}
                            {info!.insightCount === 1 ? 'diagnóstico' : 'diagnósticos'}
                          </span>
                          {info!.lastInsightAtISO && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              último: {formatSimulatedMoment(info!.lastInsightAtISO)}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Minus className="w-3.5 h-3.5" />
                        Sin diagnóstico
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-4 md:px-6">
                    <StateBadge state={state} />
                    {state === 'CON_ALERTAS' && info && (
                      <span className="block mt-1 text-[11px] text-slate-400">
                        {info.alertCount} {info.alertCount === 1 ? 'alerta' : 'alertas'}
                        {info.topTier ? ` · máx. ${info.topTier}` : ''}
                      </span>
                    )}
                  </td>

                  {/* Action Column */}
                  <td className="py-4 px-4 md:px-6 text-right">
                    <Link
                      href={`/pacientes/${patient.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group-hover:text-blue-600"
                      aria-label={`Ver expediente de ${patient.id}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PatientDirectoryTable;
