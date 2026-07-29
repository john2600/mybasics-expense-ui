import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { AuthField } from '../components/auth/AuthField';
import { AuthShell } from '../components/auth/AuthShell';
import { authApi } from '../services/authApi';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validateRegisterPayload } from '../utils/validators';

interface RegisterPageProps {
  /** Se llama tras el 201, con el username ya normalizado. */
  onSuccess: (username: string) => void;
  onGoToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onGoToLogin }) => {
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateRegisterPayload(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await authApi.register(form);
      onSuccess(form.username.trim().toLowerCase());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate para empezar a registrar tus gastos."
      footer={
        <>
          Modo demo: la cuenta no se guarda en ningún servidor. Los usuarios{' '}
          <code className="font-mono text-gray-500">john</code> y{' '}
          <code className="font-mono text-gray-500">admin</code> están ocupados, para probar el error
          de duplicado.
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          id="username"
          label="Usuario"
          type="text"
          autoComplete="username"
          autoFocus
          value={form.username}
          onChange={update('username')}
          placeholder="john"
          hint="Se guarda en minúsculas."
        />

        <AuthField
          id="name"
          label="Nombre"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={update('name')}
          placeholder="John Doe"
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          placeholder="john@example.com"
        />

        <AuthField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          placeholder="••••••••"
          hint={`Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`}
        />

        {error && (
          <p
            role="alert"
            className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2 break-words"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button type="submit" loading={loading} className="px-6">
            Crear cuenta
          </Button>
          <button type="button" onClick={onGoToLogin} className="text-blue-500 hover:underline text-sm">
            Ya tengo cuenta
          </button>
        </div>
      </form>
    </AuthShell>
  );
};
