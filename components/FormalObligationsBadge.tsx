"use client";

import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, FileCheck2, RefreshCw } from 'lucide-react';
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
  const obligation = getObligation(totalPen);

  return (
    <div className="formal-obligations-module panel flex h-full w-full flex-col justify-between p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="eyebrow flex items-center gap-2">
            <FileCheck2 size={14} className="text-ink-faint" />
            Obligaciones formales
            {isLoading && <RefreshCw size={12} className="animate-spin text-ink-faint" />}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {obligation.annexes.map((annex) => (
              <span
                key={annex}
                className={clsx(
                  'formal-obligation-badge inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-medium',
                  // Escalating weight: none < Annex I < Annex I+IV
                  obligation.level === 'none' && 'formal-obligation-badge-none bg-neutral-soft text-neutral-ink',
                  obligation.level === 'annex-i' && 'formal-obligation-badge-annex-i bg-accent-soft text-accent-ink',
                  obligation.level === 'annex-i-iv' && 'formal-obligation-badge-annex-iv bg-caution-soft text-caution-ink',
                )}
              >
                {obligation.level !== 'none' && <CheckCircle2 size={12} />}
                {annex}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs md:min-w-[170px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-ink-soft">Total operaciones</span>
            <span className="font-semibold tabular text-ink">{formatPen(totalPen)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-ink-soft">Obligación</span>
            <span className="font-semibold text-ink">{obligation.label}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-critical/30 bg-critical-soft px-3 py-2 text-xs text-critical-ink">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

    </div>
  );
};
