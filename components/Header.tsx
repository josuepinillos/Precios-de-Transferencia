"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { ThemeToggle } from './ui/ThemeToggle';
import { ProfileMenu } from './auth/ProfileMenu';

const VIEW_META: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Vista ejecutiva de las tareas matrices y su avance por responsable.',
  },
  timeline: {
    title: 'Timeline',
    description: 'Seguimiento cronológico del plan de trabajo por día.',
  },
  calendar: {
    title: 'Calendario',
    description: 'Distribución mensual de las tareas programadas.',
  },
  sunat: {
    title: 'Vencimientos SUNAT',
    description: 'Control de plazos de presentación según el último dígito del RUC.',
  },
};

export const Header = () => {
  const { currentView } = useDashboardStore();
  const meta = VIEW_META[currentView] ?? VIEW_META.dashboard;

  return (
    <header className="shrink-0 border-b border-line bg-surface px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5">Campaña Precios de Transferencia 2025</p>
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{meta.description}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};
