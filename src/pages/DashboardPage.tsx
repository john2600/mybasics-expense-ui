import React, { useEffect, useMemo, useState } from 'react';
import { MonthlyComparison } from '../components/dashboard/MonthlyComparison';
import { DailyMovements } from '../components/dashboard/DailyMovements';
import { ExpensesByCategoryPieChart } from '../components/charts/ExpensesByCategoryPieChart';
import { IncomeExpensesBarChart } from '../components/charts/IncomeExpensesBarChart';
import { useDashboardData } from '../hooks/useDashboardData';
import { useExpenses, useMovements, useDeleteMovement } from '../hooks/useMovements';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import type { GroupedByCategory } from '../types';

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

interface DateRange {
  from: string;
  to: string;
}

interface HeaderStatProps {
  label: string;
  value: number;
  color: string;
  loading?: boolean;
  masked?: boolean;
}

const HeaderStat: React.FC<HeaderStatProps> = ({ label, value, color, loading, masked }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm min-w-[130px]">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap mb-1">{label}</p>
      {loading ? (
        <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
      ) : (
        <div className="flex items-center gap-1.5">
          <p className={`text-lg font-bold ${color}`}>
            {masked && !revealed ? '••••••' : formatCurrency(value)}
          </p>
          {masked && (
            <button
              onClick={() => setRevealed(r => !r)}
              className="text-gray-300 hover:text-gray-500 transition-colors leading-none"
              aria-label={revealed ? 'Ocultar' : 'Mostrar'}
            >
              {revealed ? '🙈' : '👁️'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const [customPeriod, setCustomPeriod] = useState<DateRange | undefined>(undefined);
  const [inputFrom, setInputFrom] = useState('');
  const [inputTo, setInputTo] = useState('');

  const {
    currentBalance,
    previousBalance,
    monthlySummary,
    defaultPeriod,
    activePeriod,
    previousPeriod,
    isLoading,
    incomeConfig,
  } = useDashboardData(customPeriod);

  useEffect(() => {
    if (defaultPeriod.from && !inputFrom) {
      setInputFrom(defaultPeriod.from);
      setInputTo(defaultPeriod.to);
    }
  }, [defaultPeriod.from, defaultPeriod.to]);

  const handleApply = () => {
    if (inputFrom && inputTo && inputFrom <= inputTo) {
      setCustomPeriod({ from: inputFrom, to: inputTo });
    }
  };

  const handleReset = () => {
    setCustomPeriod(undefined);
    setInputFrom(defaultPeriod.from);
    setInputTo(defaultPeriod.to);
  };

  const isCustom = !!customPeriod;

  const { data: expenseMovements, isLoading: loadingExpenses } = useExpenses({
    date_from: activePeriod.from,
    date_to: activePeriod.to,
  });

  const groupedExpenses = useMemo<GroupedByCategory[]>(() => {
    if (!expenseMovements) return [];
    const map = new Map<string, GroupedByCategory>();
    for (const m of expenseMovements) {
      const cat = m.category || 'Sin categoría';
      if (!map.has(cat)) map.set(cat, { category: cat, total: 0, movements: [] });
      const g = map.get(cat)!;
      g.total += m.amount;
      g.movements.push(m);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenseMovements]);

  const { data: groupedIncomes, isLoading: loadingIncomes } = useMovements({
    type: 'I',
    date_from: activePeriod.from,
    date_to: activePeriod.to,
  });

  const incomeMovements = useMemo(
    () => groupedIncomes
      ?.flatMap(g => g.movements)
      .sort((a, b) => b.date.localeCompare(a.date)) ?? [],
    [groupedIncomes]
  );

  const deleteMovement = useDeleteMovement();

  const today = useMemo(() => toDateStr(new Date()), []);
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateStr(d);
  }, []);

  const { data: recentExpenses } = useExpenses({ date_from: thirtyDaysAgo, date_to: today });

  const consecutiveDaysWithoutExpenses = useMemo(() => {
    if (!recentExpenses) return null;
    const datesWithExpenses = new Set(recentExpenses.map(m => m.date.slice(0, 10)));
    let count = 0;
    const cursor = new Date();
    while (count <= 30) {
      if (datesWithExpenses.has(toDateStr(cursor))) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [recentExpenses]);

  const fixedIncome = currentBalance?.income_config?.amount ?? 0;
  const totalIncome = fixedIncome + (currentBalance?.incomes ?? 0);
  const carryOver = currentBalance?.carry_over ?? 0;

  return (
    <div className="space-y-5">
      {/* Header: title izquierda, KPIs + filtro derecha */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-800 pt-1">Dashboard</h1>

        <div className="flex flex-col gap-3 items-end">
          {/* KPI chips */}
          <div className="flex flex-wrap gap-2 justify-end">
            <HeaderStat
              label="Ingresos del período"
              value={totalIncome}
              color="text-green-600"
              loading={isLoading}
            />
            <HeaderStat
              label="Gastos del período"
              value={currentBalance?.expenses ?? 0}
              color="text-red-500"
              loading={isLoading}
            />
            <HeaderStat
              label="Balance actual"
              value={currentBalance?.balance ?? 0}
              color={!currentBalance || currentBalance.balance >= 0 ? 'text-blue-600' : 'text-red-500'}
              loading={isLoading}
            />
            <HeaderStat
              label="Ingreso fijo"
              value={fixedIncome}
              color="text-gray-700"
              loading={isLoading}
              masked
            />
            <HeaderStat
              label="Lo que te quedó"
              value={carryOver}
              color={carryOver > 0 ? 'text-amber-500' : 'text-gray-500'}
              loading={isLoading}
            />
          </div>

          {/* Filtro de período */}
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={inputFrom}
                onChange={e => setInputFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={inputTo}
                onChange={e => setInputTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <button
              onClick={handleApply}
              disabled={!inputFrom || !inputTo || inputFrom > inputTo}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
            {isCustom && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                title={`Volver al período configurado (día ${incomeConfig?.cut_day ?? '?'})`}
              >
                Restablecer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ingresos vs Gastos — gráfica + tabla resumen al lado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <IncomeExpensesBarChart
            monthlySummary={monthlySummary}
            currentBalance={currentBalance}
            previousBalance={previousBalance}
            loading={isLoading}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Detalle mensual
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Mes</th>
                    <th className="text-right pb-2 font-medium text-green-600">Ingresos</th>
                    <th className="text-right pb-2 font-medium text-red-500">Gastos</th>
                    <th className="text-right pb-2 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(monthlySummary ?? []).slice(0, 6).reverse().map(ms => {
                    const bal = fixedIncome - ms.total;
                    return (
                      <tr key={`${ms.year}-${ms.month}`}>
                        <td className="py-2 text-gray-600 whitespace-nowrap">
                          {formatMonthYear(ms.year, ms.month)}
                        </td>
                        <td className="py-2 text-right text-green-600 font-medium">
                          {formatCurrency(fixedIncome)}
                        </td>
                        <td className="py-2 text-right text-red-500 font-medium">
                          {formatCurrency(ms.total)}
                        </td>
                        <td className={`py-2 text-right font-semibold ${bal >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                          {bal >= 0 ? '+' : ''}{formatCurrency(bal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Donut chart — ancho completo */}
      <ExpensesByCategoryPieChart data={groupedExpenses} loading={loadingExpenses} />

      {/* Días seguidos sin gastos */}
      {consecutiveDaysWithoutExpenses !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-6 text-center">
          <p className="text-sm font-medium text-gray-500 mb-4">Días seguidos sin gastos</p>
          <p className="text-8xl font-bold text-gray-800 leading-none">{consecutiveDaysWithoutExpenses}</p>
          {consecutiveDaysWithoutExpenses === 0 && (
            <p className="text-xs text-gray-400 mt-3">Hoy hay gastos registrados</p>
          )}
        </div>
      )}

      {/* Lista de gastos — ancho completo */}
      <DailyMovements
        title="Gastos del período"
        movements={expenseMovements}
        loading={loadingExpenses}
        onDelete={(id) => { if (confirm('¿Eliminar?')) deleteMovement.mutate(id); }}
      />

      {/* Bottom: ingresos del período + comparación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyMovements
          title="Ingresos del período"
          movements={incomeMovements}
          loading={loadingIncomes}
        />
        <MonthlyComparison
          current={currentBalance}
          previous={previousBalance}
          currentPeriod={activePeriod}
          previousPeriod={previousPeriod}
          loading={isLoading}
        />
      </div>
    </div>
  );
};
