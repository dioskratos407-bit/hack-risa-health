'use client';

import React, { useState, useMemo } from 'react';
import { mockPrioritizedPatients } from '@/lib/mockPrioritized';
import { PrioritizedHeader, FilterOption } from '@/components/prioritized/PrioritizedHeader';
import { AlertGrid } from '@/components/prioritized/AlertGrid';

export default function PriorizadosPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');

  const filteredPatients = useMemo(() => {
    return mockPrioritizedPatients.filter((patient) => {
      if (activeFilter === 'CRITICAL') {
        return patient.priority === 'CRITICAL';
      }
      if (activeFilter === 'CRITICAL_HIGH') {
        return patient.priority === 'CRITICAL' || patient.priority === 'HIGH';
      }
      return true; // 'ALL'
    });
  }, [activeFilter]);

  return (
    <div className="space-y-6">
      {/* Header with Filter Controls */}
      <PrioritizedHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalCount={filteredPatients.length}
      />

      {/* Alert Cards Grid */}
      <AlertGrid patients={filteredPatients} />
    </div>
  );
}
