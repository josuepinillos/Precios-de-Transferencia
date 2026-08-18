"use client";

import React from 'react';
import {
  LayoutDashboard,
  ListTree,
  Calendar,
  CalendarClock,
  Menu,
  X
} from 'lucide-react';
import clsx from 'clsx';
import { useDashboardStore } from '../store/useDashboardStore';

type ViewId = 'dashboard' | 'timeline' | 'calendar' | 'sunat';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: ListTree, label: 'Timeline', id: 'timeline' },
  { icon: Calendar, label: 'Calendario', id: 'calendar' },
  { icon: CalendarClock, label: 'Vencimientos SUNAT', id: 'sunat' },
] satisfies Array<{
  icon: typeof LayoutDashboard;
  label: string;
  id: ViewId;
}>;

const Brand = ({ compact }: { compact?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand text-[13px] font-bold tracking-tight text-white shadow-card">
      TP
    </span>
    <span className={clsx('min-w-0 leading-tight', compact && 'md:hidden lg:block')}>
      <span className="block truncate text-[13px] font-semibold tracking-tight text-ink">Transfer Pricing</span>
      <span className="block truncate text-[11px] text-ink-faint">Gestión tributaria</span>
    </span>
  </div>
);

export const Sidebar = () => {
  const { currentView, setCurrentView } = useDashboardStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNavigate = (id: ViewId) => {
    setCurrentView(id);
    setIsOpen(false);
  };

  const renderNav = ({ compact }: { compact?: boolean } = {}) => (
    <nav className="flex flex-col gap-1">
      {compact && <p className="eyebrow mb-2 px-3 md:hidden lg:block">Navegación</p>}
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item.id)}
            title={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={clsx(
              'group relative flex min-h-10 items-center gap-3 rounded-control px-3 py-2.5 text-left text-sm transition-colors duration-150',
              compact && 'md:justify-center lg:justify-start',
              isActive
                ? 'bg-accent-soft font-medium text-accent-ink'
                : 'font-normal text-ink-soft hover:bg-surface-sunken hover:text-ink',
            )}
          >
            {/* Active marker: a quiet rail instead of a saturated fill. */}
            <span
              aria-hidden
              className={clsx(
                'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-opacity duration-150',
                isActive ? 'opacity-100' : 'opacity-0',
              )}
            />
            <Icon size={18} strokeWidth={1.75} className="flex-shrink-0" />
            <span className={clsx('truncate', compact && 'md:hidden lg:inline')}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-xl md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-control border border-line-strong text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
          aria-label="Abrir menú"
          aria-expanded={isOpen}
        >
          <Menu size={19} />
        </button>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-dvh w-[min(82vw,300px)] flex-col border-r border-line bg-surface px-3 py-5 shadow-pop transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-7 flex items-center justify-between px-2">
          <Brand />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-control text-ink-faint transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>
        {renderNav()}
      </aside>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-3 py-5 md:flex md:w-[80px] lg:w-[248px]">
        <div className="mb-8 px-2 md:flex md:justify-center lg:justify-start">
          <Brand compact />
        </div>
        {renderNav({ compact: true })}
      </aside>
    </>
  );
};
