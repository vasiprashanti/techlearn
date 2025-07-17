import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthModalContext } from '../context/AuthModalContext';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  const { openLogin } = useAuthModalContext();

  useEffect(() => {
    if (!token) {
      openLogin();
    }
  }, [token, openLogin]);

  return token ? <Outlet /> : null;
};

export default PrivateRoute;