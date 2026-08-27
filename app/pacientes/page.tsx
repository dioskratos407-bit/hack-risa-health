'use client';

import React, { useState, useMemo } from 'react';
import { mockPatientsList } from '@/lib/mockPatients';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { PatientDirectoryTable } from '@/components/patients/PatientDirectoryTable';
import { Users, UserPlus } from 'lucide-react';

export default function PacientesPage() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<string>('lastEncounter');

  // Filter and sort logic
  const filteredPatients = useMemo(() => {
    return mockPatientsList
      .filter((patient) => {
        // Search by name or ID
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          patient.name.toLowerCase().includes(query) ||
          patient.id.toLowerCase().includes(query);

        // Filter by status
        const matchesStatus =
          statusFilter === 'Todos' || patient.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'age') {
          return b.age - a.age; // descending age
        }
        // default: lastEncounter ID reverse
        return a.id.localeCompare(b.id);
      });
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Directorio de Pacientes
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Gestión global de registros clínicos RISA
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Abrir formulario para registrar nuevo paciente')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Paciente</span>
        </button>
      </div>

      {/* Search & Filters */}
      <PatientFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Directory Table */}
      <PatientDirectoryTable patients={filteredPatients} />
    </div>
  );
}
