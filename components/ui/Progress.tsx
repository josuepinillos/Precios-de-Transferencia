"use client";

import React from 'react';
import clsx from 'clsx';

const fills = {
  neutral: 'bg-ink-faint',
  accent: 'bg-accent',
  positive: 'bg-positive',
  caution: 'bg-caution',
  critical: 'bg-critical',
} as const;

type ProgressBarProps = {
  value: number;
  tone?: keyof typeof fills;
  size?: 'sm' | 'md';
  className?: string;
};

export const ProgressBar = ({ value, tone = 'accent', size = 'sm', className }: ProgressBarProps) => (
  <div
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    className={clsx('w-full overflow-hidden rounded-pill bg-surface-sunken', size === 'sm' ? 'h-1.5' : 'h-2', className)}
  >
    <div
      className={clsx('h-full rounded-pill transition-[width] duration-500 ease-out', fills[tone])}
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

type ProgressRingProps = {
  value: number;
  tone?: keyof typeof fills;
  size?: number;
  label?: string;
};

const strokes = {
  neutral: 'var(--ink-faint)',
  accent: 'var(--accent)',
  positive: 'var(--positive)',
  caution: 'var(--caution)',
  critical: 'var(--critical)',
} as const;

export const ProgressRing = ({ value, tone = 'accent', size = 56, label }: ProgressRingProps) => {
  const radius = 15.9155;
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className="relative flex flex-shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r={radius} fill="none" stroke="var(--surface-sunken)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={strokes[tone]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${clamped} 100`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      {label && (
        <span className="absolute text-[11px] font-semibold tabular text-ink">{label}</span>
      )}
    </div>
  );
};
