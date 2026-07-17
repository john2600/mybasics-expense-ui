import React from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Movement } from '../../types';

interface MovementItemProps {
  movement: Movement;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const MovementItem: React.FC<MovementItemProps> = ({ movement, onEdit, onDelete }) => {
  const isExpense = movement.type === 'E';
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base
        ${isExpense ? 'bg-red-100' : 'bg-green-100'}`}>
        {isExpense ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{movement.description}</p>
        <p className="text-xs text-gray-400">{movement.category} · {formatDate(movement.date)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${isExpense ? 'text-red-500' : 'text-green-600'}`}>
          {isExpense ? '-' : '+'}{formatCurrency(movement.amount)}
        </span>
        <div className="hidden group-hover:flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(movement.id)}
              className="p-1 text-gray-400 hover:text-blue-500 rounded"
              aria-label="Editar"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(movement.id)}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
              aria-label="Eliminar"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
