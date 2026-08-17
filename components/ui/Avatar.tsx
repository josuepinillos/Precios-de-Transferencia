"use client";

import React from 'react';
import clsx from 'clsx';

type AvatarProps = {
  initials: string;
  /** Gradient utility class stored with the assignee record. */
  colorClass?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
};

const sizes = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
};

export const Avatar = ({ initials, colorClass, name, size = 'sm', className }: AvatarProps) => (
  <span
    title={name}
    className={clsx(
      'inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface',
      sizes[size],
      colorClass || 'bg-ink-faint',
      className,
    )}
  >
    {initials}
  </span>
);
