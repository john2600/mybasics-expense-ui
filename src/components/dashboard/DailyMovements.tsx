import React from 'react';
import { Card } from '../common/Card';
import { MovementItem } from '../movements/MovementItem';
import { LoadingSpinner } from '../common/Loading';
import type { Movement } from '../../types';

interface DailyMovementsProps {
  title: string;
  movements?: Movement[];
  loading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export const DailyMovements: React.FC<DailyMovementsProps> = ({ title, movements, loading, onEdit, onDelete }) => (
  <Card title={title}>
    {loading ? (
      <LoadingSpinner className="py-8" />
    ) : !movements?.length ? (
      <div className="text-center py-8 text-gray-400">
        <div className="text-3xl mb-2">📭</div>
        <p className="text-sm">No hay movimientos en este período</p>
      </div>
    ) : (
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {movements.map(m => (
          <MovementItem key={m.id} movement={m} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    )}
  </Card>
);
