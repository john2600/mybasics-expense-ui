import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { MOCK_INVALID_USERNAME } from '../services/authApi';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!form.username.trim() || !form.password) {
      setError('Ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login({ username: form.username, password: form.password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
        <span className="text-lg font-bold text-blue-600">💰 MyExpenses</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-md">
          <h1 className="text-base font-bold text-gray-800 mb-1">Iniciar sesión</h1>
          <p className="text-xs text-gray-500 mb-5">Accede para gestionar tus gastos.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="sm:grid sm:grid-cols-[90px_1fr] sm:items-center sm:gap-3">
              <label htmlFor="username" className="block text-xs font-medium text-gray-600 mb-1 sm:mb-0 sm:text-right">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="tu.usuario"
                className={inputClass}
              />
            </div>

            <div className="sm:grid sm:grid-cols-[90px_1fr] sm:items-center sm:gap-3">
              <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1 sm:mb-0 sm:text-right">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {notice && <p className="text-gray-500 text-xs">{notice}</p>}

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button type="submit" loading={loading} className="px-6">
                Ingresar
              </Button>
              <button
                type="button"
                onClick={() => setNotice('El registro de usuarios aún no está disponible.')}
                className="text-blue-500 hover:underline text-sm"
              >
                Crear cuenta
              </button>
            </div>
          </form>

          <p className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">
            Modo demo: cualquier usuario y contraseña inician sesión. Usa{' '}
            <code className="font-mono text-gray-500">{MOCK_INVALID_USERNAME}</code> como usuario para ver el error.
          </p>
        </div>
      </main>
    </div>
  );
};
