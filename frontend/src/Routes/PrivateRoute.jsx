import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthModalContext } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, isLoading, token } = useAuth();
  const { openLogin } = useAuthModalContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLogin();
    }
  }, [isLoading, isAuthenticated, openLogin]);

  if (isLoading) return null;

  return isAuthenticated && token ? <Outlet /> : null;
};

export default PrivateRoute;