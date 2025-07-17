import { Navigate } from 'react-router-dom';

export const RequireAuth = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />; // Redirect non-admins to normal dashboard
  }

  return children;
};