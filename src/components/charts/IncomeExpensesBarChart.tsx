import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';
import { formatCurrency, formatMonthYear } from '../../utils/formatters';
import type { MonthlySummary, BalanceSummary } from '../../types';

interface Props {
  monthlySummary?: MonthlySummary[];
  currentBalance?: BalanceSummary;
  previousBalance?: BalanceSummary;
  loading?: boolean;
}

export const IncomeExpensesBarChart: React.FC<Props> = memo(({ monthlySummary, currentBalance, loading }) => {
  const chartData = (monthlySummary ?? []).slice(0, 6).reverse().map(ms => {
    const incomeAmt = currentBalance?.income_config?.amount ?? 0;
    return {
      name: formatMonthYear(ms.year, ms.month),
      Gastos: ms.total,
      Ingresos: incomeAmt,
      balance: incomeAmt - ms.total,
    };
  });

  return (
    <Card title="Ingresos vs Gastos" loading={loading}>
      {chartData.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Sin datos mensuales</div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="Ingresos" fill="#10B981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Gastos" fill="#EF4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
});

IncomeExpensesBarChart.displayName = 'IncomeExpensesBarChart';
