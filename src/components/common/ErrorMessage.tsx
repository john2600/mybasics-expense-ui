import React from 'react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message = 'Ocurrió un error', onRetry }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <div className="text-4xl mb-2">⚠️</div>
    <p className="text-gray-600 mb-3">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-blue-500 hover:underline text-sm">
        Reintentar
      </button>
    )}
  </div>
);
