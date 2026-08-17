"use client";

import React from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Filters and primary actions, right-aligned on wide screens. */
  actions?: React.ReactNode;
};

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-ink-soft">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);
