import React from 'react';
import { Card } from '../common/Card';
import { formatCurrency, calcPercentageChange } from '../../utils/formatters';
import type { BalanceSummary } from '../../types';

interface MonthlyComparisonProps {
  current?: BalanceSummary;
  previous?: BalanceSummary;
  currentPeriod: { from: string; to: string };
  previousPeriod: { from: string; to: string };
  loading?: boolean;
}

export const MonthlyComparison: React.FC<MonthlyComparisonProps> = ({
  current, previous, currentPeriod, previousPeriod, loading,
}) => {
  const rows = [
    {
      label: 'Gastos',
      current: current?.expenses ?? 0,
      previous: previous?.expenses ?? 0,
      lowerIsBetter: true,
    },
    {
      label: 'Ingresos registrados',
      current: (current?.income_config?.amount ?? 0) + (current?.incomes ?? 0),
      previous: (previous?.income_config?.amount ?? 0) + (previous?.incomes ?? 0),
      lowerIsBetter: false,
    },
    {
      label: 'Balance',
      current: current?.balance ?? 0,
      previous: previous?.balance ?? 0,
      lowerIsBetter: false,
    },
  ];

  return (
    <Card title="Comparación de períodos" loading={loading}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left pb-2 font-semibold">Concepto</th>
              <th className="text-right pb-2 font-semibold">{currentPeriod.from}</th>
              <th className="text-right pb-2 font-semibold">{previousPeriod.from}</th>
              <th className="text-right pb-2 font-semibold">Cambio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(row => {
              const pct = calcPercentageChange(row.current, row.previous);
              const isGood = row.lowerIsBetter ? pct <= 0 : pct >= 0;
              return (
                <tr key={row.label}>
                  <td className="py-2 text-gray-700 font-medium">{row.label}</td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(row.current)}</td>
                  <td className="py-2 text-right text-gray-500">{formatCurrency(row.previous)}</td>
                  <td className={`py-2 text-right font-medium ${isGood ? 'text-green-600' : 'text-red-500'}`}>
                    {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
