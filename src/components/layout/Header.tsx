import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => (
  <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-30">
    <button
      onClick={onMenuClick}
      className="lg:hidden mr-3 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
      aria-label="Toggle menu"
    >
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <span className="text-lg font-bold text-blue-600">💰 MyExpenses</span>
  </header>
);
