'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PatientItem, PatientStatus } from '@/lib/mockPatients';
import { ChevronRight, Calendar, User } from 'lucide-react';

export interface PatientDirectoryTableProps {
  patients: PatientItem[];
  onSelectPatient?: (patient: PatientItem) => void;
}

export const PatientDirectoryTable: React.FC<PatientDirectoryTableProps> = ({
  patients,
  onSelectPatient,
}) => {
  const router = useRouter();

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case 'Monitoreo Activo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 animate-pulse" />
            Monitoreo Activo
          </span>
        );
      case 'Estable':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
            Estable
          </span>
        );
      case 'Alta':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Alta
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.replace(/Dra?\.\s*/g, '').trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleRowClick = (patient: PatientItem) => {
    if (onSelectPatient) {
      onSelectPatient(patient);
    } else {
      router.push(`/pacientes/${patient.id}`);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
            <th scope="col" className="py-3.5 px-4 md:px-6">
              ID
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Paciente
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Edad / Género
            </th>
            <th scope="col" className="py-3.5 px-4 md:px-6">
              Último Registro
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
          {patients.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                No se encontraron pacientes que coincidan con la búsqueda.
              </td>
            </tr>
          ) : (
            patients.map((patient) => {
              const initials = getInitials(patient.name);
              return (
                <tr
                  key={patient.id}
                  onClick={() => handleRowClick(patient)}
                  className="bg-white hover:bg-slate-50/80 transition-colors duration-150 group cursor-pointer"
                >
                  {/* ID Column */}
                  <td className="py-4 px-4 md:px-6 font-mono font-semibold text-slate-800 text-xs">
                    <span className="p-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {patient.id}
                    </span>
                  </td>

                  {/* Paciente Column with Avatar */}
                  <td className="py-4 px-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {patient.name}
                      </span>
                    </div>
                  </td>

                  {/* Edad / Género */}
                  <td className="py-4 px-4 md:px-6 text-slate-600">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {patient.age} años • {patient.gender}
                      </span>
                    </div>
                  </td>

                  {/* Último Registro */}
                  <td className="py-4 px-4 md:px-6 text-slate-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{patient.lastEncounter}</span>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="py-4 px-4 md:px-6">
                    {getStatusBadge(patient.status)}
                  </td>

                  {/* Action Column */}
                  <td className="py-4 px-4 md:px-6 text-right">
                    <Link
                      href={`/pacientes/${patient.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group-hover:text-blue-600"
                      aria-label={`Ver expediente de ${patient.name}`}
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
