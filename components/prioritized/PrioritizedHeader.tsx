'use client';

import React from 'react';
import { AlertCircle, Flame, Filter } from 'lucide-react';

export type FilterOption = 'ALL' | 'CRITICAL' | 'CRITICAL_HIGH';

export interface PrioritizedHeaderProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  totalCount?: number;
}

export const PrioritizedHeader: React.FC<PrioritizedHeaderProps> = ({
  activeFilter,
  onFilterChange,
  totalCount = 6,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs mb-6">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Pacientes Priorizados
            </h1>
            <span className="bg-red-100 text-red-700 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-red-200">
              {totalCount} Alertas
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Bandeja de alertas clínicas que requieren atención inmediata
          </p>
        </div>
      </div>

      {/* Filter Toggle Pills */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start md:self-center">
        <button
          onClick={() => onFilterChange('ALL')}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer
            ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }
          `}
        >
          Todos
        </button>

        <button
          onClick={() => onFilterChange('CRITICAL')}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5
            ${
              activeFilter === 'CRITICAL'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-red-700 hover:bg-red-50'
            }
          `}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Solo CRITICAL</span>
        </button>

        <button
          onClick={() => onFilterChange('CRITICAL_HIGH')}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5
            ${
              activeFilter === 'CRITICAL_HIGH'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-orange-700 hover:bg-orange-50'
            }
          `}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>CRITICAL y HIGH</span>
        </button>
      </div>
    </div>
  );
};

export default PrioritizedHeader;
