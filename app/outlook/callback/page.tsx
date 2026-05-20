"use client";

import React from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { completeOutlookSignIn } from '@/lib/outlook';

export default function OutlookCallbackPage() {
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('Conectando Outlook...');

  React.useEffect(() => {
    const finishSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const oauthError = params.get('error_description') || params.get('error');

      if (oauthError) {
        setStatus('error');
        setMessage(oauthError);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('No se recibió el código de autorización de Outlook.');
        return;
      }

      try {
        const returnUrl = await completeOutlookSignIn(code, state);
        setStatus('success');
        setMessage('Outlook vinculado correctamente. Volviendo al dashboard...');
        window.setTimeout(() => {
          window.location.href = returnUrl;
        }, 900);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'No se pudo vincular Outlook.');
      }
    };

    void finishSignIn();
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0b0f19] px-4 text-white">
      <section className="glass w-full max-w-md rounded-2xl border border-[#1e253c] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e253c] text-[#60a5fa]">
          {status === 'loading' && <Loader2 className="animate-spin" size={24} />}
          {status === 'success' && <CheckCircle2 className="text-[#10b981]" size={24} />}
          {status === 'error' && <XCircle className="text-[#ef4444]" size={24} />}
        </div>
        <h1 className="text-lg font-bold">Microsoft Outlook</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
      </section>
    </main>
  );
}
