import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthModalContext } from '../../context/AuthModalContext';
import { useAuth } from '../../context/AuthContext';

// The dedicated /login screen has been replaced by a global modal.
// This route exists for redirects (e.g., protected pages) and will open the modal.
export default function Login() {
  const navigate = useNavigate();
  const { openLogin } = useAuthModalContext();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    openLogin();
  }, [isAuthenticated, navigate, openLogin]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Login is available in a popup modal
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          We’ve opened the login modal. If you don’t see it, click the button below.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={openLogin}
            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 dark:border-blue-700/40 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40"
          >
            Open Login
          </button>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="rounded-xl border border-white/20 bg-white/60 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-white/80 dark:border-gray-700/20 dark:bg-gray-900/30 dark:text-gray-100 dark:hover:bg-gray-800/60"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
