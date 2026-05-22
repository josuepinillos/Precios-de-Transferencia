"use client";

import React from 'react';
import { createPortal } from 'react-dom';
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
  const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({});
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  const firstDay = new Date(2026, visibleMonth, 1);
  const daysInMonth = new Date(2026, visibleMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const updatePopoverPosition = React.useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = Math.max(rect.width, viewportWidth < 640 ? Math.min(viewportWidth - 32, 320) : 300);
    const popoverHeight = 372;
    const left = Math.min(Math.max(16, rect.left), Math.max(16, viewportWidth - popoverWidth - 16));
    const spaceBelow = viewportHeight - rect.bottom;
    const top =
      spaceBelow >= popoverHeight + 12
        ? rect.bottom + 8
        : Math.max(16, rect.top - popoverHeight - 8);

    setPopoverStyle({ left, top, width: popoverWidth });
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);
    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen, updatePopoverPosition]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
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

  const calendarPopover = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="fixed z-[100] rounded-2xl border border-[#2a334e] bg-[#0e121e] p-3 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#1e253c] pb-3">
        <button
          type="button"
          onClick={() => setVisibleMonth((month) => Math.max(0, month - 1))}
          disabled={visibleMonth === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e253c] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{MONTHS[visibleMonth]} 2026</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">01/01/2026 - 31/12/2026</p>
        </div>
        <button
          type="button"
          onClick={() => setVisibleMonth((month) => Math.min(11, month + 1))}
          disabled={visibleMonth === 11}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e253c] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
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
                  ? "bg-[#506ff0] text-white shadow-[0_0_14px_rgba(80,111,240,0.35)]"
                  : "text-slate-300 hover:bg-[#1e253c] hover:text-white",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div ref={pickerRef} className="relative">
      {label && <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setVisibleMonth(selected.month);
          setIsOpen((current) => !current);
        }}
        className="w-full bg-[#1e253c] border border-[#2a334e] text-white rounded-lg px-4 py-3 sm:py-2 outline-none focus:border-[#506ff0] transition-colors flex items-center justify-between gap-3"
      >
        <span className="text-sm font-medium">{formatPickerDate(safeValue)}</span>
        <Calendar size={16} className="text-slate-400" />
      </button>
      {error && <p className="mt-1 text-xs text-[#ef4444]">{error}</p>}

      {isOpen ? createPortal(calendarPopover, document.body) : null}
    </div>
  );
};
