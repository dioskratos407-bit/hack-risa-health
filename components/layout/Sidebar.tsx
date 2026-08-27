'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  LayoutDashboard, 
  FolderHeart, 
  AlertCircle, 
  X 
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard General',
    icon: LayoutDashboard,
    href: '/',
  },
  {
    label: 'Pacientes',
    icon: FolderHeart,
    href: '/pacientes',
  },
  {
    label: 'Pacientes Priorizados',
    icon: AlertCircle,
    href: '/priorizados',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
          flex flex-col transform transition-transform duration-200 ease-in-out
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:shadow-none'}
        `}
      >
        {/* Branding Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Activity className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">
              HealthSignal <span className="text-blue-600 font-extrabold">RISA</span>
            </span>
          </Link>
          {/* Close button for mobile drawer */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar menú lateral"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Navegación Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  if (isOpen) onClose();
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150 group
                  ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <Icon
                  className={`
                    h-5 w-5 transition-colors
                    ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }
                  `}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Footer Status Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Sistema RISA Activo</span>
          </div>
        </div>
      </aside>
    </>
  );
};
