/**
 * Roles and permissions.
 *
 * This module is the single place that answers "may this user do X?" for the
 * UI. It is a convenience layer only — the authoritative check lives in the
 * RLS policies in supabase/20260817_auth_roles_audit.sql, which apply even if
 * someone calls the API directly with the anon key.
 */

export type AppRole = 'admin' | 'editor' | 'consultor' | 'lector';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: AppRole;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  consultor: 'Consultor',
  lector: 'Solo lectura',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Gestiona usuarios, roles, papelera y auditoría.',
  editor: 'Crea y edita tareas y subtareas.',
  consultor: 'Consulta toda la información sin modificarla.',
  lector: 'Solo visualiza la información.',
};

export const ALL_ROLES: AppRole[] = ['admin', 'editor', 'consultor', 'lector'];

/** Mirrors public.can_write() in SQL. */
export const canWrite = (profile: Profile | null): boolean =>
  Boolean(profile?.is_active && (profile.role === 'admin' || profile.role === 'editor'));

/** Mirrors public.is_admin() in SQL. */
export const isAdmin = (profile: Profile | null): boolean =>
  Boolean(profile?.is_active && profile.role === 'admin');

/** Mirrors public.can_read() in SQL: any active profile, whatever the role. */
export const canRead = (profile: Profile | null): boolean => Boolean(profile?.is_active);

/**
 * The gate is opt-in so the rollout can be sequenced: run the SQL migration
 * and promote the first administrator, then flip this on. Once it is on there
 * is no bypass — and RLS blocks the data regardless of what the UI does.
 */
export const isAuthEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

export const initialsFor = (profile: Profile | null): string => {
  const source = profile?.full_name?.trim() || profile?.email || '';
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
