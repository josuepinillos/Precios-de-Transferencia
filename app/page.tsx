"use client";
import React, { useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { KPICards } from '@/components/KPICards';
import { TimelineMain } from '@/components/TimelineMain';
import { CalendarMain } from '@/components/CalendarMain';
import { useDashboardStore } from '@/store/useDashboardStore';
import { DashboardExecutive } from '@/components/DashboardExecutive';
import { SunatDueDatesSection } from '@/components/SunatDueDatesSection';

export default function Home() {
  const { currentView, initRealtime, isLoaded, error, clearError } = useDashboardStore();

  useEffect(() => {
    return initRealtime();
  }, [initRealtime]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-[#0b0f19] items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Sincronizando con Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white overflow-x-hidden">
      <Sidebar />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden min-h-screen lg:h-screen pt-16 md:pt-0">
        <Header />
        {error && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fecaca] flex items-start justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-[#fecaca]/80 hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6 scrollbar-hide">
          <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-4 sm:gap-6">
            {currentView === 'timeline' && <KPICards />}

            {currentView === 'dashboard' && <DashboardExecutive />}

            {currentView === 'timeline' && <TimelineMain />}
            {currentView === 'calendar' && <CalendarMain />}
            {currentView === 'sunat' && <SunatDueDatesSection />}
          </div>
        </main>
      </div>
    </div>
  );
}

