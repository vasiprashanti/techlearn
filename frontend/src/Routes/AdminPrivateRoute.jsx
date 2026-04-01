import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModalContext } from '../context/AuthModalContext';

export default function AdminPrivateRoute() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const { openLogin } = useAuthModalContext();

  const effectiveUser = user;
  const hasAuth = Boolean(isAuthenticated && token);

  // If we're not authenticated (after restore completes), show the login modal.
  // Use an effect to avoid state updates during render.
  useEffect(() => {
    if (!isLoading && !hasAuth) {
      openLogin();
    }
  }, [isLoading, hasAuth, openLogin]);

  if (isLoading) return null;

  if (!hasAuth) return null;

  if (!effectiveUser || effectiveUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
