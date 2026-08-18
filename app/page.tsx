"use client";
import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { KPICards } from '@/components/KPICards';
import { TimelineMain } from '@/components/TimelineMain';
import { CalendarMain } from '@/components/CalendarMain';
import { useDashboardStore } from '@/store/useDashboardStore';
import { DashboardExecutive } from '@/components/DashboardExecutive';
import { SunatDueDatesSection } from '@/components/SunatDueDatesSection';
import { AuthGate } from '@/components/auth/AuthGate';

function Workspace() {
  const { currentView, initRealtime, isLoaded, error, clearError } = useDashboardStore();

  useEffect(() => {
    return initRealtime();
  }, [initRealtime]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          <p className="text-sm text-ink-soft">Sincronizando con Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-canvas text-ink md:h-dvh md:overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pt-16 md:h-dvh md:min-h-0 md:pt-0">
        <Header />
        {error && (
          <div className="mx-4 mt-4 flex items-start justify-between gap-4 rounded-control border border-critical/25 bg-critical-soft px-4 py-3 text-sm text-critical-ink sm:mx-6 lg:mx-8">
            <span className="flex min-w-0 items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span className="min-w-0">{error}</span>
            </span>
            <button
              type="button"
              onClick={clearError}
              aria-label="Cerrar aviso"
              className="flex-shrink-0 rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <main className="scroll-area min-h-0 flex-1 overflow-x-hidden">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-4 sm:p-6 lg:gap-6 lg:p-8">
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

export default function Home() {
  return (
    <AuthGate>
      <Workspace />
    </AuthGate>
  );
}
