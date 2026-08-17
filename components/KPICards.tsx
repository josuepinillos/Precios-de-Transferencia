"use client";

import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  FileText,
  CheckCircle2,
  Clock,
  ListTree,
  ListChecks,
  CalendarX2,
  TrendingUp
} from 'lucide-react';
import { StatTile } from './ui/StatTile';
import { ProgressRing } from './ui/Progress';
import type { Tone } from './ui/Badge';

const share = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

export const KPICards = () => {
  const {
    getTotalTasksCount,
    getCompletedTasksCount,
    getPendingTasksCount,
    getOverallProgress,
    getTotalSubtasksCount,
    getCompletedSubtasksCount,
    getOverdueSubtasksCount
  } = useDashboardStore();

  const totalTasks = getTotalTasksCount();
  const completedTasks = getCompletedTasksCount();
  const pendingTasks = getPendingTasksCount();
  const progress = getOverallProgress();
  const totalSubtasks = getTotalSubtasksCount();
  const completedSubtasks = getCompletedSubtasksCount();
  const overdueSubtasks = getOverdueSubtasksCount();

  const cards: Array<{
    title: string;
    value: React.ReactNode;
    meta?: string;
    icon?: React.ReactNode;
    tone?: Tone;
    accessory?: React.ReactNode;
  }> = [
    {
      title: 'Total de tareas',
      value: totalTasks,
      meta: 'Tareas matrices en el plan',
      icon: <FileText size={16} />,
      tone: 'accent',
    },
    {
      title: 'Completadas',
      value: completedTasks,
      meta: `${share(completedTasks, totalTasks)}% del total`,
      icon: <CheckCircle2 size={16} />,
      tone: 'positive',
    },
    {
      title: 'Pendientes',
      value: pendingTasks,
      meta: `${share(pendingTasks, totalTasks)}% del total`,
      icon: <Clock size={16} />,
      tone: 'caution',
    },
    {
      title: 'Avance general',
      value: `${progress}%`,
      meta: 'Promedio de las tareas',
      icon: <TrendingUp size={16} />,
      tone: 'positive',
      accessory: <ProgressRing value={progress} tone="positive" size={48} />,
    },
    {
      title: 'Total subtareas',
      value: totalSubtasks,
      meta: 'Actividades registradas',
      icon: <ListTree size={16} />,
      tone: 'accent',
    },
    {
      title: 'Subtareas completadas',
      value: completedSubtasks,
      meta: `${share(completedSubtasks, totalSubtasks)}% del total`,
      icon: <ListChecks size={16} />,
      tone: 'positive',
    },
    {
      title: 'Vencidas',
      value: overdueSubtasks,
      meta: 'Subtareas fuera de plazo',
      icon: <CalendarX2 size={16} />,
      tone: overdueSubtasks > 0 ? 'critical' : 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map((card) => (
        <StatTile
          key={card.title}
          label={card.title}
          value={card.value}
          meta={card.meta}
          icon={card.icon}
          tone={card.tone}
          accessory={card.accessory}
        />
      ))}
    </div>
  );
};
