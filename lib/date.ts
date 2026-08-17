export type CalendarDay = {
  dateKey: string;
  day: number;
  month: string;
  isCurrentMonth: boolean;
};

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateKey = (dateKey: string): Date | null => {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
};

export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateKey = (): string => toDateKey(new Date());

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (month: Date, amount: number): Date =>
  new Date(month.getFullYear(), month.getMonth() + amount, 1);

export const getDateKeyInMonth = (month: Date, preferredDay: number): string => {
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return toDateKey(new Date(month.getFullYear(), month.getMonth(), Math.min(preferredDay, lastDay)));
};

export const formatMonthLabel = (month: Date): string =>
  new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(month);

export const getCalendarDays = (displayedMonth: Date): CalendarDay[] => {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      dateKey: toDateKey(date),
      day: date.getDate(),
      month: new Intl.DateTimeFormat('es-PE', { month: 'short' }).format(date).replace('.', '').toUpperCase(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
};

export const isBeforeDateKey = (dateKey: string, referenceDateKey: string): boolean =>
  Boolean(parseDateKey(dateKey) && parseDateKey(referenceDateKey) && dateKey < referenceDateKey);
