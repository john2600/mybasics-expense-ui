import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
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

function AuthenticatedApp() {
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
    <MainLayout activePage={page} onNavigate={setPage}>
      {renderPage()}
    </MainLayout>
  );
}

function UnauthenticatedApp() {
  const [view, setView] = useState<'login' | 'register'>('login');
  // Email recién registrado, para precargarlo en el login.
  const [registeredEmail, setRegisteredEmail] = useState('');

  if (view === 'register') {
    return (
      <RegisterPage
        onSuccess={email => {
          setRegisteredEmail(email);
          setView('login');
        }}
        onGoToLogin={() => setView('login')}
      />
    );
  }

  return (
    <LoginPage
      initialEmail={registeredEmail}
      initialNotice={registeredEmail ? 'Cuenta creada. Ya puedes iniciar sesión.' : ''}
      onGoToRegister={() => {
        setRegisteredEmail('');
        setView('register');
      }}
    />
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
