import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// AdminPrivateRoute: Only allows access if user is authenticated and has role 'admin'
export default function AdminPrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) return null; // or a loading spinner

  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
