'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Calendar, Users } from 'lucide-react';
import { PatientItem, mockPatientsList } from '@/lib/mockPatients';

export interface PatientHeaderProps {
  patient: PatientItem;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
  const router = useRouter();

  const getInitials = (name: string) => {
    const parts = name.replace(/Dra?\.\s*/g, '').trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      router.push(`/pacientes/${selectedId}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Avatar, Name, ID, Age, Gender */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center border-2 border-blue-200 shadow-xs shrink-0">
            {getInitials(patient.name)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                {patient.name}
              </h1>
              <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                {patient.id}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {patient.age} años • {patient.gender}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Última atención: {patient.lastEncounter}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Patient Switcher Dropdown & Back Link */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          {/* Selector de los 100 Primeros Pacientes */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={patient.id}
              onChange={handlePatientSelect}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer pr-2 max-w-[220px] truncate"
            >
              {mockPatientsList.slice(0, 100).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/pacientes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Directorio</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientHeader;
