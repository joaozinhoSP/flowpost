import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, status, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Se é free e atingiu o limite, redireciona para /pricing
  if (status && status.planId === 'free' && !status.canPost) {
    const isPricing = location.pathname === '/pricing';
    if (!isPricing) {
      return <Navigate to="/pricing" replace />;
    }
  }

  return <>{children}</>;
}
