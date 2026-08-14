import type { Movement } from '../types';

export interface MovementTotals {
  /** Suma de los movimientos de tipo `E` del listado. */
  expenses: number;
  /** Suma de los movimientos de tipo `I` del listado. */
  incomes: number;
  /** `incomes − expenses`: negativo cuando se gastó más de lo que entró. */
  net: number;
  /** Cuántos movimientos se sumaron, para poder mostrar "N movimientos". */
  count: number;
}

/**
 * Suma los movimientos por tipo.
 *
 * Se usa para el total de **ingresos**, que el API no expone: `/movements` los
 * devuelve agrupados por categoría, sin un total por tipo. El total de gastos
 * autoritativo es el `total` de `/movements/expenses` — este cálculo local solo
 * lo sustituye cuando ese dato no está disponible.
 */
export function summarizeMovements(movements: Movement[] | undefined): MovementTotals {
  const totals = { expenses: 0, incomes: 0, net: 0, count: 0 };
  if (!movements?.length) return totals;

  for (const m of movements) {
    if (m.type === 'E') totals.expenses += m.amount;
    else if (m.type === 'I') totals.incomes += m.amount;
  }

  totals.count = movements.length;
  totals.net = totals.incomes - totals.expenses;
  return totals;
}
