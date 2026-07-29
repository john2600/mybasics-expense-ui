import React from 'react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Nota al pie, separada por una línea. */
  footer?: React.ReactNode;
}

/** Marco común de las pantallas de autenticación: header + tarjeta centrada. */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
      <span className="text-lg font-bold text-blue-600">💰 MyExpenses</span>
    </header>

    <main className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-md">
        <h1 className="text-base font-bold text-gray-800 mb-1">{title}</h1>
        <p className="text-xs text-gray-500 mb-5">{subtitle}</p>

        {children}

        {footer && (
          <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">{footer}</div>
        )}
      </div>
    </main>
  </div>
);
