"use client";

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

const getCurrentTheme = (): 'dark' | 'light' => {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
};

export const ThemeToggle = ({ className }: { className?: string }) => {
  // The inline script in the layout stamps data-theme before paint, so reading it
  // during the lazy initializer is enough — no effect needed.
  const [theme, setTheme] = React.useState<'dark' | 'light'>(getCurrentTheme);

  const applyTheme = (nextTheme: 'dark' | 'light') => {
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('dashboard-theme', nextTheme);
    document.cookie = `dashboard-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    setTheme(nextTheme);
  };

  return (
    <div
      className={clsx(
        'relative flex h-9 items-center rounded-pill border border-line bg-surface-sunken p-0.5',
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'absolute top-0.5 h-8 w-8 rounded-full bg-surface shadow-card transition-transform duration-200 ease-out',
          theme === 'dark' ? 'translate-x-8' : 'translate-x-0',
        )}
      />
      <button
        type="button"
        onClick={() => applyTheme('light')}
        aria-label="Activar modo claro"
        aria-pressed={theme === 'light'}
        className={clsx(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          theme === 'light' ? 'text-accent' : 'text-ink-faint hover:text-ink-soft',
        )}
      >
        <Sun size={15} />
      </button>
      <button
        type="button"
        onClick={() => applyTheme('dark')}
        aria-label="Activar modo oscuro"
        aria-pressed={theme === 'dark'}
        className={clsx(
          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          theme === 'dark' ? 'text-accent' : 'text-ink-faint hover:text-ink-soft',
        )}
      >
        <Moon size={15} />
      </button>
    </div>
  );
};
