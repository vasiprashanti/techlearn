import { useNavigate } from 'react-router-dom';

export const useAuthModals = () => {
  const navigate = useNavigate();

  const openLogin = () => {
    navigate('/login');
  };

  const openSignup = () => {
    navigate('/signup');
  };

  const closeModals = () => {
    // No-op for page navigation
  };

  const switchToSignup = () => {
    navigate('/signup');
  };

  const switchToLogin = () => {
    navigate('/login');
  };

  return {
    isLoginOpen: false,
    isSignupOpen: false,
    openLogin,
    openSignup,
    closeModals,
    switchToSignup,
    switchToLogin,
  };
};
