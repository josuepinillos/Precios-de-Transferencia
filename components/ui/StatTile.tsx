"use client";

import React from 'react';
import clsx from 'clsx';
import type { Tone } from './Badge';

const iconTones: Record<Tone, string> = {
  neutral: 'bg-neutral-soft text-neutral-ink',
  accent: 'bg-accent-soft text-accent',
  positive: 'bg-positive-soft text-positive-ink',
  caution: 'bg-caution-soft text-caution-ink',
  critical: 'bg-critical-soft text-critical-ink',
};

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  /** Secondary figure shown under the value, e.g. a share of the total. */
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  /** Rendered at the right of the value row — a ring, sparkline or badge. */
  accessory?: React.ReactNode;
};

export const StatTile = ({ label, value, meta, icon, tone = 'accent', accessory }: StatTileProps) => (
  <div className="card card-interactive flex min-w-0 flex-col justify-between gap-4 p-4">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[13px] font-medium leading-snug text-ink-soft">{label}</span>
      {icon && (
        <span className={clsx('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]', iconTones[tone])}>
          {icon}
        </span>
      )}
    </div>
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular text-ink">{value}</p>
        {meta && <p className="mt-1.5 text-xs text-ink-faint">{meta}</p>}
      </div>
      {accessory}
    </div>
  </div>
);
