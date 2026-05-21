"use client";

import React from 'react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { AlertCircle, Check, ChevronDown, Download, FileSpreadsheet, RefreshCw, Upload, X } from 'lucide-react';
import { Task } from '../data/mockData';
import { Database, Json, getSupabaseClient } from '../lib/supabase';

type HistoricalResultRow = Database['public']['Tables']['historical_results']['Row'];
type HistoricalResultInsert = Database['public']['Tables']['historical_results']['Insert'];

type HistoricalResultsSectionProps = {
  task: Task;
};

type MetricKey = 'lower_quartile' | 'median' | 'upper_quartile';
type YearValueMap = Record<string, number | null>;

type TechnicalTablePayload = {
  years: number[];
  comparable: Record<MetricKey, YearValueMap>;
  comparableAverage: Record<MetricKey, number | null>;
  company: {
    label: string;
    values: YearValueMap;
    average: number | null;
  };
};

type HistoricalResultLike = HistoricalResultRow | HistoricalResultInsert;

const YEARS = [2025, 2024, 2023, 2022, 2021];
const YEAR_SET = new Set(YEARS);
const TABLE_YEAR_SET = new Set([2025, 2024, 2023, 2022, 2021, 2020, 2019]);
const METRIC_LABELS: Array<[MetricKey, string]> = [
  ['lower_quartile', 'Cuartil inferior'],
  ['median', 'Mediana'],
  ['upper_quartile', 'Cuartil superior'],
];

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cellText = (value: unknown) => String(value ?? '').trim();

const rowText = (row: unknown[]) => row.map(cellText).filter(Boolean).join(' ');

const firstMeaningfulCell = (row: unknown[]) => row.find((cell) => normalizeText(cell).length > 0);

const parsePercent = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value !== 0 && Math.abs(value) <= 1 ? value * 100 : value;
  }

  const text = cellText(value);
  if (!text) return null;

  const normalized = text.replace('%', '').replace(/\s/g, '').replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;

  return number !== 0 && Math.abs(number) <= 1 && text.includes('%') ? number * 100 : number;
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/D';
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const averageValues = (values: Array<number | null | undefined>) => {
  const validValues = values.filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value));
  if (validValues.length !== values.length || validValues.length === 0) return null;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
};

const detectBlockTitle = (row: unknown[]) => {
  for (const cell of row) {
    const text = cellText(cell);
    const match = text.match(/\b([A-Za-z][A-Za-z0-9]{1,11})\b\s*(?:-|–)?\s*(20(?:21|22|23|24|25))\b/i);
    if (!match) continue;

    const method = match[1]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    const exerciseYear = Number(match[2]);

    if (YEAR_SET.has(exerciseYear)) {
      return { method, exerciseYear };
    }
  }

  return null;
};

const detectHeader = (row: unknown[]) => {
  const yearColumns: Record<number, number> = {};
  const yearOrder: number[] = [];
  let averageColumn: number | null = null;

  row.forEach((cell, index) => {
    const text = normalizeText(cell);
    const year = Number(text.match(/20(19|20|21|22|23|24|25)/)?.[0]);
    if (TABLE_YEAR_SET.has(year)) {
      yearColumns[year] = index;
      yearOrder.push(year);
    }
    if (text.includes('promedio')) averageColumn = index;
  });

  return {
    yearColumns,
    yearOrder,
    averageColumn,
    hasYears: Object.keys(yearColumns).length >= 2,
  };
};

const detectMetric = (value: unknown): MetricKey | null => {
  const text = normalizeText(value);
  if (text.includes('cuartil inferior') || text.includes('lower quartile')) return 'lower_quartile';
  if (text.includes('mediana') || text.includes('median')) return 'median';
  if (text.includes('cuartil superior') || text.includes('upper quartile')) return 'upper_quartile';
  return null;
};

const getWindowYears = (exerciseYear: number) => [exerciseYear, exerciseYear - 1, exerciseYear - 2];

const buildCompanyName = (label: string, method: string) => {
  const cleaned = label.replace(new RegExp(`^${method}\\s+de\\s+`, 'i'), '').trim();
  return cleaned || label || 'Parte analizada';
};

const buildTechnicalTable = (
  exerciseYear: number,
  comparable: Record<MetricKey, YearValueMap>,
  comparableAverage: Record<MetricKey, number | null>,
  companyLabel: string,
  companyValues: YearValueMap,
  companyAverage: number | null,
  detectedYears?: number[],
): TechnicalTablePayload => {
  const years = detectedYears && detectedYears.length > 0 ? detectedYears : getWindowYears(exerciseYear);
  const computedAverage = companyAverage ?? averageValues(years.map((year) => companyValues[String(year)]));

  return {
    years,
    comparable,
    comparableAverage,
    company: {
      label: companyLabel || 'Parte analizada',
      values: companyValues,
      average: computedAverage,
    },
  };
};

const parseTechnicalBlock = (
  rows: unknown[][],
  startIndex: number,
  taskId: string,
  sourceFileName: string,
  method: string,
  exerciseYear: number,
) => {
  const comparable: Record<MetricKey, YearValueMap> = {
    lower_quartile: {},
    median: {},
    upper_quartile: {},
  };
  const comparableAverage: Record<MetricKey, number | null> = {
    lower_quartile: null,
    median: null,
    upper_quartile: null,
  };
  const companyValues: YearValueMap = {};
  let yearColumns: Record<number, number> = {};
  let blockYears: number[] = [];
  let averageColumn: number | null = null;
  let mode: 'comparable' | 'company' | null = null;
  let companyLabel = '';
  let companyAverage: number | null = null;
  let endIndex = rows.length;

  for (let index = startIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (detectBlockTitle(row)) {
      endIndex = index - 1;
      break;
    }

    const normalizedRow = normalizeText(rowText(row));
    if (!normalizedRow) continue;

    const header = detectHeader(row);
    if (header.hasYears) {
      yearColumns = header.yearColumns;
      blockYears = header.yearOrder;
      averageColumn = header.averageColumn;
      if (normalizedRow.includes('parte analizada') || normalizedRow.includes('tested party')) mode = 'company';
      if (normalizedRow.includes('rango') || normalizedRow.includes('comparables')) mode = 'comparable';
      continue;
    }

    if (normalizedRow.includes('parte analizada') || normalizedRow.includes('tested party')) {
      mode = 'company';
      continue;
    }

    if (mode === 'comparable') {
      const metric = detectMetric(firstMeaningfulCell(row));
      if (!metric) continue;

      Object.entries(yearColumns).forEach(([year, columnIndex]) => {
        comparable[metric][year] = parsePercent(row[columnIndex]);
      });
      comparableAverage[metric] = averageColumn === null ? null : parsePercent(row[averageColumn]);
      continue;
    }

    if (mode === 'company') {
      const label = cellText(firstMeaningfulCell(row));
      if (!label) continue;

      const hasCompanyValues = Object.values(yearColumns).some((columnIndex) => parsePercent(row[columnIndex]) !== null);
      if (!hasCompanyValues) continue;

      companyLabel = label;
      Object.entries(yearColumns).forEach(([year, columnIndex]) => {
        companyValues[year] = parsePercent(row[columnIndex]);
      });
      companyAverage = averageColumn === null ? null : parsePercent(row[averageColumn]);
      endIndex = index;
      break;
    }
  }

  const windowYears = blockYears.length > 0 ? blockYears : getWindowYears(exerciseYear);
  const hasComparableData = METRIC_LABELS.some(([metric]) =>
    windowYears.some((year) => comparable[metric][String(year)] !== null && comparable[metric][String(year)] !== undefined),
  );
  const hasCompanyData = windowYears.some((year) => companyValues[String(year)] !== null && companyValues[String(year)] !== undefined);

  if (!hasComparableData && !hasCompanyData) {
    return { result: null, endIndex };
  }

  const technicalTable = buildTechnicalTable(exerciseYear, comparable, comparableAverage, companyLabel, companyValues, companyAverage, blockYears);
  const insertRow: HistoricalResultInsert = {
    task_id: taskId,
    method,
    year: exerciseYear,
    exercise_year: exerciseYear,
    method_name: method,
    company_name: buildCompanyName(companyLabel, method),
    lower_quartile: comparable.lower_quartile[String(exerciseYear)] ?? null,
    median: comparable.median[String(exerciseYear)] ?? null,
    upper_quartile: comparable.upper_quartile[String(exerciseYear)] ?? null,
    company_result: companyValues[String(exerciseYear)] ?? null,
    three_year_average: technicalTable.company.average,
    company_2025: companyValues['2025'] ?? null,
    company_2024: companyValues['2024'] ?? null,
    company_2023: companyValues['2023'] ?? null,
    average_value: technicalTable.company.average,
    comparable_2025: comparable.median['2025'] ?? null,
    comparable_2024: comparable.median['2024'] ?? null,
    comparable_2023: comparable.median['2023'] ?? null,
    technical_table: technicalTable as unknown as Json,
    source_file_name: sourceFileName,
  };

  return { result: insertRow, endIndex };
};

const parseWorkbookRows = (rows: unknown[][], taskId: string, sourceFileName: string) => {
  const results: HistoricalResultInsert[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const title = detectBlockTitle(rows[index]);
    if (!title) continue;

    const parsedBlock = parseTechnicalBlock(rows, index, taskId, sourceFileName, title.method, title.exerciseYear);
    if (parsedBlock.result) results.push(parsedBlock.result);
    index = Math.max(index, parsedBlock.endIndex);
  }

  return results;
};

const parseExcelFile = async (file: File, taskId: string) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const results: HistoricalResultInsert[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: true,
      defval: '',
      blankrows: false,
    });
    results.push(...parseWorkbookRows(rows, taskId, file.name));
  });

  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.exercise_year ?? result.year}:${result.method_name ?? result.method}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const isYearValueMap = (value: unknown): value is YearValueMap =>
  isRecord(value) && Object.values(value).every((item) => item === null || typeof item === 'number');

const isTechnicalPayload = (value: unknown): value is TechnicalTablePayload => {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.years) || !value.years.every((year) => typeof year === 'number')) return false;
  if (!isRecord(value.comparable) || !isRecord(value.comparableAverage) || !isRecord(value.company)) return false;

  const comparable = value.comparable;
  return METRIC_LABELS.every(([metric]) => isYearValueMap(comparable[metric]));
};

const getMethod = (result: HistoricalResultLike) => result.method_name || result.method || 'Metodo';

const getExerciseYear = (result: HistoricalResultLike) => result.exercise_year || result.year || 2025;

const getTechnicalTable = (result: HistoricalResultLike): TechnicalTablePayload => {
  if ('technical_table' in result && isTechnicalPayload(result.technical_table)) return result.technical_table;

  const exerciseYear = getExerciseYear(result);
  const yearKey = String(exerciseYear);
  const comparable: Record<MetricKey, YearValueMap> = {
    lower_quartile: { [yearKey]: result.lower_quartile ?? null },
    median: { [yearKey]: result.median ?? null },
    upper_quartile: { [yearKey]: result.upper_quartile ?? null },
  };

  return buildTechnicalTable(
    exerciseYear,
    comparable,
    {
      lower_quartile: null,
      median: null,
      upper_quartile: null,
    },
    `${getMethod(result)} de ${result.company_name || 'Parte analizada'}`,
    { [yearKey]: result.company_result ?? null },
    result.average_value ?? result.three_year_average ?? null,
  );
};

const groupByExercise = (results: HistoricalResultLike[]) =>
  YEARS.reduce<Record<number, HistoricalResultLike[]>>((accumulator, year) => {
    accumulator[year] = results
      .filter((result) => getExerciseYear(result) === year)
      .sort((left, right) => getMethod(left).localeCompare(getMethod(right)));
    return accumulator;
  }, {});

const buildExportRows = (results: HistoricalResultRow[]) => {
  const rows: unknown[][] = [];

  results.forEach((result) => {
    const method = getMethod(result);
    const exerciseYear = getExerciseYear(result);
    const technicalTable = getTechnicalTable(result);

    rows.push([`${method} ${exerciseYear}`]);
    rows.push([]);
    rows.push(['Rango de empresas comparables', ...technicalTable.years, 'Promedio']);
    METRIC_LABELS.forEach(([metric, label]) => {
      rows.push([
        label,
        ...technicalTable.years.map((year) => technicalTable.comparable[metric][String(year)] ?? ''),
        technicalTable.comparableAverage[metric] ?? '',
      ]);
    });
    rows.push([]);
    rows.push(['Parte analizada', ...technicalTable.years, 'Promedio']);
    rows.push([
      technicalTable.company.label,
      ...technicalTable.years.map((year) => technicalTable.company.values[String(year)] ?? ''),
      technicalTable.company.average ?? '',
    ]);
    rows.push([]);
  });

  return rows;
};

const TechnicalResultTable = ({ result }: { result: HistoricalResultLike }) => {
  const method = getMethod(result);
  const exerciseYear = getExerciseYear(result);
  const technicalTable = getTechnicalTable(result);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#071028]">
      <div className="border-b border-white/10 bg-[#0b1735] px-4 py-3">
        <h5 className="text-sm font-bold uppercase tracking-wide text-white">
          {method} {exerciseYear}
        </h5>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#0d1b3d] text-[11px] uppercase tracking-wide text-slate-200">
              <th className="border border-white/10 px-4 py-3 font-bold">Rango de empresas comparables</th>
              {technicalTable.years.map((year) => (
                <th key={year} className="border border-white/10 px-4 py-3 text-right font-bold">
                  {year}
                </th>
              ))}
              <th className="border border-white/10 px-4 py-3 text-right font-bold">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {METRIC_LABELS.map(([metric, label]) => (
              <tr key={metric} className="bg-[#08132d] text-slate-200">
                <td className="border border-white/10 px-4 py-3 font-medium">{label}</td>
                {technicalTable.years.map((year) => (
                  <td key={year} className="border border-white/10 px-4 py-3 text-right tabular-nums">
                    {formatNumber(technicalTable.comparable[metric][String(year)])}
                  </td>
                ))}
                <td className="border border-white/10 px-4 py-3 text-right font-semibold tabular-nums">
                  {formatNumber(technicalTable.comparableAverage[metric])}
                </td>
              </tr>
            ))}
            <tr className="bg-[#0d1b3d] text-[11px] uppercase tracking-wide text-slate-200">
              <th className="border border-white/10 px-4 py-3 font-bold">Parte analizada</th>
              {technicalTable.years.map((year) => (
                <th key={year} className="border border-white/10 px-4 py-3 text-right font-bold">
                  {year}
                </th>
              ))}
              <th className="border border-white/10 px-4 py-3 text-right font-bold">Promedio</th>
            </tr>
            <tr className="bg-[#08132d] text-white">
              <td className="border border-white/10 px-4 py-3 font-semibold">{technicalTable.company.label}</td>
              {technicalTable.years.map((year) => (
                <td key={year} className="border border-white/10 px-4 py-3 text-right font-semibold tabular-nums">
                  {formatNumber(technicalTable.company.values[String(year)])}
                </td>
              ))}
              <td className="border border-white/10 px-4 py-3 text-right font-bold tabular-nums">
                {formatNumber(technicalTable.company.average)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const HistoricalResultsSection = ({ task }: HistoricalResultsSectionProps) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [results, setResults] = React.useState<HistoricalResultRow[]>([]);
  const [previewResults, setPreviewResults] = React.useState<HistoricalResultInsert[]>([]);
  const [sourceFileName, setSourceFileName] = React.useState('');
  const [expandedYears, setExpandedYears] = React.useState<number[]>([2025]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showDetailTable, setShowDetailTable] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadResults = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await getSupabaseClient()
        .from('historical_results')
        .select('*')
        .eq('task_id', task.id)
        .order('year', { ascending: false })
        .order('method', { ascending: true });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo cargar el historial de resultados.');
      console.error('[Supabase] No se pudo cargar el historial de resultados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [task.id]);

  React.useEffect(() => {
    queueMicrotask(() => {
      setResults([]);
      setPreviewResults([]);
      setSourceFileName('');
      setShowDetailTable(false);
      setExpandedYears([2025]);
      void loadResults();
    });
  }, [loadResults, task.id]);

  React.useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`historical-results-${task.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'historical_results',
          filter: `task_id=eq.${task.id}`,
        },
        () => {
          void loadResults();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadResults, task.id]);

  const resultsByYear = React.useMemo(() => groupByExercise(results), [results]);
  const previewByYear = React.useMemo(() => groupByExercise(previewResults), [previewResults]);

  const toggleYear = (year: number) => {
    setExpandedYears((current) => (current.includes(year) ? current.filter((item) => item !== year) : [...current, year]));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsParsing(true);
      setError(null);
      const parsedResults = await parseExcelFile(file, task.id);
      if (parsedResults.length === 0) {
        setPreviewResults([]);
        setSourceFileName('');
        setError('No se detectaron resultados historicos en el archivo.');
        return;
      }

      setPreviewResults(parsedResults);
      setSourceFileName(file.name);
      setExpandedYears([...new Set(parsedResults.map((result) => getExerciseYear(result)))]);
    } catch (error) {
      setPreviewResults([]);
      setSourceFileName('');
      setError(error instanceof Error ? error.message : 'No se pudo leer el archivo Excel.');
      console.error('[Excel] No se pudo leer el historial de resultados:', error);
    } finally {
      setIsParsing(false);
    }
  };

  const savePreview = async () => {
    if (previewResults.length === 0) return;
    const shouldReplace = window.confirm('Se reemplazara el historial anterior de esta tarea matriz. Deseas continuar?');
    if (!shouldReplace) return;

    try {
      setIsSaving(true);
      setError(null);
      const supabase = getSupabaseClient();
      const deleteResult = await supabase.from('historical_results').delete().eq('task_id', task.id);
      if (deleteResult.error) throw deleteResult.error;

      const insertResult = await supabase.from('historical_results').insert(previewResults);
      if (insertResult.error) throw insertResult.error;

      setPreviewResults([]);
      setSourceFileName('');
      await loadResults();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar el historial de resultados.');
      console.error('[Supabase] No se pudo guardar el historial de resultados:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;
    const worksheet = XLSX.utils.aoa_to_sheet(buildExportRows(results));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
    XLSX.writeFile(workbook, `${task.title.replace(/[\\/:*?"<>|]/g, '-')}-historial-resultados.xlsx`);
  };

  const displayedResults = previewResults.length > 0 ? previewResults : results;
  const displayedByYear = previewResults.length > 0 ? previewByYear : resultsByYear;

  return (
    <section className="historical-results-section mt-5 overflow-hidden rounded-2xl border border-[#1e253c] bg-[#071028]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={(event) => {
          void handleFileChange(event);
        }}
        className="hidden"
      />

      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0b1735] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Historial de resultados</h3>
          <p className="mt-1 text-xs text-slate-400">Cuadros tecnicos por ejercicio fiscal y metodo de rentabilidad.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadResults();
            }}
            className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:bg-[#506ff0]/15 hover:text-white"
          >
            <RefreshCw size={14} className={clsx(isLoading && 'animate-spin')} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={exportResults}
            disabled={results.length === 0}
            className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:bg-[#506ff0]/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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

        {previewResults.length > 0 && (
          <div className="mb-4 rounded-xl border border-[#506ff0]/40 bg-[#506ff0]/10 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileSpreadsheet size={16} className="text-[#9fb0ff]" />
                  Preview de importacion
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {sourceFileName} - {previewResults.length} cuadros detectados. Revisa el preview antes de reemplazar.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewResults([]);
                    setSourceFileName('');
                  }}
                  disabled={isSaving}
                  className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void savePreview();
                  }}
                  disabled={isSaving}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#10b981] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#34d399] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={14} />
                  {isSaving ? 'Guardando...' : 'Reemplazar y guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {displayedResults.length > 0 ? (
          <div className="space-y-3">
            {YEARS.map((year) => {
              const yearResults = displayedByYear[year] || [];
              const isExpanded = expandedYears.includes(year);

              return (
                <article key={year} className="overflow-hidden rounded-xl border border-white/10 bg-[#08132d]">
                  <button
                    type="button"
                    onClick={() => toggleYear(year)}
                    className="flex w-full items-center justify-between gap-4 bg-[#0b1735] px-4 py-3 text-left transition-colors hover:bg-[#0d1b3d]"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown size={16} className={clsx('text-[#9fb0ff] transition-transform', isExpanded && 'rotate-180')} />
                      <span className="text-base font-bold text-white">{year}</span>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
                      {yearResults.length} metodos
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="space-y-4 p-4">
                      {yearResults.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-slate-500">Sin datos para este ejercicio.</p>
                      ) : (
                        yearResults.map((result, index) => (
                          <TechnicalResultTable
                            key={`${getMethod(result)}-${getExerciseYear(result)}-${'id' in result ? result.id : index}`}
                            result={result}
                          />
                        ))
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#08132d] px-4 py-8 text-center">
            <FileSpreadsheet size={26} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-white">Aun no hay historial de resultados</p>
            <p className="mt-1 text-xs text-slate-500">Importa un unico Excel con bloques ROS, CAN, ROA, PCNC u otros metodos.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDetailTable((current) => !current)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-[#9fb0ff] hover:bg-white/5"
            >
              <ChevronDown size={14} className={clsx('transition-transform', showDetailTable && 'rotate-180')} />
              Ver tabla detallada
            </button>

            {showDetailTable && (
              <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[860px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#0b1735]">
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3">Ejercicio</th>
                      <th className="px-4 py-3">Metodo</th>
                      <th className="px-4 py-3">Parte analizada</th>
                      <th className="px-4 py-3 text-right">Cuartil inferior</th>
                      <th className="px-4 py-3 text-right">Mediana</th>
                      <th className="px-4 py-3 text-right">Cuartil superior</th>
                      <th className="px-4 py-3 text-right">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} className="border-b border-white/10 last:border-0 hover:bg-white/5">
                        <td className="px-4 py-3 text-xs font-semibold text-white">{getExerciseYear(result)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-white">{getMethod(result)}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{result.company_name || getTechnicalTable(result).company.label}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">{formatNumber(result.lower_quartile)}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">{formatNumber(result.median)}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">{formatNumber(result.upper_quartile)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-white">{formatNumber(result.average_value ?? result.three_year_average)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
