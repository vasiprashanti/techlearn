import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthModalContext } from '../context/AuthModalContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/client';

function AdminAccessFallback({ mode, onLogin, onRetry, onReturnHome }) {
  const isError = mode === 'error';
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center px-4 py-20 relative overflow-hidden transition-colors duration-500 ${
        isDarkMode ? 'dark text-white' : 'light text-[#00113b]'
      }`}
    >
      {/* Background matching TechLearn platform */}
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-1000 ${
          isDarkMode
            ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]"
            : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
        }`}
      />

      <div
        className="w-full max-w-lg rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#071a3e]/80 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl transition-all"
        role="alert"
      >
        {/* Eyebrow */}
        <div className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#3C83F6] dark:text-[#8fd9ff] mb-4">
          TECHLEARN ADMIN
        </div>

        {/* Retro style title matching Academy / TechLearn design */}
        <h1
          className="text-xl sm:text-2xl font-bold tracking-tight mb-3"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            lineHeight: 1.4,
            fontSize: 'clamp(14px, 2.5vw, 18px)'
          }}
        >
          {isError ? 'Dashboard Unavailable' : 'Admin Sign-In Required'}
        </h1>

        <p className="mt-3 text-xs sm:text-sm leading-6 text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          {isError
            ? 'We could not verify your admin session credentials. Please check your network connection and try again.'
            : 'You need administrative privileges to view this portal. Sign in with an authorized admin account to continue.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={isError ? onRetry : onLogin}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#3C83F6] text-white shadow-md hover:bg-blue-600 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isError ? 'Try Again' : 'Sign In as Admin'}
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-black/15 dark:border-white/20 bg-white/50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            Return to Academy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPrivateRoute() {
  const token = localStorage.getItem('token');
  const { openLogin } = useAuthModalContext();
  const { setSession, clearSession } = useAuth();
  const navigate = useNavigate();
  const setSessionRef = useRef(setSession);
  const clearSessionRef = useRef(clearSession);
  const [state, setState] = useState('checking');
  const [checkAttempt, setCheckAttempt] = useState(0);
  setSessionRef.current = setSession;
  clearSessionRef.current = clearSession;

  useEffect(() => {
    if (!token) {
      setState('login');
      return undefined;
    }

    let cancelled = false;
    API.get('/api/auth/me')
      .then((response) => {
        const serverUser = response.data || {};
        if (cancelled) return;

        if (serverUser.role !== 'admin') {
          setState('denied');
          return;
        }

        let existingUser = {};
        try {
          existingUser = JSON.parse(localStorage.getItem('userData') || '{}');
        } catch {
          existingUser = {};
        }
        const nextUser = { ...existingUser, ...serverUser };
        localStorage.setItem('userData', JSON.stringify(nextUser));
        localStorage.setItem('isAdmin', 'true');
        if (typeof setSessionRef.current === 'function') setSessionRef.current(nextUser, token);
        setState('allowed');
      })
      .catch((error) => {
        if (cancelled) return;

        if (error.response?.status === 401) {
          clearSessionRef.current();
          setState('login');
          return;
        }

        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [checkAttempt, token]);

  if (state === 'checking') {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-6 pb-16 pt-28">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
          role="status"
          aria-label="Loading admin dashboard"
        />
      </section>
    );
  }

  if (state === 'login') {
    return (
      <AdminAccessFallback
        mode="login"
        onLogin={openLogin}
        onReturnHome={() => navigate('/')}
      />
    );
  }

  if (state === 'error') {
    return (
      <AdminAccessFallback
        mode="error"
        onRetry={() => {
          setState('checking');
          setCheckAttempt((attempt) => attempt + 1);
        }}
        onReturnHome={() => navigate('/')}
      />
    );
  }

  if (state === 'denied') {
    return <Navigate to="/" replace />;
  }

  if (state !== 'allowed') {
    return (
      <AdminAccessFallback
        mode="login"
        onLogin={openLogin}
        onReturnHome={() => navigate('/')}
      />
    );
  }

  return <Outlet />;
}
