import { createContext, useContext } from 'react';
import { useAuthModals } from '../hooks/useAuthModals';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';

const AuthModalContext = createContext();

export const useAuthModalContext = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModalContext must be used within an AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider = ({ children }) => {
  const authModals = useAuthModals();

  return (
    <AuthModalContext.Provider value={authModals}>
      {children}
      
      {/* Global Auth Modals */}
      <LoginModal 
        isOpen={authModals.isLoginOpen} 
        onClose={authModals.closeModals} 
        onSwitchToSignup={authModals.switchToSignup} 
      />
      <SignupModal 
        isOpen={authModals.isSignupOpen} 
        onClose={authModals.closeModals} 
        onSwitchToLogin={authModals.switchToLogin} 
      />
    </AuthModalContext.Provider>
  );
};
