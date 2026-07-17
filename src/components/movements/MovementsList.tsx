import React, { useEffect, useMemo, useState } from 'react';
import { MovementItem } from './MovementItem';
import { AddMovementForm } from './AddMovementForm';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';
import { useMovements, useDeleteMovement } from '../../hooks/useMovements';
import { useCategories } from '../../hooks/useCategories';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { Movement } from '../../types';

export const MovementsList: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'E' | 'I'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { defaultPeriod, incomeConfig } = useDashboardData();
  const { data: categories } = useCategories();

  useEffect(() => {
    if (defaultPeriod.from && !dateFrom) {
      setDateFrom(defaultPeriod.from);
      setDateTo(defaultPeriod.to);
    }
  }, [defaultPeriod.from, defaultPeriod.to]);

  const isCustomDate = dateFrom !== defaultPeriod.from || dateTo !== defaultPeriod.to;

  const handleResetDates = () => {
    setDateFrom(defaultPeriod.from);
    setDateTo(defaultPeriod.to);
  };

  const params: Record<string, string> = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (typeFilter !== 'all') params.type = typeFilter;
  if (categoryFilter) params.category_id = categoryFilter;

  const { data: grouped, isLoading, error, refetch } = useMovements(params);

  const movements = useMemo(
    () => grouped
      ?.flatMap(g => g.movements)
      .sort((a, b) => b.date.localeCompare(a.date)) ?? [],
    [grouped]
  );

  const deleteMovement = useDeleteMovement();

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este movimiento?')) {
      await deleteMovement.mutateAsync(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Movimientos</h2>
        <Button onClick={() => setShowForm(true)}>+ Agregar</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as 'all' | 'E' | 'I')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="all">Todos</option>
          <option value="E">Gastos</option>
          <option value="I">Ingresos</option>
        </select>

        {/* Category */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">Todas las categorías</option>
          {categories?.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-end gap-1.5">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          {isCustomDate && (
            <button
              onClick={handleResetDates}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm rounded-lg transition-colors self-end"
              title={`Volver al período de corte (día ${incomeConfig?.cut_day ?? '?'})`}
            >
              ↺
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : error ? (
        <ErrorMessage message="No se pudieron cargar los movimientos" onRetry={refetch} />
      ) : !movements.length ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p className="mb-3">No hay movimientos en este período</p>
          <Button onClick={() => setShowForm(true)}>Agregar movimiento</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {movements.map(m => (
            <MovementItem
              key={m.id}
              movement={m}
              onEdit={() => setEditingMovement(m)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {(showForm || editingMovement) && (
        <AddMovementForm
          movement={editingMovement ?? undefined}
          onClose={() => { setShowForm(false); setEditingMovement(null); }}
        />
      )}
    </div>
  );
};
