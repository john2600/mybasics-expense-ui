import React, { useState } from 'react';
import { SkeletonCard } from '../common/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { BalancePeriod } from '../../types';

interface CarryOverCardsProps {
  period?: BalancePeriod;
  previousPeriod?: BalancePeriod;
  loading?: boolean;
}

interface CarryOverCardProps {
  title: string;
  value: number;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  color: string;
  masked?: boolean;
  delta?: { value: number; lowerIsBetter?: boolean };
}

const CarryOverCard: React.FC<CarryOverCardProps> = ({
  title, value, subtitle, badge, badgeColor = 'bg-gray-100 text-gray-600',
  color, masked, delta,
}) => {
  const [revealed, setRevealed] = useState(false);
  const hidden = masked && !revealed;

  const deltaPositive = delta && (delta.lowerIsBetter ? delta.value <= 0 : delta.value >= 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative">
      {badge && (
        <span className={`absolute top-3 right-3 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 pr-16">{title}</p>
      <div className="flex items-center gap-2">
        <p className={`text-2xl font-bold ${color}`}>
          {hidden ? '••••••••' : formatCurrency(value)}
        </p>
        {masked && (
          <button
            onClick={() => setRevealed(r => !r)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={revealed ? 'Ocultar valor' : 'Mostrar valor'}
          >
            {revealed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      {delta && (
        <p className={`text-xs mt-1.5 font-medium ${deltaPositive ? 'text-green-600' : 'text-red-500'}`}>
          {deltaPositive ? '▲' : '▼'} {formatCurrency(Math.abs(delta.value))} carry-over incluido
        </p>
      )}
    </div>
  );
};

export const CarryOverCards: React.FC<CarryOverCardsProps> = ({ period, previousPeriod, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium px-2">Con carry-over del período anterior</span>
          <div className="h-px flex-1 bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!period) return null;

  const hasCarryOver = period.carry_over_in > 0;
  const hasDeficit = period.deficit > 0;
  const balanceColor = period.balance >= 0 ? 'text-blue-600' : 'text-red-500';

  const prevStart = previousPeriod ? formatDate(previousPeriod.period_start) : null;

  return (
    <div className="space-y-3">
      {/* Section divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium px-2 flex items-center gap-1">
          <span>Con carry-over del período anterior</span>
          {hasCarryOver && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              +{formatCurrency(period.carry_over_in)}
            </span>
          )}
        </span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos + carry-over */}
        <CarryOverCard
          title="Ingresos + carry-over"
          value={period.total_income + period.carry_over_in}
          color="text-green-600"
          subtitle={hasCarryOver
            ? `Ingresos ${formatCurrency(period.total_income)} + arrastre ${formatCurrency(period.carry_over_in)}`
            : `Sin arrastre del período anterior`
          }
          badge={hasCarryOver ? 'Carry-over' : undefined}
          badgeColor="bg-amber-100 text-amber-700"
        />

        {/* Gastos */}
        <CarryOverCard
          title="Gastos del período"
          value={period.expenses}
          color="text-red-500"
          subtitle={previousPeriod
            ? `Anterior (${prevStart}): ${formatCurrency(previousPeriod.expenses)}`
            : undefined
          }
        />

        {/* Balance con carry-over */}
        <CarryOverCard
          title="Balance con carry-over"
          value={period.balance}
          color={balanceColor}
          subtitle={hasDeficit
            ? `Déficit: ${formatCurrency(period.deficit)}`
            : `Sobrante para el siguiente: ${formatCurrency(period.carry_over_out)}`
          }
          badge={hasDeficit ? 'Déficit' : undefined}
          badgeColor="bg-red-100 text-red-600"
          delta={hasCarryOver
            ? { value: period.carry_over_in }
            : undefined
          }
        />

        {/* Ingreso fijo — masked */}
        <CarryOverCard
          title="Ingreso fijo"
          value={period.fixed_income}
          color="text-gray-700"
          subtitle={period.registered_incomes > 0
            ? `+ ${formatCurrency(period.registered_incomes)} ingresos registrados`
            : 'Sin ingresos adicionales registrados'
          }
          masked
        />
      </div>
    </div>
  );
};
