"use client";

import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { isAuthEnabled, type Profile } from '../../lib/auth';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  /** True until the first session check resolves — avoids flashing the login. */
  isLoading: boolean;
  /** Set when the account exists in Auth but has no active profile. */
  accessError: string | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = React.createContext<AuthState | null>(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return context;
};

const REMEMBER_KEY = 'tp-remember-email';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const enabled = isAuthEnabled() && isSupabaseConfigured();
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isLoading, setIsLoading] = React.useState(enabled);
  const [accessError, setAccessError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async (userId: string) => {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] No se pudo leer el perfil:', error.message);
      setProfile(null);
      setAccessError('No se pudo verificar tu perfil. Contacta al administrador.');
      return;
    }

    const nextProfile = (data as Profile | null) ?? null;
    setProfile(nextProfile);
    setAccessError(
      !nextProfile
        ? 'Tu cuenta aún no tiene un perfil asignado. Contacta al administrador.'
        : !nextProfile.is_active
          ? 'Tu cuenta está desactivada. Contacta al administrador.'
          : null,
    );
  }, []);

  React.useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabaseClient();
    let active = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user) {
        setProfile(null);
        setAccessError(null);
        return;
      }
      if (event !== 'TOKEN_REFRESHED') {
        void loadProfile(nextSession.user.id);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [enabled, loadProfile]);

  const signIn = React.useCallback(async (email: string, password: string, remember: boolean) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;

    try {
      if (remember) window.localStorage.setItem(REMEMBER_KEY, email.trim());
      else window.localStorage.removeItem(REMEMBER_KEY);
    } catch {
      // A blocked localStorage must not stop a successful sign-in.
    }

    if (data.user) {
      await loadProfile(data.user.id);
      // Deactivated accounts authenticate but must not reach the data.
      const { data: row } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!row || row.is_active === false) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      }
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }
  }, [loadProfile]);

  const signOut = React.useCallback(async () => {
    await getSupabaseClient().auth.signOut();
    setSession(null);
    setProfile(null);
    setAccessError(null);
  }, []);

  const requestPasswordReset = React.useCallback(async (email: string) => {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = React.useCallback(async (password: string) => {
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [loadProfile, session]);

  const value = React.useMemo<AuthState>(
    () => ({ session, profile, isLoading, accessError, signIn, signOut, requestPasswordReset, updatePassword, refreshProfile }),
    [session, profile, isLoading, accessError, signIn, signOut, requestPasswordReset, updatePassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const getRememberedEmail = (): string => {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
};
