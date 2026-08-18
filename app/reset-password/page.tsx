"use client";

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Landing page for the recovery link. Supabase puts the user into a temporary
 * session when the link is opened, which is what lets updateUser() set a new
 * password without asking for the old one.
 */
export default function ResetPasswordPage() {
  const { session, updatePassword, signOut, isLoading } = useAuth();
  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDone, setIsDone] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setIsDone(true);
      // Force a clean sign-in with the new credentials.
      await signOut();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Ya puedes entrar con tu nueva contraseña">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <CheckCircle2 size={40} className="text-positive" />
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-control bg-brand text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-hover"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (!isLoading && !session) {
    return (
      <AuthShell title="Enlace no válido" subtitle="El enlace expiró o ya fue utilizado">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <AlertCircle size={40} className="text-caution" />
          <p className="text-[13px] text-ink-soft">
            Solicita un enlace nuevo desde la pantalla de inicio de sesión.
          </p>
          <Link
            href="/"
            className="flex h-12 w-full items-center justify-center rounded-control border border-line-strong bg-surface text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
          >
            Volver
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Define tu contraseña" subtitle="Elige una contraseña nueva para tu cuenta">
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-control border border-critical/30 bg-critical-soft px-3.5 py-3 text-[13px] text-critical-ink"
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span className="min-w-0">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="field h-12 pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmation" className="mb-1.5 block text-[13px] font-medium text-ink">
            Repetir contraseña
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repite la contraseña"
              className="field h-12 pl-10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-hover focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Guardar contraseña
        </button>
      </form>
    </AuthShell>
  );
}
