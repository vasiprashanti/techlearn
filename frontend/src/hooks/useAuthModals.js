import { useState } from 'react';

export const useAuthModals = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const openLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const openSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const closeModals = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(false);
  };

  const switchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const switchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  return {
    isLoginOpen,
    isSignupOpen,
    openLogin,
    openSignup,
    closeModals,
    switchToSignup,
    switchToLogin,
  };
};
