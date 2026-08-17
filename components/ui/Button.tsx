"use client";

import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,box-shadow] duration-150 ' +
  'focus-visible:outline-none focus-visible:shadow-focus ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white border border-transparent hover:bg-brand-hover shadow-card',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-sunken hover:border-ink-faint',
  ghost: 'bg-transparent text-ink-soft border border-transparent hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-critical-soft text-critical-ink border border-transparent hover:bg-critical hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = ({ variant = 'secondary', size = 'md', className, type = 'button', ...props }: ButtonProps) => (
  <button type={type} className={clsx(base, variants[variant], sizes[size], className)} {...props} />
);

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  'aria-label': string;
};

export const IconButton = ({ variant = 'ghost', size = 'md', className, type = 'button', ...props }: IconButtonProps) => (
  <button
    type={type}
    className={clsx(base, variants[variant], size === 'sm' ? 'h-9 w-9' : 'h-10 w-10', 'px-0', className)}
    {...props}
  />
);
