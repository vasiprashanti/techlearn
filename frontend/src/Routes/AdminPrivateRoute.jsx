import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModalContext } from '../context/AuthModalContext';

export default function AdminPrivateRoute() {
  const userData = localStorage.getItem('userData');
  const token = localStorage.getItem('token');
  const { openLogin } = useAuthModalContext();

  // Parse userData only if it exists
  const user = userData ? JSON.parse(userData) : null;

  if (!user || !token) {
    openLogin();
    return null;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
