import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthModalContext } from '../context/AuthModalContext';

export const RequireAuth = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const navigate = useNavigate();
  const { openLogin } = useAuthModalContext();

  useEffect(() => {
    if (!token) {
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname;
      localStorage.setItem('redirectAfterLogin', currentPath);
      
      // Open login modal instead of redirecting
      openLogin();
      
      // Navigate to home page as fallback
      navigate('/');
    }
  }, [token, openLogin, navigate]);

  if (!token) {
    return null; // Don't render anything while opening modal
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />; // Redirect non-admins to normal dashboard
  }

  return children;
};