import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAuthModalContext } from '../context/AuthModalContext';
import API from '../api/client';

export default function AdminPrivateRoute() {
  const token = localStorage.getItem('token');
  const { openLogin } = useAuthModalContext();
  const { setSession } = useAuth();
  const setSessionRef = useRef(setSession);
  const [state, setState] = useState('checking');
  setSessionRef.current = setSession;

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
      .catch(() => {
        if (!cancelled) setState('login');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (state === 'login') openLogin();
  }, [openLogin, state]);

  if (state === 'checking') {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Checking administrator access…</div>;
  }

  if (state === 'login') {
    return null;
  }

  if (state === 'denied') {
    return <Navigate to="/" replace />;
  }

  if (state !== 'allowed') {
    openLogin();
    return null;
  }

  return <Outlet />;
}
