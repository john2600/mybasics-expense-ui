import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { authApi, friendlyChangePasswordError } from '../../services/authApi';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePasswordChange } from '../../utils/validators';

const EMPTY_FORM = { current: '', next: '', confirmation: '' };

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400';

export const ChangePasswordCard: React.FC = () => {
  const { session } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        // El email sale de la sesión, no de un campo: el usuario solo puede
        // cambiar su propia contraseña desde aquí.
        login_request: { email: session?.user.email ?? '', password: form.current },
        new_password: form.next,
      }),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    },
    onError: (err: unknown) => {
      setError(friendlyChangePasswordError(err instanceof Error ? err.message : ''));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);

    const validationError = validatePasswordChange(form.current, form.next, form.confirmation);
    if (validationError) {
      setError(validationError);
      return;
    }

    mutation.mutate();
  };

  return (
    <Card title="Contraseña" className="mt-4">
      <p className="text-xs text-gray-500 mb-3">
        Cambiarás la contraseña de <span className="font-medium text-gray-700">{session?.user.email}</span>.
        Tu sesión actual sigue abierta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="current-password" className="block text-xs text-gray-500 mb-1">
            Contraseña actual
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={form.current}
            onChange={update('current')}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-xs text-gray-500 mb-1">
            Nueva contraseña
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={form.next}
            onChange={update('next')}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Entre {PASSWORD_MIN_LENGTH} y {PASSWORD_MAX_LENGTH} caracteres, distinta de la actual.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-xs text-gray-500 mb-1">
            Repetir nueva contraseña
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={form.confirmation}
            onChange={update('confirmation')}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {done && (
          <p className="text-green-600 text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            Contraseña actualizada. Úsala la próxima vez que inicies sesión.
          </p>
        )}

        <Button type="submit" loading={mutation.isPending}>
          Cambiar contraseña
        </Button>
      </form>
    </Card>
  );
};
