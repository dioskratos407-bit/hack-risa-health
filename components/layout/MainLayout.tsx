'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSimulationProvider } from '@/components/simulation/GlobalSimulationContext';

export interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleOpenSidebar = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  return (
    <GlobalSimulationProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {/* Sidebar Navigation */}
        <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Header */}
          <Header onOpenSidebar={handleOpenSidebar} />

          {/* Scrollable Work Area Container */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </GlobalSimulationProvider>
  );
};

export default MainLayout;
