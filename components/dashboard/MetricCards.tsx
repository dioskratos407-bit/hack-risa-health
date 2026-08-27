import React from 'react';
import { Users, AlertOctagon, AlertTriangle, Activity } from 'lucide-react';
import { DashboardMetricsSummary } from '@/lib/mockData';

export interface MetricCardsProps {
  metrics: DashboardMetricsSummary;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Pacientes Evaluados',
      value: metrics.totalPatientsEvaluated,
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      textColor: 'text-slate-800',
      subtitle: 'En tiempo real',
    },
    {
      title: 'Alertas CRITICAL',
      value: metrics.criticalAlertsCount,
      icon: AlertOctagon,
      iconBg: 'bg-red-50 text-red-600 border-red-100',
      textColor: 'text-red-600',
      subtitle: 'Atención inmediata requerida',
    },
    {
      title: 'Alertas HIGH',
      value: metrics.highAlertsCount,
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 text-orange-600 border-orange-100',
      textColor: 'text-orange-600',
      subtitle: 'Monitoreo estrecho',
    },
    {
      title: 'Dispositivos Activos',
      value: metrics.activeDevicesCount,
      icon: Activity,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      textColor: 'text-slate-800',
      subtitle: 'Señal de telemetría activa',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl border ${card.iconBg}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{card.subtitle}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricCards;
