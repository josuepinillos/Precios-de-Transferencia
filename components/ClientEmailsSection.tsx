"use client";

import React from 'react';
import clsx from 'clsx';
import { Check, ExternalLink, Mail, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Task } from '../data/mockData';
import { getSupabaseClient } from '../lib/supabase';

type ClientEmailRow = {
  id: string;
  task_id: string;
  subject: string;
  sender: string;
  email_date: string;
  status: 'Enviado' | 'Recibido';
  outlook_link: string | null;
  created_at: string;
  updated_at: string;
};

type ClientEmailForm = {
  subject: string;
  sender: string;
  emailDate: string;
  status: 'Enviado' | 'Recibido';
  outlookLink: string;
};

type ClientEmailsSectionProps = {
  task: Task;
};

const initialForm: ClientEmailForm = {
  subject: '',
  sender: '',
  emailDate: '',
  status: 'Recibido',
  outlookLink: '',
};

const toInputDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const formatEmailDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const ClientEmailsSection = ({ task }: ClientEmailsSectionProps) => {
  const [emails, setEmails] = React.useState<ClientEmailRow[]>([]);
  const [form, setForm] = React.useState<ClientEmailForm>(initialForm);
  const [editingEmailId, setEditingEmailId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadEmails = React.useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await getSupabaseClient()
        .from('client_emails')
        .select('*')
        .eq('task_id', task.id)
        .order('email_date', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar los correos del cliente.');
      console.error('[Supabase] No se pudieron cargar los correos del cliente:', error);
    }
  }, [task.id]);

  React.useEffect(() => {
    queueMicrotask(() => {
      setEmails([]);
      setForm(initialForm);
      setEditingEmailId(null);
      setConfirmDeleteId(null);
      setIsModalOpen(false);
      void loadEmails();
    });
  }, [loadEmails, task.id]);

  const openCreateModal = () => {
    setForm(initialForm);
    setEditingEmailId(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (email: ClientEmailRow) => {
    setForm({
      subject: email.subject,
      sender: email.sender,
      emailDate: toInputDateTime(email.email_date),
      status: email.status,
      outlookLink: email.outlook_link || '',
    });
    setEditingEmailId(email.id);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingEmailId(null);
    setForm(initialForm);
  };

  const validateForm = () => {
    if (!form.subject.trim()) return 'El asunto es obligatorio.';
    if (!form.emailDate) return 'La fecha es obligatoria.';
    if (!form.status) return 'El estado es obligatorio.';
    return null;
  };

  const handleSaveEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      task_id: task.id,
      subject: form.subject.trim(),
      sender: form.sender.trim() || 'Sin remitente',
      email_date: new Date(form.emailDate).toISOString(),
      status: form.status,
      outlook_link: form.outlookLink.trim() || null,
    };

    try {
      setIsSaving(true);
      setError(null);
      const supabase = getSupabaseClient();
      const result = editingEmailId
        ? await supabase.from('client_emails').update(payload).eq('id', editingEmailId).eq('task_id', task.id).select('*').single()
        : await supabase.from('client_emails').insert(payload).select('*').single();

      if (result.error) throw result.error;
      const savedEmail = result.data;

      setEmails((current) => {
        const withoutSaved = current.filter((email) => email.id !== savedEmail.id);
        return [savedEmail, ...withoutSaved].sort((left, right) => new Date(right.email_date).getTime() - new Date(left.email_date).getTime());
      });
      closeModal();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar el correo.');
      console.error('[Supabase] No se pudo guardar el correo del cliente:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (confirmDeleteId !== emailId) {
      setConfirmDeleteId(emailId);
      window.setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }

    try {
      setError(null);
      const { error } = await getSupabaseClient().from('client_emails').delete().eq('id', emailId).eq('task_id', task.id);
      if (error) throw error;
      setEmails((current) => current.filter((email) => email.id !== emailId));
      setConfirmDeleteId(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo eliminar el correo.');
      console.error('[Supabase] No se pudo eliminar el correo del cliente:', error);
    }
  };

  const openOutlookLink = (link: string | null) => {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#1e253c] bg-[#0e121e]/50">
      <div className="flex flex-col gap-4 border-b border-[#1e253c] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Correos con el cliente</h3>
          <p className="mt-1 text-xs text-slate-400">Registro manual de comunicaciones relevantes para esta tarea matriz.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#506ff0] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#6d83ff]"
          >
            <Plus size={14} />
            Agregar correo
          </button>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-3 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fecaca]">
            {error}
          </div>
        )}

        <div className="hidden max-h-[360px] overflow-y-auto rounded-xl border border-[#1e253c] md:block scrollbar-hide">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#121827]">
              <tr className="border-b border-[#1e253c] text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Asunto</th>
                <th className="px-4 py-3">Remitente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id} className="border-b border-[#1e253c]/70 transition-colors last:border-0 hover:bg-[#1e253c]/50">
                  <td className="max-w-[320px] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e253c] text-[#60a5fa]">
                        <Mail size={15} />
                      </div>
                      <p className="truncate text-sm font-semibold text-white">{email.subject}</p>
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="truncate text-xs font-medium text-slate-300">{email.sender}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatEmailDate(email.email_date)}</td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold",
                      email.status === 'Enviado' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]',
                    )}>
                      {email.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openOutlookLink(email.outlook_link)}
                        disabled={!email.outlook_link}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2a334e] px-2.5 text-xs text-slate-300 transition-colors hover:border-[#506ff0]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ExternalLink size={13} />
                        Abrir en Outlook
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(email)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1e253c] hover:text-white"
                        aria-label="Editar correo"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleDeleteEmail(email.id);
                        }}
                        className={clsx(
                          "flex h-9 items-center justify-center rounded-lg border px-2 text-slate-400 transition-colors hover:bg-[#ef4444]/10 hover:text-[#ef4444]",
                          confirmDeleteId === email.id ? "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444]" : "border-transparent",
                        )}
                        aria-label="Eliminar correo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {emails.length === 0 && (
            <div className="flex min-h-[190px] flex-col items-center justify-center px-6 py-10 text-center">
              <Mail className="mb-3 text-slate-500" size={26} />
              <p className="text-sm font-semibold text-white">Sin correos registrados</p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                Agrega manualmente los correos relevantes para esta tarea matriz.
              </p>
            </div>
          )}
        </div>

        <div className="flex max-h-[380px] flex-col gap-3 overflow-y-auto md:hidden scrollbar-hide">
          {emails.map((email) => (
            <article key={email.id} className="rounded-xl border border-[#1e253c] bg-[#121827]/80 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e253c] text-[#60a5fa]">
                  <Mail size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{email.subject}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{email.sender}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">{formatEmailDate(email.email_date)}</span>
                    <span className={clsx(
                      "rounded-full px-2 py-1 text-[10px] font-bold",
                      email.status === 'Enviado' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]',
                    )}>
                      {email.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openOutlookLink(email.outlook_link)}
                      disabled={!email.outlook_link}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2a334e] px-2.5 text-xs text-slate-300 disabled:opacity-40"
                    >
                      <ExternalLink size={13} />
                      Abrir en Outlook
                    </button>
                    <button type="button" onClick={() => openEditModal(email)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2a334e] px-2.5 text-xs text-slate-300">
                      <Pencil size={13} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleDeleteEmail(email.id);
                      }}
                      className={clsx(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs text-slate-300",
                        confirmDeleteId === email.id ? "border-[#ef4444]/50 bg-[#ef4444]/10 text-[#ef4444]" : "border-[#2a334e]",
                      )}
                    >
                      <Trash2 size={13} />
                      {confirmDeleteId === email.id ? 'Confirmar' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {emails.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#2a334e] px-4 py-8 text-center text-sm text-slate-500">
              Sin correos registrados.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#020617]/70 px-4 py-4 backdrop-blur-sm sm:items-center" onClick={closeModal}>
          <form
            onSubmit={handleSaveEmail}
            className="w-full max-w-lg rounded-2xl border border-[#1e253c] bg-[#0e121e] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{editingEmailId ? 'Editar correo' : 'Agregar correo'}</h3>
                <p className="mt-1 text-sm text-slate-400">{task.title}</p>
              </div>
              <button type="button" onClick={closeModal} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e253c] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-400">Asunto *</span>
                <input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className="w-full rounded-lg border border-[#2a334e] bg-[#1e253c] px-4 py-3 text-sm text-white outline-none focus:border-[#506ff0]"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-400">Remitente</span>
                <input
                  value={form.sender}
                  onChange={(event) => setForm((current) => ({ ...current, sender: event.target.value }))}
                  className="w-full rounded-lg border border-[#2a334e] bg-[#1e253c] px-4 py-3 text-sm text-white outline-none focus:border-[#506ff0]"
                  placeholder="Nombre o correo"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">Fecha *</span>
                  <input
                    type="datetime-local"
                    value={form.emailDate}
                    onChange={(event) => setForm((current) => ({ ...current, emailDate: event.target.value }))}
                    className="w-full rounded-lg border border-[#2a334e] bg-[#1e253c] px-4 py-3 text-sm text-white outline-none focus:border-[#506ff0]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">Estado *</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ClientEmailForm['status'] }))}
                    className="w-full rounded-lg border border-[#2a334e] bg-[#1e253c] px-4 py-3 text-sm text-white outline-none focus:border-[#506ff0]"
                  >
                    <option value="Recibido">Recibido</option>
                    <option value="Enviado">Enviado</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-400">Link de Outlook</span>
                <input
                  type="url"
                  value={form.outlookLink}
                  onChange={(event) => setForm((current) => ({ ...current, outlookLink: event.target.value }))}
                  className="w-full rounded-lg border border-[#2a334e] bg-[#1e253c] px-4 py-3 text-sm text-white outline-none focus:border-[#506ff0]"
                  placeholder="https://outlook.office.com/mail/..."
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeModal} className="rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:text-white sm:py-2">
                Cancelar
              </button>
              <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-lg bg-[#506ff0] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d83ff] disabled:opacity-60 sm:py-2">
                <Check size={16} />
                {isSaving ? 'Guardando...' : 'Guardar correo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
