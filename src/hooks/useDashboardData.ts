import { useIncomeConfig } from './useFinancialSummary';
import { useBalance } from './useFinancialSummary';
import { useMovementsSummary } from './useMovements';
import { getCurrentPeriod, getPreviousPeriod } from '../utils/formatters';

interface DateRange {
  from: string;
  to: string;
}

export function useDashboardData(customPeriod?: DateRange) {
  const { data: incomeConfig, isLoading: loadingConfig } = useIncomeConfig();

  const cutDay = incomeConfig?.cut_day ?? 1;
  const defaultPeriod = getCurrentPeriod(cutDay);
  const previousPeriod = getPreviousPeriod(cutDay);

  const activePeriod = customPeriod ?? defaultPeriod;

  const { data: currentBalance, isLoading: loadingCurrent, refetch: refetchCurrent } = useBalance({
    date_from: activePeriod.from,
    date_to: activePeriod.to,
  });

  const { data: previousBalance, isLoading: loadingPrevious } = useBalance({
    date_from: previousPeriod.from,
    date_to: previousPeriod.to,
  });

  const { data: monthlySummary, isLoading: loadingMonthly } = useMovementsSummary();

  const isLoading = loadingConfig || loadingCurrent || loadingPrevious || loadingMonthly;

  return {
    incomeConfig,
    currentBalance,
    previousBalance,
    monthlySummary,
    defaultPeriod,
    activePeriod,
    previousPeriod,
    isLoading,
    refetch: refetchCurrent,
  };
}
