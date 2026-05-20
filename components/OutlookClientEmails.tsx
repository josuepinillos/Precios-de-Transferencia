"use client";

import React from 'react';
import clsx from 'clsx';
import { ExternalLink, Mail, MoreVertical, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Task } from '../data/mockData';
import { getSupabaseClient } from '../lib/supabase';
import {
  clearOutlookToken,
  fetchOutlookMessages,
  getOutlookToken,
  isOutlookConfigured,
  OutlookMessage,
  startOutlookSignIn,
} from '../lib/outlook';

type ClientContact = {
  id: string;
  task_id: string;
  client_name: string;
  email: string;
  created_at: string;
};

type OutlookClientEmailsProps = {
  task: Task;
};

type ClientEmailRow = {
  id: string;
  subject: string;
  sender: string;
  senderEmail: string;
  date: string;
  status: 'Enviado' | 'Recibido';
  webLink: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const formatEmailDate = (value?: string) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getRecipientEmails = (message: OutlookMessage) => [
  ...(message.toRecipients || []),
  ...(message.ccRecipients || []),
  ...(message.bccRecipients || []),
].map((recipient) => normalizeEmail(recipient.emailAddress?.address || '')).filter(Boolean);

const mapMessagesToRows = (messages: OutlookMessage[], contacts: ClientContact[]): ClientEmailRow[] => {
  const contactEmails = new Set(contacts.map((contact) => normalizeEmail(contact.email)));

  return messages
    .map((message) => {
      const from = message.from?.emailAddress || message.sender?.emailAddress;
      const fromEmail = normalizeEmail(from?.address || '');
      const recipients = getRecipientEmails(message);
      const isReceived = contactEmails.has(fromEmail);
      const isSent = recipients.some((email) => contactEmails.has(email));

      if (!isReceived && !isSent) return null;

      return {
        id: message.id,
        subject: message.subject || 'Sin asunto',
        sender: from?.name || fromEmail || 'Sin remitente',
        senderEmail: fromEmail,
        date: formatEmailDate(message.receivedDateTime || message.sentDateTime),
        status: isReceived ? 'Recibido' : 'Enviado',
        webLink: message.webLink || 'https://outlook.office.com/mail/',
      } satisfies ClientEmailRow;
    })
    .filter((row): row is ClientEmailRow => Boolean(row));
};

export const OutlookClientEmails = ({ task }: OutlookClientEmailsProps) => {
  const [contacts, setContacts] = React.useState<ClientContact[]>([]);
  const [messages, setMessages] = React.useState<ClientEmailRow[]>([]);
  const [newEmail, setNewEmail] = React.useState('');
  const [isConnected, setIsConnected] = React.useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = React.useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSavingContact, setIsSavingContact] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadContacts = React.useCallback(async () => {
    try {
      setIsLoadingContacts(true);
      setError(null);
      const { data, error } = await getSupabaseClient()
        .from('client_contacts')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const nextContacts = data || [];
      setContacts(nextContacts);
      return nextContacts;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar los emails del cliente.');
      console.error('[Supabase] No se pudieron cargar los contactos del cliente:', error);
      return [];
    } finally {
      setIsLoadingContacts(false);
    }
  }, [task.id]);

  const loadMessages = React.useCallback(async (nextContacts = contacts) => {
    const token = getOutlookToken();
    setIsConnected(Boolean(token));

    if (!token || nextContacts.length === 0) {
      setMessages([]);
      return;
    }

    try {
      setIsLoadingMessages(true);
      setError(null);
      const graphMessages = await fetchOutlookMessages(token);
      setMessages(mapMessagesToRows(graphMessages, nextContacts));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar correos de Outlook.');
      console.error('[Outlook] No se pudieron cargar correos:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [contacts]);

  React.useEffect(() => {
    queueMicrotask(() => {
      setContacts([]);
      setMessages([]);
      setNewEmail('');
      setIsConnected(Boolean(getOutlookToken()));
      void loadContacts();
    });
  }, [loadContacts, task.id]);

  React.useEffect(() => {
    queueMicrotask(() => {
      void loadMessages(contacts);
    });
  }, [contacts, loadMessages]);

  const handleAddContact = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = normalizeEmail(newEmail);
    if (!email || isSavingContact) return;

    try {
      setIsSavingContact(true);
      setError(null);
      const { data, error } = await getSupabaseClient()
        .from('client_contacts')
        .insert({
          task_id: task.id,
          client_name: task.empresa || task.title,
          email,
        })
        .select('*')
        .single();

      if (error) throw error;
      setContacts((current) => [...current.filter((contact) => contact.email !== email), data]);
      setNewEmail('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo asociar el email al cliente.');
      console.error('[Supabase] No se pudo asociar el email del cliente:', error);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      setError(null);
      const { error } = await getSupabaseClient().from('client_contacts').delete().eq('id', contactId);
      if (error) throw error;
      setContacts((current) => current.filter((contact) => contact.id !== contactId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo eliminar el email asociado.');
      console.error('[Supabase] No se pudo eliminar el email asociado:', error);
    }
  };

  const handleRefresh = async () => {
    const nextContacts = await loadContacts();
    await loadMessages(nextContacts);
  };

  const handleConnect = () => {
    void startOutlookSignIn().catch((error) => {
      setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión con Outlook.');
      console.error('[Outlook] No se pudo iniciar OAuth:', error);
    });
  };

  const handleDisconnect = () => {
    clearOutlookToken();
    setIsConnected(false);
    setMessages([]);
  };

  return (
    <section className="mt-5 rounded-2xl border border-[#1e253c] bg-[#0e121e]/50 overflow-hidden outlook-client-emails">
      <div className="flex flex-col gap-4 border-b border-[#1e253c] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Correos con el cliente</h3>
          <p className="mt-1 text-xs text-slate-400">Outlook sincronizado por emails asociados a esta tarea matriz.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleRefresh();
            }}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#2a334e] bg-[#1e253c]/60 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:bg-[#506ff0]/15 hover:text-white"
          >
            <RefreshCw size={14} className={clsx(isLoadingMessages && 'animate-spin')} />
            Actualizar
          </button>
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="flex h-10 items-center rounded-lg border border-[#2a334e] px-3 text-xs font-medium text-slate-400 transition-colors hover:text-[#ef4444]"
            >
              Desvincular
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={!isOutlookConfigured()}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#506ff0] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#6d83ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail size={14} />
              Vincular Outlook
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
        <aside className="rounded-xl border border-[#1e253c] bg-[#121827]/70 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Emails del cliente</span>
            {isLoadingContacts && <RefreshCw size={13} className="animate-spin text-slate-500" />}
          </div>
          <form onSubmit={handleAddContact} className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="cliente@empresa.com"
              className="min-w-0 flex-1 rounded-lg border border-[#2a334e] bg-[#0e121e] px-3 py-2 text-xs text-white outline-none focus:border-[#506ff0]"
            />
            <button
              type="submit"
              disabled={isSavingContact}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#506ff0] text-white disabled:opacity-60"
              aria-label="Asociar email"
            >
              <Plus size={15} />
            </button>
          </form>

          <div className="mt-3 flex max-h-28 flex-col gap-2 overflow-y-auto scrollbar-hide">
            {contacts.length > 0 ? contacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-2 rounded-lg border border-[#1e253c] bg-[#0e121e]/70 px-2 py-2">
                <Mail size={13} className="text-[#60a5fa]" />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{contact.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteContact(contact.id);
                  }}
                  className="text-slate-500 transition-colors hover:text-[#ef4444]"
                  aria-label="Eliminar email asociado"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-[#2a334e] px-3 py-3 text-xs leading-relaxed text-slate-500">
                Agrega uno o más emails para filtrar correos de este cliente.
              </p>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {error && (
            <div className="mb-3 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fecaca]">
              {error}
            </div>
          )}

          {!isOutlookConfigured() && (
            <div className="mb-3 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-xs text-[#fbbf24]">
              Falta configurar NEXT_PUBLIC_MICROSOFT_CLIENT_ID para habilitar Outlook OAuth.
            </div>
          )}

          <div className="hidden max-h-[340px] overflow-y-auto rounded-xl border border-[#1e253c] md:block scrollbar-hide">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#121827]">
                <tr className="border-b border-[#1e253c] text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="w-12 px-4 py-3"></th>
                  <th className="px-4 py-3">Asunto</th>
                  <th className="px-4 py-3">Remitente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr
                    key={message.id}
                    onClick={() => window.open(message.webLink, '_blank', 'noopener,noreferrer')}
                    className="cursor-pointer border-b border-[#1e253c]/70 transition-colors last:border-0 hover:bg-[#1e253c]/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e253c] text-[#60a5fa]">
                        <Mail size={15} />
                      </div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{message.subject}</p>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate text-xs font-medium text-slate-300">{message.sender}</p>
                      {message.senderEmail && <p className="truncate text-[10px] text-slate-500">{message.senderEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{message.date}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold",
                        message.status === 'Enviado' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]',
                      )}>
                        {message.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      <ExternalLink size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {messages.length === 0 && (
              <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-10 text-center">
                <Mail className="mb-3 text-slate-500" size={26} />
                <p className="text-sm font-semibold text-white">
                  {contacts.length === 0 ? 'Sin emails asociados' : isConnected ? 'No hay correos encontrados' : 'Outlook no vinculado'}
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  {contacts.length === 0
                    ? 'Asocia emails del cliente para empezar a filtrar mensajes.'
                    : isConnected
                      ? 'Presiona Actualizar o revisa que los emails correspondan al cliente.'
                      : 'Vincula Outlook para listar enviados y recibidos relacionados.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex max-h-[360px] flex-col gap-3 overflow-y-auto md:hidden scrollbar-hide">
            {messages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => window.open(message.webLink, '_blank', 'noopener,noreferrer')}
                className="rounded-xl border border-[#1e253c] bg-[#121827]/80 p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e253c] text-[#60a5fa]">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-white">{message.subject}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{message.sender}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500">{message.date}</span>
                      <span className={clsx(
                        "rounded-full px-2 py-1 text-[10px] font-bold",
                        message.status === 'Enviado' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]',
                      )}>
                        {message.status}
                      </span>
                    </div>
                  </div>
                  <MoreVertical size={16} className="text-slate-500" />
                </div>
              </button>
            ))}
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#2a334e] px-4 py-8 text-center text-sm text-slate-500">
                {isConnected ? 'No hay correos para mostrar.' : 'Vincula Outlook para listar correos.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
