import React from 'react';
import { mockPatientSignals, mockDashboardMetrics } from '@/lib/mockData';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { RiskTable } from '@/components/dashboard/RiskTable';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Metric Summary Cards Section */}
      <section>
        <MetricCards metrics={mockDashboardMetrics} />
      </section>

      {/* Prioritized Patient Risk Table Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Señales de Riesgo Recientes
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Monitoreo fisiológico priorizado por score de severidad clínica
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-slate-400" />
            <span>Actualización en tiempo real</span>
          </div>
        </div>

        {/* Risk Table */}
        <RiskTable signals={mockPatientSignals} />
      </section>
    </div>
  );
}
