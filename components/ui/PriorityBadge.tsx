import React from 'react';
import { PriorityLevel } from '@/lib/mockData';

export interface PriorityBadgeProps {
  priorityLevel: PriorityLevel;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priorityLevel,
  className = '',
}) => {
  const getBadgeStyle = (level: PriorityLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border
        transition-colors duration-150 ${getBadgeStyle(priorityLevel)} ${className}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          priorityLevel === 'CRITICAL'
            ? 'bg-red-600 animate-pulse'
            : priorityLevel === 'HIGH'
            ? 'bg-orange-600'
            : priorityLevel === 'MEDIUM'
            ? 'bg-yellow-600'
            : 'bg-green-600'
        }`}
        aria-hidden="true"
      />
      {priorityLevel}
    </span>
  );
};

export default PriorityBadge;
