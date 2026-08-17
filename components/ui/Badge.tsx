"use client";

import React from 'react';
import clsx from 'clsx';

export type Tone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical';

const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-soft text-neutral-ink',
  accent: 'bg-accent-soft text-accent-ink',
  positive: 'bg-positive-soft text-positive-ink',
  caution: 'bg-caution-soft text-caution-ink',
  critical: 'bg-critical-soft text-critical-ink',
};

const dots: Record<Tone, string> = {
  neutral: 'bg-ink-faint',
  accent: 'bg-accent',
  positive: 'bg-positive',
  caution: 'bg-caution',
  critical: 'bg-critical',
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: Tone;
  /** Shows a small status dot before the label. */
  dot?: boolean;
  className?: string;
  title?: string;
};

export const Badge = ({ children, tone = 'neutral', dot, className, title }: BadgeProps) => (
  <span
    title={title}
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-medium leading-none whitespace-nowrap',
      tones[tone],
      className,
    )}
  >
    {dot && <span className={clsx('h-1.5 w-1.5 flex-shrink-0 rounded-full', dots[tone])} />}
    {children}
  </span>
);

/** Progress-derived tone shared by every view so a percentage always reads the same. */
export const toneForProgress = (progress: number): Tone => {
  if (progress === 100) return 'positive';
  if (progress > 0) return 'caution';
  return 'neutral';
};

export const labelForProgress = (progress: number) => {
  if (progress === 100) return 'Completada';
  if (progress > 0) return 'En progreso';
  return 'Pendiente';
};
