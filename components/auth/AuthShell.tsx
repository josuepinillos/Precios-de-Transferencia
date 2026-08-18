"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * The glass card and its lit backdrop, shared by every auth screen so sign-in,
 * recovery and reset read as one place rather than three separate pages.
 */
export const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-10">
    {/* Backdrop: soft colour pooling behind the card, not on it. */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-brand/20 blur-[130px]" />
      <div className="absolute -right-32 bottom-[-15%] h-[560px] w-[560px] rounded-full bg-accent/25 blur-[140px]" />
      <div className="absolute left-1/2 top-1/2 h-[380px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]" />
    </div>

    <div className="relative w-full max-w-[420px]">
      <div className="rounded-[22px] border border-line/80 bg-surface/70 p-6 shadow-pop backdrop-blur-2xl sm:p-8">
        <div className="mb-7 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold tracking-tight text-white shadow-card">
            TP
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-ink">Transfer Pricing</span>
            <span className="block text-[13px] text-ink-faint">Gestión tributaria</span>
          </span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
        </div>

        {children}

        <div className="mt-7 flex items-start gap-3 border-t border-line pt-5">
          <ShieldCheck size={20} className="mt-0.5 flex-shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">Acceso seguro y controlado</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">Protegemos tu información tributaria confidencial</p>
          </div>
        </div>

        {footer}
      </div>
    </div>
  </div>
);
