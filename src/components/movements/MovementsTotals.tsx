import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import type { MovementTotals } from '../../utils/totals';

interface Props {
  totals: MovementTotals;
  /** Filtro de tipo activo, para mostrar solo los totales que aplican. */
  typeFilter: 'all' | 'E' | 'I';
}

const Amount: React.FC<{ label: string; value: number; className: string }> = ({
  label,
  value,
  className,
}) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`text-base font-bold ${className}`}>{formatCurrency(value)}</p>
  </div>
);

/** Barra de totales del listado, acotada al filtro aplicado. */
export const MovementsTotals: React.FC<Props> = ({ totals, typeFilter }) => {
  const showExpenses = typeFilter !== 'I';
  const showIncomes = typeFilter !== 'E';
  // El neto solo aporta cuando conviven ingresos y gastos.
  const showNet = typeFilter === 'all' && totals.incomes > 0 && totals.expenses > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mb-3 flex flex-wrap items-center gap-x-8 gap-y-2">
      {showExpenses && <Amount label="Gastos" value={totals.expenses} className="text-red-500" />}
      {showIncomes && <Amount label="Ingresos" value={totals.incomes} className="text-green-500" />}
      {showNet && (
        <Amount
          label="Neto"
          value={totals.net}
          className={totals.net < 0 ? 'text-red-500' : 'text-green-500'}
        />
      )}
      <p className="text-xs text-gray-400 ml-auto">
        {totals.count} {totals.count === 1 ? 'movimiento' : 'movimientos'}
      </p>
    </div>
  );
};
