"use client";

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MIN_DATE = '2026-01-01';
const MAX_DATE = '2026-12-31';

type DatePicker2026Props = {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  error?: string | null;
};

const clampTo2026 = (value: string) => {
  if (value < MIN_DATE) return MIN_DATE;
  if (value > MAX_DATE) return MAX_DATE;
  return value;
};

const getDateParts = (value: string) => {
  const [year, month, day] = clampTo2026(value).split('-').map(Number);
  return { year, month: month - 1, day };
};

const toIsoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const formatPickerDate = (value: string) => {
  const { year, month, day } = getDateParts(value);
  return `${String(day).padStart(2, '0')} ${MONTHS[month]} ${year}`;
};

export const DatePicker2026 = ({ value, onChange, label = 'Día asignado', error }: DatePicker2026Props) => {
  const safeValue = clampTo2026(value);
  const selected = getDateParts(safeValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState(selected.month);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  const firstDay = new Date(2026, visibleMonth, 1);
  const daysInMonth = new Date(2026, visibleMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectDate = (day: number) => {
    const nextDate = toIsoDate(2026, visibleMonth, day);
    onChange(nextDate);
    setIsOpen(false);
  };

  return (
    <div ref={pickerRef} className="relative">
      {label && <label className="block text-xs font-medium text-ink-soft mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => {
          setVisibleMonth(selected.month);
          setIsOpen((current) => !current);
        }}
        className="w-full bg-surface-sunken border border-line text-ink rounded-lg px-4 py-3 sm:py-2 outline-none focus:border-accent transition-colors flex items-center justify-between gap-3"
      >
        <span className="text-sm font-medium">{formatPickerDate(safeValue)}</span>
        <Calendar size={16} className="text-ink-soft" />
      </button>
      {error && <p className="mt-1 text-xs text-critical-ink">{error}</p>}

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-line bg-surface p-3 shadow-2xl sm:min-w-[300px]">
          <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
            <button
              type="button"
              onClick={() => setVisibleMonth((month) => Math.max(0, month - 1))}
              disabled={visibleMonth === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-ink">{MONTHS[visibleMonth]} 2026</p>
              <p className="text-[10px] uppercase tracking-wide text-ink-faint">01/01/2026 - 31/12/2026</p>
            </div>
            <button
              type="button"
              onClick={() => setVisibleMonth((month) => Math.min(11, month + 1))}
              disabled={visibleMonth === 11}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-faint">
            {WEEK_DAYS.map((day, index) => (
              <span key={`${day}-${index}`} className="py-1">{day}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {monthDays.map((day) => {
              const isoDate = toIsoDate(2026, visibleMonth, day);
              const isSelected = isoDate === safeValue;

              return (
                <button
                  type="button"
                  key={isoDate}
                  onClick={() => selectDate(day)}
                  className={clsx(
                    "h-9 rounded-lg text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-brand text-white shadow-card"
                      : "text-ink-soft hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
