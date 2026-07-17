import React, { useState } from 'react';
import { SkeletonCard } from '../common/Loading';
import { formatCurrency, calcPercentageChange } from '../../utils/formatters';
import type { BalanceSummary } from '../../types';

interface SummaryCardsProps {
  current?: BalanceSummary;
  previous?: BalanceSummary;
  loading?: boolean;
  period: { from: string; to: string };
}

interface SummaryCardProps {
  title: string;
  value: number;
  previousValue?: number;
  type: 'income' | 'expense' | 'balance' | 'neutral' | 'carryover';
  loading?: boolean;
  subtitle?: string;
  masked?: boolean;
}

const colorMap = {
  income:    { text: 'text-green-600' },
  expense:   { text: 'text-red-500'   },
  balance:   { text: 'text-blue-600'  },
  neutral:   { text: 'text-gray-700'  },
  carryover: { text: 'text-amber-500' },
};

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, previousValue, type, loading, subtitle, masked }) => {
  const [revealed, setRevealed] = useState(false);
  if (loading) return <SkeletonCard />;

  const { text } = colorMap[type];
  const pct = previousValue !== undefined ? calcPercentageChange(value, previousValue) : undefined;
  const isPositive = pct !== undefined && pct >= 0;
  const hidden = masked && !revealed;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <p className={`text-2xl font-bold ${text} ${hidden ? 'select-none' : ''}`}>
          {hidden ? '••••••••' : formatCurrency(value)}
        </p>
        {masked && (
          <button
            onClick={() => setRevealed(r => !r)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={revealed ? 'Ocultar valor' : 'Mostrar valor'}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      {pct !== undefined && (
        <p className={`text-xs mt-1.5 font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs período anterior
        </p>
      )}
    </div>
  );
};

export const SummaryCards: React.FC<SummaryCardsProps> = ({ current, previous, loading, period }) => {
  const fixedIncome = current?.income_config?.amount ?? 0;
  const totalIncome = fixedIncome + (current?.incomes ?? 0);
  const prevTotalIncome = (previous?.income_config?.amount ?? 0) + (previous?.incomes ?? 0);
  const carryOver = current?.carry_over ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <SummaryCard
        title="Ingresos del período"
        value={totalIncome}
        previousValue={prevTotalIncome}
        type="income"
        loading={loading}
        subtitle={`${period.from} → ${period.to}`}
      />
      <SummaryCard
        title="Gastos del período"
        value={current?.expenses ?? 0}
        previousValue={previous?.expenses}
        type="expense"
        loading={loading}
      />
      <SummaryCard
        title="Balance actual"
        value={current?.balance ?? 0}
        type={!current || current.balance >= 0 ? 'balance' : 'expense'}
        loading={loading}
      />
      <SummaryCard
        title="Ingreso fijo"
        value={fixedIncome}
        type="neutral"
        loading={loading}
        subtitle={current?.income_config?.description}
        masked
      />
      <SummaryCard
        title="Lo que te quedó"
        value={carryOver}
        type={carryOver > 0 ? 'carryover' : 'neutral'}
        loading={loading}
        subtitle="Del período anterior"
      />
    </div>
  );
};
