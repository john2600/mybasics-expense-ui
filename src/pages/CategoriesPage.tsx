import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/Loading';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategories';
import type { Category } from '../types';

const emptyForm = { name: '', description: '', color: '#6366f1' };

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; category: Category };

export const CategoriesPage: React.FC = () => {
  const { data: categories, isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [mode, setMode] = useState<Mode>({ type: 'list' });
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setMode({ type: 'create' });
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description ?? '', color: cat.color ?? '#6366f1' });
    setFormError('');
    setMode({ type: 'edit', category: cat });
  };

  const cancel = () => {
    setMode({ type: 'list' });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('El nombre es requerido');
      return;
    }
    try {
      if (mode.type === 'create') {
        await createCat.mutateAsync({
          name: form.name.trim(),
          description: form.description,
          color: form.color,
        });
      } else if (mode.type === 'edit') {
        await updateCat.mutateAsync({
          id: mode.category.id,
          payload: { name: form.name.trim(), description: form.description, color: form.color },
        });
      }
      setMode({ type: 'list' });
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"? Los movimientos asociados quedarán sin categoría válida.`)) return;
    try {
      await deleteCat.mutateAsync(cat.id);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const isPending = createCat.isPending || updateCat.isPending;
  const isValidColor = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Categorías</h1>
        {mode.type === 'list' && (
          <button
            onClick={openCreate}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Nueva categoría
          </button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <LoadingSpinner className="py-8" />
        ) : !categories?.length ? (
          <p className="text-center text-sm text-gray-400 py-8">
            No hay categorías. Crea la primera.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-gray-800 w-36 flex-shrink-0 truncate">
                  {cat.name}
                </span>
                <span className="text-sm text-gray-500 flex-1 truncate">{cat.description}</span>
                <button
                  onClick={() => openEdit(cat)}
                  className="text-gray-400 hover:text-blue-500 px-1 text-sm transition-colors"
                  title="Editar"
                >
                  ✏
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  disabled={deleteCat.isPending}
                  className="text-gray-400 hover:text-red-500 px-1 text-sm transition-colors disabled:opacity-40"
                  title="Eliminar"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {mode.type !== 'list' && (
        <Card title={mode.type === 'create' ? 'Nueva categoría' : 'Editar categoría'}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="#6366f1"
                  className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  type="color"
                  value={isValidColor(form.color) ? form.color : '#6366f1'}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-9 h-9 rounded cursor-pointer border border-gray-200"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={isPending} size="sm">
                Guardar
              </Button>
              <button
                type="button"
                onClick={cancel}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
