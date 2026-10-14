import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthModalContext } from '../context/AuthModalContext';
import { expireSession, isTokenExpired } from '../utils/session';

const PrivateRoute = () => {
  const rawToken = localStorage.getItem('token');
  const tokenExpired = Boolean(rawToken && isTokenExpired(rawToken));
  const token = tokenExpired ? null : rawToken;
  const { openLogin } = useAuthModalContext();
  const navigate = useNavigate();
  const location = useLocation();

  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('userData') || 'null');
  } catch {
    storedUser = null;
  }
  const onboardingIncomplete = Boolean(
    token &&
    storedUser &&
    storedUser.role !== 'admin' &&
    storedUser.onboardingCompleted === false
  );

  useEffect(() => {
    if (tokenExpired) expireSession();
    if (!token) {
      openLogin();
      return;
    }

    if (onboardingIncomplete && !location.pathname.startsWith('/signup')) {
      navigate('/signup', {
        replace: true,
        state: { resumeOnboarding: true, from: location.pathname },
      });
    }
  }, [token, tokenExpired, onboardingIncomplete, location.pathname, navigate, openLogin]);

  return token && !onboardingIncomplete ? <Outlet /> : null;
};

export default PrivateRoute;
