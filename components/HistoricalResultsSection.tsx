"use client";

import React from 'react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { AlertCircle, BarChart3, Check, ChevronDown, Download, FileSpreadsheet, RefreshCw, Upload, X } from 'lucide-react';
import { Task } from '../data/mockData';
import { Database, getSupabaseClient } from '../lib/supabase';

type HistoricalResultRow = Database['public']['Tables']['historical_results']['Row'];
type HistoricalResultInsert = Database['public']['Tables']['historical_results']['Insert'];

type HistoricalResultsSectionProps = {
  task: Task;
};

type MetricKey = 'lower_quartile' | 'median' | 'upper_quartile' | 'company_result';

type ParsedMethodData = {
  method: string;
  values: Record<number, Partial<Record<MetricKey, number>>>;
};

const YEARS = [2025, 2024, 2023, 2022, 2021];
const YEAR_SET = new Set(YEARS);

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parsePercent = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = String(value ?? '').trim();
  if (!text) return null;

  const normalized = text.replace('%', '').replace(/\s/g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/D';
  return `${new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
};

const detectMetric = (value: unknown): MetricKey | null => {
  const text = normalizeText(value);
  if (!text) return null;
  if (text.includes('cuartil inferior') || text.includes('quartile lower') || text.includes('lower quartile')) return 'lower_quartile';
  if (text.includes('mediana') || text.includes('median')) return 'median';
  if (text.includes('cuartil superior') || text.includes('quartile upper') || text.includes('upper quartile')) return 'upper_quartile';
  if (text.includes('empresa') || text.includes('analizada') || text.includes('analizado')) return 'company_result';
  return null;
};

const extractMethod = (value: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const withoutPrefix = raw.replace(/empresa\s+analizada/gi, '').trim();
  const methodMatch = withoutPrefix.match(/^([A-ZÁÉÍÓÚÑ0-9]{2,12})\b/i);
  if (!methodMatch) return null;

  const method = methodMatch[1]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  return method.length >= 2 ? method : null;
};

const findYearColumns = (row: unknown[]) =>
  row.reduce<Record<number, number>>((accumulator, cell, index) => {
    const year = Number(String(cell ?? '').match(/20(21|22|23|24|25)/)?.[0]);
    if (YEAR_SET.has(year)) accumulator[year] = index;
    return accumulator;
  }, {});

const buildAverage = (methodData: ParsedMethodData, year: number) => {
  const values = [year, year - 1, year - 2]
    .map((itemYear) => methodData.values[itemYear]?.company_result)
    .filter((value): value is number => value !== null && value !== undefined && Number.isFinite(value));

  return values.length === 3 ? values.reduce((sum, value) => sum + value, 0) / 3 : null;
};

const parseWorkbookRows = (rows: unknown[][], taskId: string, sourceFileName: string) => {
  let yearColumns: Record<number, number> = {};
  const methods = new Map<string, ParsedMethodData>();
  let activeMethod: string | null = null;

  rows.forEach((row) => {
    const detectedYearColumns = findYearColumns(row);
    if (Object.keys(detectedYearColumns).length >= 2) {
      yearColumns = detectedYearColumns;
      return;
    }

    const firstMeaningfulCell = row.find((cell) => normalizeText(cell).length > 0);
    const methodFromRow = extractMethod(firstMeaningfulCell);
    const metric = detectMetric(firstMeaningfulCell);

    if (methodFromRow) {
      activeMethod = methodFromRow;
      if (!methods.has(activeMethod)) {
        methods.set(activeMethod, { method: activeMethod, values: {} });
      }
    }

    if (!activeMethod || !metric || Object.keys(yearColumns).length === 0) return;

    const methodData = methods.get(activeMethod);
    if (!methodData) return;

    Object.entries(yearColumns).forEach(([yearValue, columnIndex]) => {
      const year = Number(yearValue);
      const parsedValue = parsePercent(row[columnIndex]);
      if (parsedValue === null) return;
      methodData.values[year] = methodData.values[year] || {};
      methodData.values[year][metric] = parsedValue;
    });
  });

  const rowsToInsert: HistoricalResultInsert[] = [];
  methods.forEach((methodData) => {
    YEARS.forEach((year) => {
      const yearValues = methodData.values[year];
      if (!yearValues) return;

      const hasData = ['lower_quartile', 'median', 'upper_quartile', 'company_result'].some((key) => {
        const value = yearValues[key as MetricKey];
        return value !== null && value !== undefined && Number.isFinite(value);
      });

      if (!hasData) return;

      rowsToInsert.push({
        task_id: taskId,
        method: methodData.method,
        year,
        lower_quartile: yearValues.lower_quartile ?? null,
        median: yearValues.median ?? null,
        upper_quartile: yearValues.upper_quartile ?? null,
        company_result: yearValues.company_result ?? null,
        three_year_average: buildAverage(methodData, year),
        source_file_name: sourceFileName,
      });
    });
  });

  return rowsToInsert.sort((left, right) => right.year - left.year || left.method.localeCompare(right.method));
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
    });
    results.push(...parseWorkbookRows(rows, taskId, file.name));
  });

  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.method}:${result.year}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getMethods = (results: Array<Pick<HistoricalResultRow, 'method'>>) =>
  [...new Set(results.map((result) => result.method))].sort((left, right) => left.localeCompare(right));

const groupByYear = (results: HistoricalResultRow[]) =>
  YEARS.reduce<Record<number, HistoricalResultRow[]>>((accumulator, year) => {
    accumulator[year] = results.filter((result) => result.year === year);
    return accumulator;
  }, {});

const buildExportRows = (results: HistoricalResultRow[]) =>
  results.map((result) => ({
    Metodo: result.method,
    Ano: result.year,
    'Cuartil inferior': result.lower_quartile ?? '',
    Mediana: result.median ?? '',
    'Cuartil superior': result.upper_quartile ?? '',
    'Resultado empresa': result.company_result ?? '',
    'Promedio 3 anos': result.three_year_average ?? '',
    Archivo: result.source_file_name || '',
  }));

export const HistoricalResultsSection = ({ task }: HistoricalResultsSectionProps) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [results, setResults] = React.useState<HistoricalResultRow[]>([]);
  const [previewResults, setPreviewResults] = React.useState<HistoricalResultInsert[]>([]);
  const [selectedMethods, setSelectedMethods] = React.useState<string[]>([]);
  const [sourceFileName, setSourceFileName] = React.useState('');
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
      void loadResults();
    });
  }, [loadResults, task.id]);

  React.useEffect(() => {
    queueMicrotask(() => {
      const methods = getMethods(results);
      setSelectedMethods((current) => {
        const next = current.filter((method) => methods.includes(method));
        return next.length > 0 ? next : methods;
      });
    });
  }, [results]);

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

  const methods = React.useMemo(() => getMethods(results), [results]);
  const previewMethods = React.useMemo(() => getMethods(previewResults), [previewResults]);
  const filteredResults = React.useMemo(
    () => results.filter((result) => selectedMethods.includes(result.method)),
    [results, selectedMethods],
  );
  const resultsByYear = React.useMemo(() => groupByYear(filteredResults), [filteredResults]);

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
    const shouldReplace = window.confirm('Se reemplazara el historial anterior de esta tarea matriz. ¿Deseas continuar?');
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

  const toggleMethod = (method: string) => {
    setSelectedMethods((current) =>
      current.includes(method) ? current.filter((item) => item !== method) : [...current, method],
    );
  };

  const exportResults = () => {
    if (results.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(results));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
    XLSX.writeFile(workbook, `${task.title.replace(/[\\/:*?"<>|]/g, '-')}-historial-resultados.xlsx`);
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

      <div className="flex flex-col gap-4 border-b border-[#1e253c] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">Historial de resultados</h3>
          <p className="mt-1 text-xs text-slate-400">Resultados historicos por metodo y año, vinculados a esta tarea matriz.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadResults();
            }}
            className="flex h-10 items-center gap-2 rounded-lg border border-[#2a334e] bg-[#1e253c]/60 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-[#506ff0]/60 hover:bg-[#506ff0]/15 hover:text-white"
          >
            <RefreshCw size={14} className={clsx(isLoading && 'animate-spin')} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={exportResults}
            disabled={results.length === 0}
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

        {previewResults.length > 0 && (
          <div className="mb-4 rounded-xl border border-[#506ff0]/40 bg-[#506ff0]/10 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileSpreadsheet size={16} className="text-[#9fb0ff]" />
                  Preview de importacion
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {sourceFileName} - {previewResults.length} registros detectados en {previewMethods.join(', ')}.
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
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#2a334e] bg-[#1e253c]/60 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-[#1e253c]"
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

        {methods.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#1e253c] bg-[#121827]/60 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <BarChart3 size={15} className="text-[#8b5cf6]" />
              Metodos visibles
            </div>
            <div className="flex flex-wrap gap-2">
              {methods.map((method) => {
                const isSelected = selectedMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleMethod(method)}
                    className={clsx(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
                      isSelected
                        ? 'border-[#8b5cf6]/50 bg-[#8b5cf6]/15 text-[#c4b5fd]'
                        : 'border-[#2a334e] bg-[#0e121e]/45 text-slate-400 hover:border-[#506ff0]/50 hover:text-white',
                    )}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-5">
            {YEARS.map((year) => {
              const yearResults = resultsByYear[year] || [];
              return (
                <article key={year} className="rounded-2xl border border-[#1e253c] bg-[#121827]/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">{year}</h4>
                    <span className="rounded-full bg-[#1e253c] px-2 py-1 text-[10px] font-semibold text-slate-400">
                      {yearResults.length} metodos
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {yearResults.length === 0 && (
                      <p className="rounded-xl border border-dashed border-[#2a334e] px-3 py-6 text-center text-xs text-slate-500">Sin datos</p>
                    )}
                    {yearResults.map((result) => (
                      <div key={`${result.method}-${result.year}`} className="rounded-xl border border-[#1e253c] bg-[#0e121e]/45 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#c4b5fd]">{result.method}</p>
                        <div className="mt-3 grid gap-2 text-xs">
                          {[
                            ['Cuartil inferior', result.lower_quartile],
                            ['Mediana', result.median],
                            ['Cuartil superior', result.upper_quartile],
                            [`Resultado ${year}`, result.company_result],
                            ['Promedio 3 anos', result.three_year_average],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="flex items-center justify-between gap-3">
                              <span className="text-slate-500">{label}</span>
                              <span className="font-bold text-white">{formatPercent(value as number | null)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#2a334e] bg-[#121827]/40 px-4 py-8 text-center">
            <FileSpreadsheet size={26} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-white">Aun no hay historial de resultados</p>
            <p className="mt-1 text-xs text-slate-500">Importa un Excel con años 2025 a 2021 para alimentar esta seccion.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDetailTable((current) => !current)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-[#8b5cf6] hover:bg-[#1e253c]"
            >
              <ChevronDown size={14} className={clsx('transition-transform', showDetailTable && 'rotate-180')} />
              Ver tabla detallada
            </button>

            {showDetailTable && (
              <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-[#1e253c] scrollbar-hide">
                <table className="w-full min-w-[920px] border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#121827]">
                    <tr className="border-b border-[#1e253c] text-[10px] uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Metodo</th>
                      <th className="px-4 py-3">Año</th>
                      <th className="px-4 py-3 text-right">Cuartil inferior</th>
                      <th className="px-4 py-3 text-right">Mediana</th>
                      <th className="px-4 py-3 text-right">Cuartil superior</th>
                      <th className="px-4 py-3 text-right">Resultado</th>
                      <th className="px-4 py-3 text-right">Promedio 3 años</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.id} className="border-b border-[#1e253c]/70 last:border-0 hover:bg-[#1e253c]/40">
                        <td className="px-4 py-3 text-xs font-bold text-white">{result.method}</td>
                        <td className="px-4 py-3 text-xs text-slate-300">{result.year}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">{formatPercent(result.lower_quartile)}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">{formatPercent(result.median)}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">{formatPercent(result.upper_quartile)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-white">{formatPercent(result.company_result)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-white">{formatPercent(result.three_year_average)}</td>
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
