import React from 'react';
import Link from 'next/link';
import { Users, AlertOctagon, AlertTriangle, BrainCircuit, ArrowUpRight } from 'lucide-react';

export interface DashboardTotals {
  totalPatients: number | null;
  criticalCount: number;
  anomalyCount: number;
  diagnosedCount: number;
}

export interface MetricCardsProps {
  totals: DashboardTotals | null;
  loading?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ totals, loading }) => {
  const cards = [
    {
      title: 'Total Pacientes Evaluados',
      value: totals?.totalPatients,
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      textColor: 'text-slate-800',
      subtitle: 'Registros distintos en risa_master_data',
      href: undefined,
    },
    {
      title: 'Pacientes con Anomalías Críticas',
      value: totals?.criticalCount ?? 0,
      icon: AlertOctagon,
      iconBg: 'bg-red-50 text-red-600 border-red-100',
      textColor: 'text-red-600',
      subtitle: 'Con al menos una alerta CRITICAL',
      href: '/priorizados?priority=CRITICAL',
    },
    {
      title: 'Pacientes con Anomalías',
      value: totals?.anomalyCount ?? 0,
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 text-orange-600 border-orange-100',
      textColor: 'text-orange-600',
      subtitle: 'Con al menos una alerta del motor de reglas',
      href: '/pacientes?estado=CON_ALERTAS',
    },
    {
      title: 'Pacientes Diagnosticados',
      value: totals?.diagnosedCount ?? 0,
      icon: BrainCircuit,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      textColor: 'text-indigo-600',
      subtitle: 'Con análisis contextual de IA generado',
      href: '/pacientes?estado=DIAGNOSTICADO',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const displayValue =
          loading ? null : card.value === null || card.value === undefined ? '—' : card.value;

        const cardBody = (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                {displayValue === null ? (
                  <div className="h-8 w-14 mt-2.5 rounded-md bg-slate-100 animate-pulse" />
                ) : (
                  <h3 className={`text-3xl font-bold mt-2 ${card.textColor}`}>{displayValue}</h3>
                )}
              </div>
              <div className={`p-3 rounded-xl border ${card.iconBg}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{card.subtitle}</span>
              {card.href ? (
                <span className="flex items-center gap-1 text-blue-500 font-semibold">
                  Ver pacientes
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              )}
            </div>
          </>
        );

        const className =
          'bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between' +
          (card.href
            ? ' hover:shadow-md hover:border-blue-200 cursor-pointer'
            : ' hover:shadow-md');

        return card.href ? (
          <Link key={card.title} href={card.href} className={className}>
            {cardBody}
          </Link>
        ) : (
          <div key={card.title} className={className}>
            {cardBody}
          </div>
        );
      })}
    </div>
  );
};

export default MetricCards;
