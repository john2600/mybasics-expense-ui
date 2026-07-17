import React from 'react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'movements', label: 'Movimientos', icon: '📋' },
  { id: 'reports', label: 'Reportes', icon: '📥' },
  { id: 'categories', label: 'Categorías', icon: '🏷️' },
  { id: 'settings', label: 'Configuración', icon: '⚙️' },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose, activePage, onNavigate }) => (
  <>
    {/* Mobile overlay */}
    {open && (
      <div
        className="fixed inset-0 bg-black/40 z-20 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-gray-200 z-20 transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <nav className="p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
              ${activePage === item.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  </>
);
