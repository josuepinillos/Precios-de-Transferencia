"use client";

import React from 'react';
import { AlertTriangle, CalendarClock, Check, Edit2, Eye, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { Task, USERS } from '../data/mockData';
import { Database, getSupabaseClient } from '../lib/supabase';
import { useDashboardStore } from '../store/useDashboardStore';

type SunatDueDateRow = Database['public']['Tables']['sunat_due_dates']['Row'];
type SunatCondition = SunatDueDateRow['condition'];
type SunatStatus = 'VENCIDO' | 'ATENCION' | 'A TIEMPO';
type RangeFilter = 'all' | 'overdue' | 'le7' | 'le15' | 'gt15';
type DueDateSort = 'asc' | 'desc';

type SunatSchedule = {
  exercise: number;
  regular: Record<string, string>;
  goodTaxpayer: string;
};

const SUNAT_SCHEDULES: Record<number, SunatSchedule> = {
  2025: {
    exercise: 2025,
    regular: {
      '0': '2026-06-15',
      '1': '2026-06-16',
      '2': '2026-06-17',
      '3': '2026-06-17',
      '4': '2026-06-18',
      '5': '2026-06-18',
      '6': '2026-06-19',
      '7': '2026-06-19',
      '8': '2026-06-22',
      '9': '2026-06-22',
    },
    goodTaxpayer: '2026-06-23',
  },
};

const ACTIVE_EXERCISE = 2025;
const TEAM_MEMBERS = Object.values(USERS);

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const startOfToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const formatSunatDate = (value: string) => {
  const date = parseLocalDate(value);
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
};

const getLastDigit = (ruc: string) => ruc.slice(-1);

const getDueDate = (ruc: string, condition: SunatCondition) => {
  const schedule = SUNAT_SCHEDULES[ACTIVE_EXERCISE];
  return condition === 'good_taxpayer' ? schedule.goodTaxpayer : schedule.regular[getLastDigit(ruc)];
};

const getDaysRemaining = (dueDate: string) => {
  const diff = parseLocalDate(dueDate).getTime() - startOfToday().getTime();
  return Math.ceil(diff / 86_400_000);
};

const getStatus = (daysRemaining: number): SunatStatus => {
  if (daysRemaining < 0) return 'VENCIDO';
  if (daysRemaining <= 7) return 'ATENCION';
  return 'A TIEMPO';
};

const getStatusClasses = (status: SunatStatus) => {
  if (status === 'VENCIDO') return 'sunat-status-overdue bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30';
  if (status === 'ATENCION') return 'sunat-status-warning bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30';
  return 'sunat-status-ready bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30';
};

const getConditionLabel = (condition: SunatCondition) =>
  condition === 'good_taxpayer' ? 'Buen Contribuyente' : 'Régimen General';

const buildSunatRecord = (row: SunatDueDateRow, task: Task, progress: number) => {
  const dueDate = getDueDate(row.ruc, row.condition);
  const daysRemaining = getDaysRemaining(dueDate);
  const status = getStatus(daysRemaining);

  return {
    ...row,
    task,
    progress,
    lastDigit: getLastDigit(row.ruc),
    dueDate,
    daysRemaining,
    status,
  };
};

export const SunatDueDatesSection = () => {
  const { tasks, getTaskProgress, selectTask, setCurrentView } = useDashboardStore();
  const [rows, setRows] = React.useState<SunatDueDateRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [taskId, setTaskId] = React.useState('');
  const [ruc, setRuc] = React.useState('');
  const [condition, setCondition] = React.useState<SunatCondition>('general');
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | SunatStatus>('all');
  const [assigneeFilter, setAssigneeFilter] = React.useState('all');
  const [conditionFilter, setConditionFilter] = React.useState<'all' | SunatCondition>('all');
  const [rangeFilter, setRangeFilter] = React.useState<RangeFilter>('all');
  const [dueDateSort, setDueDateSort] = React.useState<DueDateSort>('asc');
  const referenceRef = React.useRef<HTMLDivElement>(null);

  const loadRows = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getSupabaseClient()
        .from('sunat_due_dates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error('[Supabase] No se pudieron cargar vencimientos SUNAT:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void Promise.resolve().then(loadRows);

    const channel = getSupabaseClient()
      .channel('sunat-due-dates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sunat_due_dates' }, () => {
        void loadRows();
      })
      .subscribe();

    return () => {
      void getSupabaseClient().removeChannel(channel);
    };
  }, [loadRows]);

  const records = React.useMemo(() => {
    return rows
      .map((row) => {
        const task = tasks.find((item) => item.id === row.task_id);
        if (!task) return null;
        return buildSunatRecord(row, task, getTaskProgress(task.id));
      })
      .filter((record): record is NonNullable<typeof record> => Boolean(record));
  }, [getTaskProgress, rows, tasks]);

  const filteredRecords = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return records
      .filter((record) => {
        const matchesSearch =
          !normalizedSearch ||
          record.task.title.toLowerCase().includes(normalizedSearch) ||
          record.ruc.includes(normalizedSearch);
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        const matchesAssignee = assigneeFilter === 'all' || record.task.assignee.name === assigneeFilter;
        const matchesCondition = conditionFilter === 'all' || record.condition === conditionFilter;
        const matchesRange =
          rangeFilter === 'all' ||
          (rangeFilter === 'overdue' && record.daysRemaining < 0) ||
          (rangeFilter === 'le7' && record.daysRemaining >= 0 && record.daysRemaining <= 7) ||
          (rangeFilter === 'le15' && record.daysRemaining >= 0 && record.daysRemaining <= 15) ||
          (rangeFilter === 'gt15' && record.daysRemaining > 15);

        return matchesSearch && matchesStatus && matchesAssignee && matchesCondition && matchesRange;
      })
      .sort((left, right) => {
        const difference = parseLocalDate(left.dueDate).getTime() - parseLocalDate(right.dueDate).getTime();
        return dueDateSort === 'asc' ? difference : -difference;
      });
  }, [assigneeFilter, conditionFilter, dueDateSort, rangeFilter, records, search, statusFilter]);

  const kpis = React.useMemo(() => {
    return {
      total: records.length,
      overdue: records.filter((record) => record.daysRemaining < 0).length,
      le7: records.filter((record) => record.daysRemaining >= 0 && record.daysRemaining <= 7).length,
      le15: records.filter((record) => record.daysRemaining >= 0 && record.daysRemaining <= 15).length,
      gt15: records.filter((record) => record.daysRemaining > 15).length,
    };
  }, [records]);

  const openAssignModal = () => {
    const firstTask = tasks[0];
    setEditingTaskId(null);
    setTaskId(firstTask?.id || '');
    setRuc('');
    setCondition('general');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: (typeof records)[number]) => {
    setEditingTaskId(record.task_id);
    setTaskId(record.task_id);
    setRuc(record.ruc);
    setCondition(record.condition);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedRuc = ruc.trim();
    if (!taskId) {
      setModalError('Selecciona un cliente.');
      return;
    }
    if (!/^\d{11}$/.test(normalizedRuc)) {
      setModalError('El RUC debe contener exactamente 11 dígitos numéricos.');
      return;
    }
    if (!editingTaskId && rows.some((row) => row.task_id === taskId)) {
      setModalError('Este cliente ya tiene un RUC asignado. Usa Editar RUC.');
      return;
    }

    try {
      setIsSaving(true);
      setModalError(null);
      const { error } = await getSupabaseClient()
        .from('sunat_due_dates')
        .upsert(
          {
            task_id: taskId,
            ruc: normalizedRuc,
            condition,
          },
          { onConflict: 'task_id' },
        );

      if (error) throw error;
      setIsModalOpen(false);
      await loadRows();
    } catch (error) {
      console.error('[Supabase] No se pudo guardar el RUC:', error);
      setModalError('No se pudo guardar el RUC. Revisa la consola e intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const showDetail = (taskIdToOpen: string) => {
    selectTask(taskIdToOpen);
    setCurrentView('timeline');
  };

  return (
    <section className="sunat-due-dates-section flex flex-col gap-5">
      <div className="flex flex-col gap-4 border-b border-[#1e253c] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="sunat-header-icon flex h-11 w-11 items-center justify-center rounded-xl border border-[#2a334e] bg-[#1e253c] text-[#506ff0] shadow-lg">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vencimientos SUNAT</h2>
              <p className="mt-1 text-sm text-slate-400">
                Control de fechas máximas de declaración según último dígito del RUC.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => referenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="sunat-secondary-button rounded-lg border border-[#2a334e] bg-[#121827] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:text-white"
          >
            Ver calendario
          </button>
          <button
            type="button"
            onClick={openAssignModal}
            className="rounded-lg bg-[#506ff0] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#6d83ff]"
          >
            Asignar RUC
          </button>
        </div>
      </div>

      <div className="sunat-kpi-strip grid overflow-hidden rounded-2xl border border-[#1e253c] bg-[#0e121e]/50 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Total clientes', kpis.total],
          ['Vencidos', kpis.overdue],
          ['Vencen en ≤ 7 días', kpis.le7],
          ['Vencen en ≤ 15 días', kpis.le15],
          ['Más de 15 días', kpis.gt15],
        ].map(([label, value]) => (
          <div key={label} className="sunat-kpi-cell border-b border-[#1e253c] px-4 py-3 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="sunat-table-shell rounded-2xl border border-[#1e253c] bg-[#0e121e]/50 p-3 sm:p-4">
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1.2fr)_repeat(5,minmax(150px,1fr))]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente o RUC..."
              className="w-full rounded-lg border border-[#1e253c] bg-[#121827] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#506ff0]"
            />
          </div>

          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | SunatStatus)} className="rounded-lg border border-[#1e253c] bg-[#121827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-[#506ff0]">
            <option value="all">Todos los estados</option>
            <option value="VENCIDO">Vencido</option>
            <option value="ATENCION">Atención</option>
            <option value="A TIEMPO">A tiempo</option>
          </select>

          <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="rounded-lg border border-[#1e253c] bg-[#121827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-[#506ff0]">
            <option value="all">Todos los responsables</option>
            {TEAM_MEMBERS.map((member) => (
              <option key={member.name} value={member.name}>{member.name}</option>
            ))}
          </select>

          <select value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value as 'all' | SunatCondition)} className="rounded-lg border border-[#1e253c] bg-[#121827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-[#506ff0]">
            <option value="all">Todas las condiciones</option>
            <option value="general">Régimen General</option>
            <option value="good_taxpayer">Buen Contribuyente</option>
          </select>

          <select value={rangeFilter} onChange={(event) => setRangeFilter(event.target.value as RangeFilter)} className="rounded-lg border border-[#1e253c] bg-[#121827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-[#506ff0]">
            <option value="all">Todos los rangos</option>
            <option value="overdue">Vencidos</option>
            <option value="le7">≤ 7 días</option>
            <option value="le15">≤ 15 días</option>
            <option value="gt15">Más de 15 días</option>
          </select>
          <select value={dueDateSort} onChange={(event) => setDueDateSort(event.target.value as DueDateSort)} className="rounded-lg border border-[#1e253c] bg-[#121827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-[#506ff0]">
            <option value="asc">↑ Fecha mÃ¡xima</option>
            <option value="desc">↓ Fecha mÃ¡xima</option>
          </select>
        </div>

        <div className="sunat-table-wrap overflow-x-auto rounded-xl border border-[#1e253c] scrollbar-hide">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead className="sunat-table-header bg-[#121827] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {['Cliente', 'RUC', 'Últ. Dígito', 'Condición', 'Fecha Máxima', 'Días Restantes', 'Estado', 'Progreso', 'Responsable', 'Acciones'].map((header) => (
                  <th key={header} className="border-b border-[#1e253c] px-4 py-3 font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="sunat-table-body divide-y divide-[#1e253c]">
              {isLoading && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">Cargando vencimientos...</td>
                </tr>
              )}
              {!isLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">No hay vencimientos SUNAT para los filtros seleccionados.</td>
                </tr>
              )}
              {!isLoading && filteredRecords.map((record) => (
                <tr key={record.id} className="sunat-table-row bg-[#0e121e]/30 transition-colors hover:bg-[#1e253c]/35">
                  <td className="px-4 py-5">
                    <span className="font-semibold text-white">{record.task.title}</span>
                  </td>
                  <td className="px-4 py-5 font-mono text-slate-200">{record.ruc}</td>
                  <td className="px-4 py-5">
                    <span className="sunat-last-digit-badge inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-[#506ff0]/35 bg-[#506ff0]/10 px-2 text-xs font-bold text-[#8ba0ff]">
                      {record.lastDigit}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-slate-300">{getConditionLabel(record.condition)}</td>
                  <td className="px-4 py-5 font-semibold text-white">{formatSunatDate(record.dueDate)}</td>
                  <td className="px-4 py-4 text-slate-300">{record.daysRemaining} días</td>
                  <td className="px-4 py-5">
                    <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-bold", getStatusClasses(record.status))}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex min-w-[140px] items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1e253c]">
                        <div className="h-full rounded-full bg-[#506ff0]" style={{ width: `${record.progress}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs font-semibold text-slate-200">{record.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-slate-300">{record.task.assignee.name}</span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => showDetail(record.task_id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1e253c] hover:text-white" title="Ver detalle">
                        <Eye size={15} />
                      </button>
                      <button type="button" onClick={() => openEditModal(record)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1e253c] hover:text-white" title="Editar RUC">
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div ref={referenceRef} className="rounded-2xl border border-[#1e253c] bg-[#0e121e]/50 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-white">Cronograma ejercicio 2025</h3>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="min-w-[720px] w-full border-collapse text-center text-sm">
            <tbody>
              <tr className="bg-[#121827] text-xs uppercase tracking-wide text-slate-500">
                <th className="border border-[#1e253c] px-3 py-2 text-left">Último dígito</th>
                {['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'BC'].map((digit) => (
                  <td key={digit} className="border border-[#1e253c] px-3 py-2 font-semibold">{digit}</td>
                ))}
              </tr>
              <tr className="text-slate-300">
                <th className="border border-[#1e253c] px-3 py-2 text-left text-xs uppercase tracking-wide text-slate-500">Fecha máxima</th>
                {['15 Jun', '16 Jun', '17 Jun', '17 Jun', '18 Jun', '18 Jun', '19 Jun', '19 Jun', '22 Jun', '22 Jun', '23 Jun'].map((date, index) => (
                  <td key={`${date}-${index}`} className="border border-[#1e253c] px-3 py-2">{date}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#020617]/70 px-4 py-4 backdrop-blur-sm sm:items-center" onClick={() => setIsModalOpen(false)}>
          <form onSubmit={handleSave} className="w-full max-w-lg rounded-2xl border border-[#1e253c] bg-[#0e121e] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">{editingTaskId ? 'Editar RUC' : 'Asignar RUC'}</h3>
                <p className="mt-1 text-sm text-slate-400">Registra el RUC del cliente y su condición SUNAT.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#1e253c] hover:text-white">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-sm text-[#fecaca]">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-400">Cliente</span>
                <select value={taskId} onChange={(event) => setTaskId(event.target.value)} disabled={Boolean(editingTaskId)} className="rounded-lg border border-[#2a334e] bg-[#121827] px-3 py-3 text-sm text-slate-200 outline-none focus:border-[#506ff0] disabled:opacity-60">
                  <option value="">Seleccionar cliente</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-400">RUC</span>
                <input
                  value={ruc}
                  onChange={(event) => setRuc(event.target.value.replace(/\D/g, '').slice(0, 11))}
                  inputMode="numeric"
                  placeholder="Ingrese 11 dígitos"
                  className="rounded-lg border border-[#2a334e] bg-[#121827] px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#506ff0]"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-400">Condición</span>
                <select value={condition} onChange={(event) => setCondition(event.target.value as SunatCondition)} className="rounded-lg border border-[#2a334e] bg-[#121827] px-3 py-3 text-sm text-slate-200 outline-none focus:border-[#506ff0]">
                  <option value="general">Régimen General</option>
                  <option value="good_taxpayer">Buen Contribuyente</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:text-white sm:py-2">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-lg bg-[#506ff0] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d83ff] disabled:cursor-not-allowed disabled:opacity-60 sm:py-2">
                <Check size={16} />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
