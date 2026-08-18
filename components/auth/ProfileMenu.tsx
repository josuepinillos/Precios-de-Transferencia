"use client";

import React from 'react';
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';
import { ROLE_LABELS, initialsFor } from '../../lib/auth';
import { useAuth } from './AuthProvider';

export const ProfileMenu = () => {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!profile) return null;

  const displayName = profile.full_name?.trim() || profile.email;

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={clsx(
          'flex items-center gap-2.5 rounded-control border px-2 py-1.5 transition-colors',
          'focus-visible:shadow-focus focus-visible:outline-none',
          isOpen ? 'border-line-strong bg-surface-sunken' : 'border-transparent hover:bg-surface-sunken',
        )}
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white">
          {initialsFor(profile)}
        </span>
        <span className="hidden min-w-0 text-left leading-tight sm:block">
          <span className="block max-w-[150px] truncate text-[13px] font-medium text-ink">{displayName}</span>
          <span className="block text-[11px] text-ink-faint">{ROLE_LABELS[profile.role]}</span>
        </span>
        <ChevronDown size={15} className={clsx('flex-shrink-0 text-ink-faint transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[248px] overflow-hidden rounded-card border border-line bg-surface shadow-pop"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
            <p className="truncate text-xs text-ink-soft">{profile.email}</p>
            <p className="mt-1.5 inline-flex rounded-pill bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">
              {ROLE_LABELS[profile.role]}
            </p>
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              disabled
              title="Disponible próximamente"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserIcon size={15} />
              Mi perfil
            </button>
            <button
              type="button"
              role="menuitem"
              disabled
              title="Disponible próximamente"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Settings size={15} />
              Configuración
            </button>
          </div>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setIsOpen(false); void signOut(); }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-critical-ink transition-colors hover:bg-critical-soft"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
