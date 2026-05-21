"use client";

import React from 'react';
import clsx from 'clsx';
import { AlertCircle, FileCheck2, RefreshCw } from 'lucide-react';
import { Task } from '../data/mockData';
import { Database, getSupabaseClient } from '../lib/supabase';

type ControlledOperationRow = Pick<
  Database['public']['Tables']['controlled_operations']['Row'],
  'section' | 'operation_number' | 'amount_pen'
>;

type FormalObligationsBadgeProps = {
  task: Task;
};

type ObligationLevel = 'none' | 'annex-i' | 'annex-i-iv';

const UIT_2025 = 5350;
const THRESHOLD_100_UIT = 100 * UIT_2025;
const THRESHOLD_400_UIT = 400 * UIT_2025;

const parseOperationNumber = (value: string | null) => {
  const number = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(number) && number > 0 ? String(Math.trunc(number)) : null;
};

const formatPen = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(value);

const formatUit = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const getUniqueValidOperations = (operations: ControlledOperationRow[]) => {
  const seen = new Set<string>();
  return operations.filter((operation) => {
    const operationNumber = parseOperationNumber(operation.operation_number);
    if (!operationNumber) return false;

    const key = `${operation.section}:${operationNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getObligation = (totalPen: number): { level: ObligationLevel; label: string; annexes: string[] } => {
  if (totalPen > THRESHOLD_400_UIT) {
    return {
      level: 'annex-i-iv',
      label: 'Anexos I-IV',
      annexes: ['Anexo I', 'Anexo II', 'Anexo III', 'Anexo IV'],
    };
  }

  if (totalPen > THRESHOLD_100_UIT) {
    return {
      level: 'annex-i',
      label: 'Anexo I',
      annexes: ['Anexo I'],
    };
  }

  return {
    level: 'none',
    label: 'No obligado',
    annexes: ['No obligado'],
  };
};

export const FormalObligationsBadge = ({ task }: FormalObligationsBadgeProps) => {
  const [operations, setOperations] = React.useState<ControlledOperationRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadOperations = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getSupabaseClient()
        .from('controlled_operations')
        .select('section, operation_number, amount_pen')
        .eq('task_id', task.id);

      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo calcular la obligacion formal.');
      console.error('[Supabase] No se pudieron cargar operaciones para obligaciones formales:', error);
    } finally {
      setIsLoading(false);
    }
  }, [task.id]);

  React.useEffect(() => {
    queueMicrotask(() => {
      setOperations([]);
      void loadOperations();
    });
  }, [loadOperations, task.id]);

  React.useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`formal-obligations-${task.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'controlled_operations',
          filter: `task_id=eq.${task.id}`,
        },
        () => {
          void loadOperations();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadOperations, task.id]);

  const validOperations = React.useMemo(() => getUniqueValidOperations(operations), [operations]);
  const totalPen = validOperations.reduce((sum, operation) => sum + (operation.amount_pen || 0), 0);
  const totalUit = totalPen / UIT_2025;
  const obligation = getObligation(totalPen);

  return (
    <div className="formal-obligations-module mt-4 rounded-2xl border border-[#1e253c] bg-[#0e121e]/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <FileCheck2 size={15} className="text-[#8b5cf6]" />
            Obligaciones formales
            {isLoading && <RefreshCw size={12} className="animate-spin text-slate-500" />}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {obligation.annexes.map((annex) => (
              <span
                key={annex}
                className={clsx(
                  'formal-obligation-badge rounded-full border px-2.5 py-1 text-[11px] font-bold',
                  obligation.level === 'none' && 'formal-obligation-badge-none border-slate-600/40 bg-slate-500/10 text-slate-300',
                  obligation.level === 'annex-i' && 'formal-obligation-badge-annex-i border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#93c5fd]',
                  obligation.level === 'annex-i-iv' && 'formal-obligation-badge-annex-iv border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[#c4b5fd]',
                )}
              >
                {annex}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:min-w-[220px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Total operaciones</span>
            <span className="font-bold text-white">{formatPen(totalPen)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Equivalente</span>
            <span className="font-bold text-white">{formatUit(totalUit)} UIT</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Umbral aplicable</span>
            <span className="font-bold text-white">{obligation.label}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fecaca]">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        UIT 2025: S/ 5,350. Limites: 100 UIT = S/ 535,000; 400 UIT = S/ 2,140,000.
      </p>
    </div>
  );
};
