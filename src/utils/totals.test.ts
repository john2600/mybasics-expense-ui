import { describe, expect, it } from 'vitest';
import { summarizeMovements } from './totals';
import type { Movement } from '../types';

/** Movimiento mínimo: los totales solo miran `type` y `amount`. */
function movement(type: 'E' | 'I', amount: number): Movement {
  return {
    id: Math.random(),
    category_id: 1,
    category: 'Alimentacion',
    type,
    amount,
    description: 'test',
    date: '2026-08-10T00:00:00Z',
    hour: null,
    transaction_type: null,
    mail_uid: null,
    mail_message_id: null,
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-08-10T00:00:00Z',
  };
}

describe('summarizeMovements', () => {
  it('devuelve ceros sin movimientos', () => {
    expect(summarizeMovements([])).toEqual({ expenses: 0, incomes: 0, net: 0, count: 0 });
  });

  it('devuelve ceros mientras la query no ha resuelto', () => {
    expect(summarizeMovements(undefined)).toEqual({ expenses: 0, incomes: 0, net: 0, count: 0 });
  });

  it('suma los gastos y deja los ingresos en cero', () => {
    const totals = summarizeMovements([movement('E', 42500), movement('E', 7500)]);

    expect(totals.expenses).toBe(50000);
    expect(totals.incomes).toBe(0);
    expect(totals.count).toBe(2);
  });

  it('separa gastos de ingresos en una lista mixta', () => {
    const totals = summarizeMovements([
      movement('E', 42500),
      movement('I', 500000),
      movement('E', 7500),
    ]);

    expect(totals.expenses).toBe(50000);
    expect(totals.incomes).toBe(500000);
    expect(totals.count).toBe(3);
  });

  it('calcula el neto como ingresos menos gastos', () => {
    const totals = summarizeMovements([movement('I', 500000), movement('E', 50000)]);

    expect(totals.net).toBe(450000);
  });

  it('da un neto negativo cuando se gastó más de lo que entró', () => {
    const totals = summarizeMovements([movement('I', 10000), movement('E', 50000)]);

    expect(totals.net).toBe(-40000);
  });

  it('cuenta todos los movimientos, no solo los que suman', () => {
    // `count` describe el listado mostrado, así que incluye ambos tipos.
    expect(summarizeMovements([movement('E', 1), movement('I', 1)]).count).toBe(2);
  });
});
