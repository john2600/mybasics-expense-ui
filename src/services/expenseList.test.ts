import { describe, expect, it } from 'vitest';
import { normalizeExpenseList } from './api';
import type { Movement } from '../types';

function expense(amount: number): Movement {
  return {
    id: Math.random(),
    category_id: 1,
    category: 'Alimentacion',
    type: 'E',
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

describe('normalizeExpenseList', () => {
  describe('contrato nuevo: { total, movements }', () => {
    it('respeta el total que envía el servidor', () => {
      const result = normalizeExpenseList({ total: 50000, movements: [expense(42500), expense(7500)] });

      expect(result.total).toBe(50000);
      expect(result.movements).toHaveLength(2);
    });

    it('no recalcula el total aunque no cuadre con los movimientos recibidos', () => {
      // El total del servidor manda. Recalcularlo en cliente rompería en cuanto
      // el backend contara algo que no viaja en `movements`.
      const result = normalizeExpenseList({ total: 50000, movements: [expense(42500)] });

      expect(result.total).toBe(50000);
      expect(result.movements).toHaveLength(1);
    });

    it('acepta un periodo sin gastos', () => {
      expect(normalizeExpenseList({ total: 0, movements: [] })).toEqual({ total: 0, movements: [] });
    });
  });

  describe('contrato anterior: Movement[] plano', () => {
    it('suma el total en cliente cuando el API todavía no lo envía', () => {
      const result = normalizeExpenseList([expense(42500), expense(7500)]);

      expect(result.total).toBe(50000);
      expect(result.movements).toHaveLength(2);
    });

    it('devuelve total 0 con la lista vacía', () => {
      expect(normalizeExpenseList([])).toEqual({ total: 0, movements: [] });
    });
  });

  describe('respuestas incompletas', () => {
    it('no revienta si falta el cuerpo', () => {
      expect(normalizeExpenseList(null)).toEqual({ total: 0, movements: [] });
      expect(normalizeExpenseList(undefined)).toEqual({ total: 0, movements: [] });
    });

    it('rellena los campos ausentes en vez de propagar undefined', () => {
      // `movements` a undefined rompería el `.map` de quien consume la lista.
      const result = normalizeExpenseList({} as never);

      expect(result).toEqual({ total: 0, movements: [] });
    });
  });
});
