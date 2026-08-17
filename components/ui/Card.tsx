"use client";

import React from 'react';
import clsx from 'clsx';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
};

export const Card = ({ interactive, as: Tag = 'div', className, ...props }: CardProps) => (
  <Tag className={clsx('card', interactive && 'card-interactive', className)} {...props} />
);

type CardHeaderProps = {
  title: React.ReactNode;
  /** Small uppercase label rendered above the title. */
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  /** Filters, buttons or counters aligned to the right of the title. */
  actions?: React.ReactNode;
  className?: string;
};

export const CardHeader = ({ title, eyebrow, description, actions, className }: CardHeaderProps) => (
  <div
    className={clsx(
      'flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
      className,
    )}
  >
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
      {description && <p className="mt-1 text-[13px] text-ink-soft">{description}</p>}
    </div>
    {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const CardBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('p-5', className)} {...props} />
);
