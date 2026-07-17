import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { MovementsList } from './components/movements/MovementsList';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CategoriesPage } from './pages/CategoriesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  const [page, setPage] = useState('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'movements': return <MovementsList />;
      case 'reports': return <ReportsPage />;
      case 'categories': return <CategoriesPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout activePage={page} onNavigate={setPage}>
        {renderPage()}
      </MainLayout>
    </QueryClientProvider>
  );
}
