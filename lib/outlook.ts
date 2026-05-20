"use client";

const OUTLOOK_TOKEN_KEY = 'dashboard-outlook-token';
const OUTLOOK_STATE_KEY = 'dashboard-outlook-state';
const OUTLOOK_VERIFIER_KEY = 'dashboard-outlook-verifier';
const OUTLOOK_RETURN_KEY = 'dashboard-outlook-return';

const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
const MICROSOFT_TENANT_ID = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID || 'common';
const OUTLOOK_SCOPES = ['User.Read', 'Mail.Read'];

type OutlookToken = {
  accessToken: string;
  expiresAt: number;
};

export type OutlookMessage = {
  id: string;
  subject: string;
  from?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  sender?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  receivedDateTime?: string;
  sentDateTime?: string;
  webLink?: string;
  toRecipients?: OutlookRecipient[];
  ccRecipients?: OutlookRecipient[];
  bccRecipients?: OutlookRecipient[];
};

type OutlookRecipient = {
  emailAddress?: {
    name?: string;
    address?: string;
  };
};

type OutlookTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

const getRedirectUri = () => `${window.location.origin}/outlook/callback`;

const toBase64Url = (input: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const createRandomString = () => {
  const bytes = new Uint8Array(48);
  window.crypto.getRandomValues(bytes);
  return toBase64Url(bytes.buffer);
};

const createCodeChallenge = async (verifier: string) => {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return toBase64Url(digest);
};

export const isOutlookConfigured = () => Boolean(MICROSOFT_CLIENT_ID);

export const getOutlookToken = () => {
  if (typeof window === 'undefined') return null;

  const rawToken = window.localStorage.getItem(OUTLOOK_TOKEN_KEY);
  if (!rawToken) return null;

  try {
    const token = JSON.parse(rawToken) as OutlookToken;
    if (!token.accessToken || token.expiresAt <= Date.now() + 60_000) {
      window.localStorage.removeItem(OUTLOOK_TOKEN_KEY);
      return null;
    }
    return token.accessToken;
  } catch {
    window.localStorage.removeItem(OUTLOOK_TOKEN_KEY);
    return null;
  }
};

export const clearOutlookToken = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(OUTLOOK_TOKEN_KEY);
};

export const startOutlookSignIn = async () => {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error('Falta NEXT_PUBLIC_MICROSOFT_CLIENT_ID para conectar Outlook.');
  }

  const state = createRandomString();
  const verifier = createRandomString();
  const challenge = await createCodeChallenge(verifier);

  window.sessionStorage.setItem(OUTLOOK_STATE_KEY, state);
  window.sessionStorage.setItem(OUTLOOK_VERIFIER_KEY, verifier);
  window.sessionStorage.setItem(OUTLOOK_RETURN_KEY, window.location.href);

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    response_mode: 'query',
    scope: OUTLOOK_SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  window.location.href = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
};

export const completeOutlookSignIn = async (code: string, state: string) => {
  if (!MICROSOFT_CLIENT_ID) {
    throw new Error('Falta NEXT_PUBLIC_MICROSOFT_CLIENT_ID para conectar Outlook.');
  }

  const storedState = window.sessionStorage.getItem(OUTLOOK_STATE_KEY);
  const verifier = window.sessionStorage.getItem(OUTLOOK_VERIFIER_KEY);

  if (!storedState || !verifier || storedState !== state) {
    throw new Error('La sesión de Outlook expiró o no coincide. Intenta vincular Outlook nuevamente.');
  }

  const body = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    scope: OUTLOOK_SCOPES.join(' '),
    code_verifier: verifier,
  });

  const response = await fetch(`https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = (await response.json()) as OutlookTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'No se pudo completar la conexión con Outlook.');
  }

  window.localStorage.setItem(
    OUTLOOK_TOKEN_KEY,
    JSON.stringify({
      accessToken: payload.access_token,
      expiresAt: Date.now() + (payload.expires_in || 3600) * 1000,
    } satisfies OutlookToken),
  );
  window.sessionStorage.removeItem(OUTLOOK_STATE_KEY);
  window.sessionStorage.removeItem(OUTLOOK_VERIFIER_KEY);

  return window.sessionStorage.getItem(OUTLOOK_RETURN_KEY) || '/';
};

export const fetchOutlookMessages = async (accessToken: string) => {
  const params = new URLSearchParams({
    '$top': '50',
    '$orderby': 'receivedDateTime desc',
    '$select': 'id,subject,from,sender,receivedDateTime,sentDateTime,webLink,toRecipients,ccRecipients,bccRecipients',
  });

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.body-content-type="text"',
    },
  });

  if (response.status === 401) {
    clearOutlookToken();
    throw new Error('La sesión de Outlook expiró. Vuelve a vincular tu cuenta.');
  }

  if (!response.ok) {
    throw new Error('No se pudieron cargar los correos desde Microsoft Graph.');
  }

  const data = (await response.json()) as { value?: OutlookMessage[] };
  return data.value || [];
};
