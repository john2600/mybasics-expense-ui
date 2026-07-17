import React, { useState } from 'react';
import { Button } from '../common/Button';
import { useCategories } from '../../hooks/useCategories';
import { useCreateMovement, useUpdateMovement } from '../../hooks/useMovements';
import type { Movement, MovementType } from '../../types';
import { format } from 'date-fns';

interface Props {
  movement?: Movement;
  onClose: () => void;
}

export const AddMovementForm: React.FC<Props> = ({ movement, onClose }) => {
  const { data: categories } = useCategories();
  const createMovement = useCreateMovement();
  const updateMovement = useUpdateMovement();

  const [form, setForm] = useState({
    category_id: movement?.category_id ? String(movement.category_id) : '',
    type: (movement?.type ?? 'E') as MovementType,
    amount: movement?.amount ? String(movement.amount) : '',
    description: movement?.description ?? '',
    date: movement?.date ? movement.date.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
    hour: movement?.hour ?? '',
  });
  const [error, setError] = useState('');

  const isEdit = !!movement;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.category_id || !form.amount || !form.description || !form.date) {
      setError('Completa todos los campos requeridos.');
      return;
    }

    const payload = {
      category_id: Number(form.category_id),
      type: form.type,
      amount: Number(form.amount),
      description: form.description,
      date: form.date,
      ...(form.hour ? { hour: form.hour } : {}),
    };

    try {
      if (isEdit) {
        await updateMovement.mutateAsync({ id: movement.id, payload });
      } else {
        await createMovement.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el movimiento');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-800 mb-4">
          {isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Type */}
          <div className="flex gap-2">
            {(['E', 'I'] as MovementType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${form.type === t
                    ? t === 'E' ? 'bg-red-500 text-white border-red-500' : 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {t === 'E' ? '↓ Gasto' : '↑ Ingreso'}
              </button>
            ))}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Categoría *</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Seleccionar...</option>
              {categories?.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Monto (COP) *</label>
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="Ej: 50000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Descripción *</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Mercado semanal"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* Date + Hour */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Fecha *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Hora</label>
              <input
                type="time"
                value={form.hour || ''}
                onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMovement.isPending || updateMovement.isPending}
              className="flex-1"
            >
              {isEdit ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
