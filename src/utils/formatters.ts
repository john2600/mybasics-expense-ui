import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr.substring(0, 10)), 'dd MMM yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr.substring(0, 10)), 'dd/MM', { locale: es });
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMM yyyy', { locale: es });
}

export function calcPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Given a cut_day, compute the current billing period [from, to]
export function getCurrentPeriod(cutDay: number): { from: string; to: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  let from: Date;
  let to: Date;

  if (day >= cutDay) {
    // period started this month on cutDay
    from = new Date(year, month - 1, cutDay);
    // ends day before cutDay next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    to = new Date(nextYear, nextMonth - 1, cutDay - 1);
  } else {
    // period started last month on cutDay
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    from = new Date(prevYear, prevMonth - 1, cutDay);
    to = new Date(year, month - 1, cutDay - 1);
  }

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

export function getPreviousPeriod(cutDay: number): { from: string; to: string } {
  const current = getCurrentPeriod(cutDay);
  const fromDate = parseISO(current.from);
  // previous period: same range shifted back by ~1 month
  const prevFrom = new Date(fromDate);
  prevFrom.setMonth(prevFrom.getMonth() - 1);
  const prevTo = new Date(fromDate);
  prevTo.setDate(prevTo.getDate() - 1);

  return {
    from: format(prevFrom, 'yyyy-MM-dd'),
    to: format(prevTo, 'yyyy-MM-dd'),
  };
}
