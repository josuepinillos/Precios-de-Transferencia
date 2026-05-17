"use client";

import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { KPICards } from '@/components/KPICards';
import { TimelineMain } from '@/components/TimelineMain';
import { CalendarMain } from '@/components/CalendarMain';
import { Charts } from '@/components/Charts';
import { useDashboardStore } from '@/store/useDashboardStore';
import { Timeline } from '@/components/Timeline';
import { TaskPanel } from '@/components/TaskPanel';

export default function Home() {
  const { currentView } = useDashboardStore();

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Top KPIs - Always visible */}
            <KPICards />
            
            {/* Dynamic Content based on currentView */}
            {currentView === 'dashboard' && (
              <>
                <div className="flex gap-6 h-[600px]">
                  <div className="flex-1 overflow-hidden">
                    <Timeline />
                  </div>
                  <TaskPanel />
                </div>
                <Charts />
              </>
            )}

            {currentView === 'timeline' && <TimelineMain />}
            {currentView === 'calendar' && <CalendarMain />}
          </div>
        </main>
      </div>
    </div>
  );
}

