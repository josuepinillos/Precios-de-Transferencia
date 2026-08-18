"use client";

import React from 'react';
import { isAuthEnabled } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from './AuthProvider';
import { LoginScreen } from './LoginScreen';

/**
 * Nothing renders behind this gate without an active profile.
 *
 * The gate is the UI half of the protection; RLS is the half that matters,
 * because it holds even if someone calls the API directly with the anon key.
 */
export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, isLoading } = useAuth();

  // Rollout switch: while NEXT_PUBLIC_AUTH_ENABLED is unset the app behaves as
  // before, so the SQL migration and the first administrator can be put in
  // place without locking anyone out of a running deployment.
  if (!isAuthEnabled() || !isSupabaseConfigured()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          <p className="text-sm text-ink-soft">Verificando tu sesión...</p>
        </div>
      </div>
    );
  }

  // No session, or a session whose profile is missing or deactivated.
  if (!session || !profile || !profile.is_active) {
    return <LoginScreen />;
  }

  return <>{children}</>;
};
