"use client";

import React from 'react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { AlertCircle, Check, Download, FileSpreadsheet, RefreshCw, Upload, X } from 'lucide-react';
import { Task } from '../data/mockData';
import { Database, getSupabaseClient } from '../lib/supabase';

type ControlledOperationRow = Database['public']['Tables']['controlled_operations']['Row'];
type ControlledOperationInsert = Database['public']['Tables']['controlled_operations']['Insert'];

type ControlledOperationsSectionProps = {
  task: Task;
};

type HeaderField =
  | 'operation_number'
  | 'related_party'
  | 'transaction_description'
  | 'transaction_code'
  | 'transaction_type'
  | 'currency'
  | 'amount_origin'
  | 'amount_pen';

type HeaderMap = Partial<Record<HeaderField, number>>;

type ParsedSection = {
  label: string;
  score: number;
};

const SECTION_OPTIONS = [
  '1.1 Transacciones de ingreso',
  '1.2 Transacciones de egreso',
  '1.3 Ingresos inf. 2.5 UIT',
  '1.4 Egresos inf. 2.5 UIT',
  '1.5 Ingresos PBNI',
  '1.6 Egresos PBNI',
  '1.7 Reembolsos ingresos',
  '1.8 Reembolsos egresos',
] as const;

const HEADER_ALIASES: Record<HeaderField, string[]> = {
  operation_number: ['n', 'no', 'nro', 'numero', 'numero operacion', 'nro operacion', 'operacion'],
  related_party: ['sujeto', 'parte v', 'parte vinculada', 'parte relacionada', 'contraparte'],
  transaction_description: ['descripcion', 'descripcion transaccion', 'detalle', 'concepto'],
  transaction_code: ['cod', 'codigo', 'codigo transaccion'],
  transaction_type: ['tipo', 'tipo transaccion'],
  currency: ['divisa', 'moneda'],
  amount_origin: ['mo', 'monto origen', 'moneda origen', 'monto moneda origen', 'importe origen'],
  amount_pen: ['pen', 'monto registro', 'moneda registro', 'monto moneda registro', 'importe pen'],
};

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/º|°/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compactText = (value: unknown) => normalizeText(value).replace(/\./g, '');

const isBlankRow = (row: unknown[]) => row.every((cell) => normalizeText(cell).length === 0);

const isTotalRow = (row: unknown[]) => row.some((cell) => /\btotal\b/.test(normalizeText(cell)));

const cleanText = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
};

const parseAmount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return null;

  const normalized =
    cleaned.includes(',') && !cleaned.includes('.')
      ? cleaned.replace(',', '.')
      : cleaned.replace(/,/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
};

const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const getSectionFromText = (value: unknown): ParsedSection | null => {
  const text = normalizeText(value);
  const compact = compactText(value);
  if (!text) return null;

  if (text.includes('1.1') || compact.includes('11') || (text.includes('ingreso') && text.includes('transaccion'))) {
    return { label: '1.1 Transacciones de ingreso', score: 4 };
  }
  if (text.includes('1.2') || compact.includes('12') || (text.includes('egreso') && text.includes('transaccion'))) {
    return { label: '1.2 Transacciones de egreso', score: 4 };
  }
  if (text.includes('1.3') || compact.includes('13') || (text.includes('ingreso') && (text.includes('2.5') || text.includes('uit')))) {
    return { label: '1.3 Ingresos inf. 2.5 UIT', score: 5 };
  }
  if (text.includes('1.4') || compact.includes('14') || (text.includes('egreso') && (text.includes('2.5') || text.includes('uit')))) {
    return { label: '1.4 Egresos inf. 2.5 UIT', score: 5 };
  }
  if (text.includes('1.5') || compact.includes('15') || (text.includes('ingreso') && text.includes('pbni'))) {
    return { label: '1.5 Ingresos PBNI', score: 5 };
  }
  if (text.includes('1.6') || compact.includes('16') || (text.includes('egreso') && text.includes('pbni'))) {
    return { label: '1.6 Egresos PBNI', score: 5 };
  }
  if (text.includes('1.7') || compact.includes('17') || (text.includes('reembolso') && text.includes('ingreso'))) {
    return { label: '1.7 Reembolsos ingresos', score: 5 };
  }
  if (text.includes('1.8') || compact.includes('18') || (text.includes('reembolso') && text.includes('egreso'))) {
    return { label: '1.8 Reembolsos egresos', score: 5 };
  }
  if (text.includes('ingreso')) return { label: '1.1 Transacciones de ingreso', score: 2 };
  if (text.includes('egreso')) return { label: '1.2 Transacciones de egreso', score: 2 };
  if (text.includes('pbni')) return { label: '1.5 Ingresos PBNI', score: 2 };
  if (text.includes('reembolso')) return { label: '1.7 Reembolsos ingresos', score: 2 };
  return null;
};

const detectSection = (row: unknown[]) => {
  const nonEmptyCells = row.filter((cell) => normalizeText(cell).length > 0);
  if (nonEmptyCells.length === 0 || nonEmptyCells.length > 4) return null;

  let bestSection: ParsedSection | null = null;
  for (const cell of row) {
    const section = getSectionFromText(cell);
    if (section && (!bestSection || section.score > bestSection.score)) {
      bestSection = section;
    }
  }
  return bestSection?.label || null;
};

const detectHeaderMap = (row: unknown[], previousRow: unknown[] = []): HeaderMap | null => {
  const headerMap: HeaderMap = {};

  row.forEach((cell, index) => {
    const normalizedCell = normalizeText([previousRow[index], cell].filter(Boolean).join(' '));
    if (!normalizedCell) return;

    (Object.entries(HEADER_ALIASES) as Array<[HeaderField, string[]]>).forEach(([field, aliases]) => {
      if (headerMap[field] !== undefined) return;
      if (aliases.some((alias) => (alias.length <= 3 ? normalizedCell === alias : normalizedCell.includes(alias)))) {
        headerMap[field] = index;
      }
    });
  });

  const hasIdentityColumn = headerMap.operation_number !== undefined || headerMap.related_party !== undefined;
  const hasAmountColumn = headerMap.amount_origin !== undefined || headerMap.amount_pen !== undefined;
  return Object.keys(headerMap).length >= 2 && (hasIdentityColumn || hasAmountColumn) ? headerMap : null;
};

const getCell = (row: unknown[], headerMap: HeaderMap, field: HeaderField) => {
  const index = headerMap[field];
  return index === undefined ? null : row[index];
};

const fillMergedCells = (sheet: XLSX.WorkSheet) => {
  const merges = sheet['!merges'] || [];
  merges.forEach((mergeRange) => {
    const sourceAddress = XLSX.utils.encode_cell(mergeRange.s);
    const sourceCell = sheet[sourceAddress];
    if (!sourceCell) return;

    for (let rowIndex = mergeRange.s.r; rowIndex <= mergeRange.e.r; rowIndex += 1) {
      for (let columnIndex = mergeRange.s.c; columnIndex <= mergeRange.e.c; columnIndex += 1) {
        const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
        if (!sheet[address]) {
          sheet[address] = { ...sourceCell };
        }
      }
    }
  });
};

const parseWorkbookRows = (rows: unknown[][], taskId: string) => {
  const operations: ControlledOperationInsert[] = [];
  let currentSection: string | null = null;
  let headerMap: HeaderMap | null = null;
  let previousRow: unknown[] = [];

  rows.forEach((row) => {
    if (isBlankRow(row)) {
      headerMap = null;
      previousRow = row;
      return;
    }

    const section = detectSection(row);
    if (section) {
      currentSection = section;
      headerMap = null;
      console.log('Sección detectada:', section);
      previousRow = row;
      return;
    }

    if (!currentSection) return;

    if (isTotalRow(row)) {
      headerMap = null;
      previousRow = row;
      return;
    }

    const detectedHeader = detectHeaderMap(row, previousRow);
    if (detectedHeader) {
      headerMap = detectedHeader;
      console.log('Encabezado detectado:', detectedHeader);
      previousRow = row;
      return;
    }

    if (!headerMap) {
      previousRow = row;
      return;
    }

    const operation: ControlledOperationInsert = {
      task_id: taskId,
      section: currentSection,
      operation_number: cleanText(getCell(row, headerMap, 'operation_number')),
      related_party: cleanText(getCell(row, headerMap, 'related_party')),
      transaction_description: cleanText(getCell(row, headerMap, 'transaction_description')),
      transaction_code: cleanText(getCell(row, headerMap, 'transaction_code')),
      transaction_type: cleanText(getCell(row, headerMap, 'transaction_type')),
      currency: cleanText(getCell(row, headerMap, 'currency')),
      amount_origin: parseAmount(getCell(row, headerMap, 'amount_origin')),
      amount_pen: parseAmount(getCell(row, headerMap, 'amount_pen')),
    };

    const hasContent = [
      operation.operation_number,
      operation.related_party,
      operation.transaction_description,
      operation.transaction_code,
      operation.transaction_type,
      operation.currency,
      operation.amount_origin,
      operation.amount_pen,
    ].some((value) => value !== null && value !== undefined && value !== '');

    if (hasContent) {
      console.log('Fila parseada:', operation);
      operations.push(operation);
    }
    previousRow = row;
  });

  return operations;
};

const parseExcelFile = async (file: File, taskId: string) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const operations: ControlledOperationInsert[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    fillMergedCells(sheet);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
    });
    operations.push(...parseWorkbookRows(rows, taskId));
  });

  return operations;
};

const groupBySection = <T extends { section: string }>(items: T[]) =>
  items.reduce<Record<string, T[]>>((accumulator, item) => {
    accumulator[item.section] = accumulator[item.section] || [];
    accumulator[item.section].push(item);
    return accumulator;
  }, {});

const buildExportRows = (operations: ControlledOperationRow[]) =>
  operations.map((operation) => ({
    Seccion: operation.section,
    'Numero de operacion': operation.operation_number || '',
    'Parte vinculada': operation.related_party || '',
    Descripcion: operation.transaction_description || '',
    'Codigo de transaccion': operation.transaction_code || '',
    'Tipo de transaccion': operation.transaction_type || '',
    Divisa: operation.currency || '',
    'Monto moneda origen': operation.amount_origin || 0,
    'Monto moneda registro': operation.amount_pen || 0,
  }));

const OperationStatusBadge = ({ label }: { label: string }) => (
  <span className="inline-flex rounded-full border border-[#506ff0]/30 bg-[#506ff0]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9fb0ff]">
    {label}
  </span>
);

export const ControlledOperationsSection = ({ task }: ControlledOperationsSectionProps) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [operations, setOperations] = React.useState<ControlledOperationRow[]>([]);
  const [previewOperations, setPreviewOperations] = React.useState<ControlledOperationInsert[]>([]);
  const [activeSection, setActiveSection] = React.useState<string>(SECTION_OPTIONS[0]);
  const [fileName, setFileName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadOperations = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getSupabaseClient()
        .from('controlled_operations')
        .select('*')
        .eq('task_id', task.id)
        .order('section', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar las operaciones controladas.');
      console.error('[Supabase] No se pudieron cargar las operaciones controladas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [task.id]);

  React.useEffect(() => {
    queueMicrotask(() => {
      setOperations([]);
      setPreviewOperations([]);
      setFileName('');
      setActiveSection(SECTION_OPTIONS[0]);
      void loadOperations();
    });
  }, [loadOperations, task.id]);

  React.useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`controlled-operations-${task.id}`)
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

  const groupedOperations = React.useMemo(() => groupBySection(operations), [operations]);
  const groupedPreview = React.useMemo(() => groupBySection(previewOperations), [previewOperations]);

  const availableSections = React.useMemo(() => {
    const sections = SECTION_OPTIONS.filter((section) => (groupedOperations[section]?.length || 0) > 0);
    return sections.length > 0 ? sections : [...SECTION_OPTIONS];
  }, [groupedOperations]);

  const visibleSection = availableSections.includes(activeSection as (typeof SECTION_OPTIONS)[number])
    ? activeSection
    : availableSections[0];

  const visibleOperations = groupedOperations[visibleSection] || [];
  const totalAmountOrigin = operations.reduce((sum, operation) => sum + (operation.amount_origin || 0), 0);
  const totalAmountPen = operations.reduce((sum, operation) => sum + (operation.amount_pen || 0), 0);
  const previewAmountPen = previewOperations.reduce((sum, operation) => sum + (operation.amount_pen || 0), 0);
  const sectionsWithData = Object.keys(groupedOperations).length;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsParsing(true);
      setError(null);
      const parsedOperations = await parseExcelFile(file, task.id);
      if (parsedOperations.length === 0) {
        setPreviewOperations([]);
        setFileName('');
        setError('No se detectaron operaciones controladas en el archivo. Verifica secciones y encabezados.');
        return;
      }

      setPreviewOperations(parsedOperations);
      setFileName(file.name);
      setActiveSection(parsedOperations[0]?.section || SECTION_OPTIONS[0]);
    } catch (error) {
      setPreviewOperations([]);
      setFileName('');
      setError(error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.');
      console.error('[Excel] No se pudo leer el archivo de operaciones controladas:', error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSavePreview = async () => {
    if (previewOperations.length === 0) return;

    try {
      setIsSaving(true);
      setError(null);
      const { error } = await getSupabaseClient().from('controlled_operations').insert(previewOperations);
      if (error) throw error;
      setPreviewOperations([]);
      setFileName('');
      await loadOperations();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron guardar las operaciones en Supabase.');
      console.error('[Supabase] No se pudieron guardar las operaciones controladas:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (operations.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(operations));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Operaciones');
    XLSX.writeFile(workbook, `${task.title.replace(/[\\/:*?"<>|]/g, '-')}-operaciones-controladas.xlsx`);
  };

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#1e253c] bg-[#0e121e]/50">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={(event) => {
          void handleFileChange(event);
        }}
        className="hidden"
      />

      <div className="flex flex-col gap-4 border-b border-[#1e253c] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Operaciones controladas</h3>
          <p className="mt-1 text-xs text-slate-400">
            Importacion automatica desde Excel vinculada a esta tarea matriz.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadOperations();
            }}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#2a334e] bg-[#1e253c]/60 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:bg-[#506ff0]/15 hover:text-white"
          >
            <RefreshCw size={14} className={clsx(isLoading && 'animate-spin')} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={operations.length === 0}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#2a334e] bg-[#1e253c]/60 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:bg-[#506ff0]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing || isSaving}
            className="flex h-10 items-center gap-2 rounded-lg bg-[#506ff0] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#6d83ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={14} />
            {isParsing ? 'Leyendo...' : 'Importar Excel'}
          </button>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-3 py-2 text-xs text-[#fecaca]">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {previewOperations.length > 0 && (
          <div className="mb-4 rounded-xl border border-[#506ff0]/40 bg-[#506ff0]/10 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileSpreadsheet size={16} className="text-[#9fb0ff]" />
                  Preview de importacion
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {fileName} - {previewOperations.length} operaciones detectadas en {Object.keys(groupedPreview).length} secciones.
                </p>
                <p className="mt-1 text-xs text-slate-500">Total moneda registro: {formatMoney(previewAmountPen)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewOperations([]);
                    setFileName('');
                  }}
                  disabled={isSaving}
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#2a334e] bg-[#1e253c]/60 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-[#1e253c]"
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSavePreview();
                  }}
                  disabled={isSaving}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#10b981] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#34d399] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={14} />
                  {isSaving ? 'Guardando...' : 'Guardar en Supabase'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Operaciones', value: operations.length.toString() },
            { label: 'Secciones', value: sectionsWithData.toString() },
            { label: 'Monto origen', value: formatMoney(totalAmountOrigin) },
            { label: 'Monto registro', value: formatMoney(totalAmountPen) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#1e253c] bg-[#121827]/70 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-2 truncate text-lg font-bold text-white">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {availableSections.map((section) => {
            const count = groupedOperations[section]?.length || 0;
            const isActive = visibleSection === section;
            return (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={clsx(
                  'flex-shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                  isActive
                    ? 'border-[#6d83ff] bg-[#506ff0]/20 text-white shadow-[0_0_18px_rgba(80,111,240,0.18)]'
                    : 'border-[#1e253c] bg-[#121827]/60 text-slate-400 hover:border-[#506ff0]/50 hover:text-slate-200',
                )}
              >
                <span className="block font-semibold">{section}</span>
                <span className="mt-0.5 block text-[10px] opacity-70">{count} registros</span>
              </button>
            );
          })}
        </div>

        <div className="hidden max-h-[420px] overflow-auto rounded-xl border border-[#1e253c] md:block scrollbar-hide">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#121827]">
              <tr className="border-b border-[#1e253c] text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Operacion</th>
                <th className="px-4 py-3">Parte vinculada</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Divisa</th>
                <th className="px-4 py-3 text-right">Monto origen</th>
                <th className="px-4 py-3 text-right">Monto registro</th>
              </tr>
            </thead>
            <tbody>
              {visibleOperations.map((operation) => (
                <tr key={operation.id} className="border-b border-[#1e253c]/70 transition-colors last:border-0 hover:bg-[#1e253c]/50">
                  <td className="px-4 py-3 text-sm font-semibold text-white">{operation.operation_number || '-'}</td>
                  <td className="max-w-[220px] px-4 py-3 text-xs text-slate-300">
                    <span className="line-clamp-2">{operation.related_party || '-'}</span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-slate-300">
                    <span className="line-clamp-2">{operation.transaction_description || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {operation.transaction_code ? <OperationStatusBadge label={operation.transaction_code} /> : <span className="text-xs text-slate-500">-</span>}
                  </td>
                  <td className="max-w-[180px] px-4 py-3 text-xs text-slate-300">
                    <span className="line-clamp-2">{operation.transaction_type || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-200">{operation.currency || '-'}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-slate-200">{formatMoney(operation.amount_origin)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-white">{formatMoney(operation.amount_pen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {visibleOperations.map((operation) => (
            <article key={operation.id} className="rounded-xl border border-[#1e253c] bg-[#121827]/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{operation.operation_number || 'Operacion sin numero'}</p>
                  <p className="mt-1 text-xs text-slate-400">{operation.related_party || 'Sin parte vinculada'}</p>
                </div>
                {operation.transaction_code && <OperationStatusBadge label={operation.transaction_code} />}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">{operation.transaction_description || 'Sin descripcion.'}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Divisa</p>
                  <p className="mt-1 font-semibold text-slate-200">{operation.currency || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tipo</p>
                  <p className="mt-1 font-semibold text-slate-200">{operation.transaction_type || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Monto origen</p>
                  <p className="mt-1 font-semibold text-slate-200">{formatMoney(operation.amount_origin)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Monto registro</p>
                  <p className="mt-1 font-semibold text-white">{formatMoney(operation.amount_pen)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && visibleOperations.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#2a334e] bg-[#121827]/40 px-4 py-8 text-center">
            <FileSpreadsheet size={26} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-white">Aun no hay operaciones controladas</p>
            <p className="mt-1 text-xs text-slate-500">Importa un Excel estructurado para alimentar esta seccion.</p>
          </div>
        )}
      </div>
    </section>
  );
};
