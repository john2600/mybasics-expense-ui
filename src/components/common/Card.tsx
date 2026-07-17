import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', loading }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 ${className}`}>
    {title && <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>}
    {loading ? (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
    ) : children}
  </div>
);
