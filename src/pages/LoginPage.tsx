import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { AuthField } from '../components/auth/AuthField';
import { AuthShell } from '../components/auth/AuthShell';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onGoToRegister: () => void;
  /** Email precargado, p. ej. el de la cuenta recién creada. */
  initialEmail?: string;
  /** Aviso informativo mostrado al abrir la pantalla. */
  initialNotice?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoToRegister,
  initialEmail = '',
  initialNotice = '',
}) => {
  const { login } = useAuth();

  const [form, setForm] = useState({ email: initialEmail, password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialNotice);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!form.email.trim() || !form.password) {
      setError('Ingresa tu email y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
    } catch (err: unknown) {
      // Credenciales inválidas → 401 "invalid email or password".
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Accede para gestionar tus gastos.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="john@example.com"
        />

        <AuthField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="••••••••"
        />

        {error && (
          <p role="alert" className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-green-600 text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            {notice}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button type="submit" loading={loading} className="px-6">
            Ingresar
          </Button>
          <button type="button" onClick={onGoToRegister} className="text-blue-500 hover:underline text-sm">
            Crear cuenta
          </button>
        </div>
      </form>
    </AuthShell>
  );
};
