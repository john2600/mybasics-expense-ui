import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ChangePasswordCard } from '../components/settings/ChangePasswordCard';
import { useIncomeConfig } from '../hooks/useFinancialSummary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { data: config, isLoading } = useIncomeConfig();
  const qc = useQueryClient();
  const [form, setForm] = useState({ amount: '', cut_day: '', description: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        amount: String(config.amount),
        cut_day: String(config.cut_day),
        description: config.description,
      });
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: () => api.updateIncomeConfig({
      amount: Number(form.amount),
      cut_day: Number(form.cut_day),
      description: form.description,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income-config'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Configuración</h1>
      <Card title="Ingreso fijo mensual" loading={isLoading}>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Monto mensual (COP)</label>
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Día de corte (1-28)</label>
            <input
              type="number"
              min="1"
              max="28"
              value={form.cut_day}
              onChange={e => setForm(f => ({ ...f, cut_day: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">El período va del día {form.cut_day} de cada mes hasta el día {Number(form.cut_day) - 1} del mes siguiente.</p>
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
          <Button type="submit" loading={mutation.isPending}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>

      <ChangePasswordCard />
    </div>
  );
};
