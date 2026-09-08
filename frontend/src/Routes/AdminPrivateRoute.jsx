import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthModalContext } from '../context/AuthModalContext';
import API from '../api/client';

function AdminAccessFallback({ mode, onLogin, onRetry, onReturnHome }) {
  const isError = mode === 'error';

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 pb-16 pt-28">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/15 bg-slate-950/45 p-8 text-center shadow-2xl backdrop-blur"
        role="alert"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
          <span className="text-xl" aria-hidden="true">{isError ? '!' : '→'}</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">
          {isError ? 'Admin dashboard unavailable' : 'Admin sign-in required'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {isError
            ? 'We could not verify your admin session. Please try again.'
            : 'Your admin session has expired or is no longer valid. Sign in again to continue.'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={isError ? onRetry : onLogin}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            {isError ? 'Try again' : 'Sign in as admin'}
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            className="rounded-lg border border-slate-200/20 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Return home
          </button>
        </div>
      </div>
    </section>
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
          className="h-10 w-10 animate-spin rounded-full border-2 border-blue-300 border-t-transparent"
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
