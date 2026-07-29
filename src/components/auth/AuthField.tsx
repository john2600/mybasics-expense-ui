import React from 'react';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
}

/** Fila label + input: apilada en móvil, label a la izquierda desde `sm`. */
export const AuthField: React.FC<AuthFieldProps> = ({ id, label, hint, ...inputProps }) => (
  <div className="sm:grid sm:grid-cols-[100px_1fr] sm:items-start sm:gap-3">
    <label
      htmlFor={id}
      className="block text-xs font-medium text-gray-600 mb-1 sm:mb-0 sm:text-right sm:pt-2.5"
    >
      {label}
    </label>
    <div>
      <input
        id={id}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        {...inputProps}
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  </div>
);
