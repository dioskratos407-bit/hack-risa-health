'use client';

import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por ID..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Select Filters Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        {/* Filter by Status */}
        <div className="relative w-full sm:w-auto flex items-center">
          <div className="absolute left-3 pointer-events-none text-slate-400">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="DIAGNOSTICADO">Diagnosticado</option>
            <option value="ANALIZANDO">Analizando (IA)</option>
            <option value="CON_ALERTAS">Con Alertas</option>
            <option value="SIN_ACTIVIDAD">Sin Actividad</option>
          </select>
        </div>

        {/* Sort by Option */}
        <div className="relative w-full sm:w-auto flex items-center">
          <div className="absolute left-3 pointer-events-none text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="estado">Ordenar: Estado</option>
            <option value="diagnosticos">Ordenar: N.° de diagnósticos</option>
            <option value="id">Ordenar: ID</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default PatientFilters;
