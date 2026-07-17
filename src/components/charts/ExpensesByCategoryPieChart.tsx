import React, { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Label, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import type { GroupedByCategory } from '../../types';

const DEFAULT_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#C9CBCF', '#7C8798',
  '#E91E63', '#2196F3', '#FF9800', '#009688',
  '#673AB7', '#F44336', '#8BC34A', '#00BCD4',
  '#FFC107', '#795548', '#607D8B', '#3F51B5',
];

interface Props {
  data?: GroupedByCategory[];
  loading?: boolean;
}

export const ExpensesByCategoryPieChart: React.FC<Props> = memo(({ data, loading }) => {
  const total = data?.reduce((s, d) => s + d.total, 0) ?? 0;

  const chartData = (data ?? [])
    .slice(0, 20)
    .map((d, i) => ({
      name: d.category,
      value: d.total,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      pct: total > 0 ? ((d.total / total) * 100).toFixed(1) : '0',
    }));

  // Split legend into two columns
  const mid = Math.ceil(chartData.length / 2);
  const col1 = chartData.slice(0, mid);
  const col2 = chartData.slice(mid);

  return (
    <Card title="Top 20 Gastos" loading={loading}>
      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Sin datos de gastos</div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Donut chart */}
          <div className="flex-shrink-0 w-64">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={82}
                  outerRadius={126}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox as { cx: number; cy: number };
                      return (
                        <g>
                          <text x={cx} y={cy - 10} textAnchor="middle" fill="#6b7280" fontSize={12}>
                            Total
                          </text>
                          <text x={cx} y={cy + 12} textAnchor="middle" fill="#111827" fontWeight={700} fontSize={14}>
                            {formatCurrency(total)}
                          </text>
                        </g>
                      );
                    }}
                    position="center"
                  />
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Numbered legend — two columns */}
          <div className="flex-1 flex gap-6 min-w-0">
            {[col1, col2].map((col, colIdx) => (
              <div key={colIdx} className="flex-1 space-y-1.5 min-w-0">
                {col.map((entry, i) => {
                  const num = colIdx === 0 ? i + 1 : mid + i + 1;
                  return (
                    <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-gray-400 w-4 flex-shrink-0 text-right leading-none">
                        {num}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-gray-700 truncate flex-1">{entry.name}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                        ({entry.pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
});

ExpensesByCategoryPieChart.displayName = 'ExpensesByCategoryPieChart';
