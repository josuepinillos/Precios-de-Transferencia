"use client";

import React from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import clsx from 'clsx';
import { AuthShell } from './AuthShell';
import { getRememberedEmail, useAuth } from './AuthProvider';

type Mode = 'signIn' | 'forgot';

/** Supabase returns terse English errors; say something the user can act on. */
const friendlyError = (message: string): string => {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (normalized.includes('email not confirmed')) return 'Debes confirmar tu correo antes de entrar.';
  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Demasiados intentos. Espera un momento antes de volver a probar.';
  }
  return message;
};

export const LoginScreen = () => {
  const { signIn, requestPasswordReset, accessError } = useAuth();
  const [mode, setMode] = React.useState<Mode>('signIn');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  // Reading localStorage in a ref callback keeps the first paint correct
  // without an effect that would re-render immediately.
  const primeRememberedEmail = React.useCallback((node: HTMLInputElement | null) => {
    if (!node) return;
    const remembered = getRememberedEmail();
    if (remembered) {
      setEmail((current) => current || remembered);
      setRemember(true);
    }
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password, remember);
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      // Deliberately not revealing whether the address exists.
      setNotice('Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer tu contraseña.');
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : 'No se pudo enviar el correo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const banner = error || accessError;

  return (
    <AuthShell
      title={mode === 'signIn' ? 'Bienvenido de nuevo' : 'Recuperar contraseña'}
      subtitle={
        mode === 'signIn'
          ? 'Inicia sesión para continuar'
          : 'Te enviaremos un enlace para definir una nueva contraseña'
      }
    >
      {banner && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-control border border-critical/30 bg-critical-soft px-3.5 py-3 text-[13px] text-critical-ink"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="min-w-0">{banner}</span>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-5 rounded-control border border-positive/30 bg-positive-soft px-3.5 py-3 text-[13px] text-positive-ink"
        >
          {notice}
        </div>
      )}

      <form onSubmit={mode === 'signIn' ? handleSignIn : handleForgot} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              ref={primeRememberedEmail}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@empresa.com"
              className="field h-12 pl-10"
            />
          </div>
        </div>

        {mode === 'signIn' && (
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                className="field h-12 pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
        )}

        {mode === 'signIn' && (
          <div className="flex items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-line-strong accent-[var(--color-brand)]"
              />
              Recordarme
            </label>
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(null); setNotice(null); }}
              className="rounded text-[13px] font-medium text-accent transition-colors hover:text-accent-hover focus-visible:shadow-focus focus-visible:outline-none"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            'mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand text-sm font-semibold text-white shadow-card',
            'transition-colors hover:bg-brand-hover focus-visible:shadow-focus focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-70',
          )}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {mode === 'signIn' ? 'Iniciar sesión' : 'Enviar enlace'}
        </button>

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => { setMode('signIn'); setError(null); setNotice(null); }}
            className="rounded text-[13px] font-medium text-ink-soft transition-colors hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
          >
            Volver a iniciar sesión
          </button>
        )}
      </form>
    </AuthShell>
  );
};
