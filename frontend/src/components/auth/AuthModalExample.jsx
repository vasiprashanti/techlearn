import React from 'react';
import { useAuthModalContext } from '../../context/AuthModalContext';
import { useAuth } from '../../hooks/useAuth';

/**
 * Example component showing how to use auth modals
 * This demonstrates the pattern for any component that needs to trigger login/signup
 */
const AuthModalExample = () => {
  const { openLogin, openSignup } = useAuthModalContext();
  const { isAuthenticated, user } = useAuth();

  const handleProtectedAction = () => {
    if (!isAuthenticated) {
      // Instead of navigating to /login, open the modal
      openLogin();
      return;
    }
    
    // User is authenticated, proceed with the action
    alert('Protected action executed!');
  };

  const handleSignupAction = () => {
    if (!isAuthenticated) {
      // Open signup modal directly
      openSignup();
      return;
    }
    
    // User is already authenticated
    alert('You are already signed up!');
  };

  return (
    <div className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Auth Modal Example
      </h3>
      
      {isAuthenticated ? (
        <div className="mb-4">
          <p className="text-green-600 dark:text-green-400">
            ✅ Logged in as: {user?.firstName || user?.email}
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            Not logged in
          </p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleProtectedAction}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Protected Action (Triggers Login Modal)
        </button>
        
        <button
          onClick={handleSignupAction}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Signup Action (Triggers Signup Modal)
        </button>
        
        <button
          onClick={openLogin}
          className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Direct Login Modal
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Usage Pattern:</strong> Import useAuthModalContext, check isAuthenticated, 
          and call openLogin() or openSignup() instead of navigate('/login')
        </p>
      </div>
    </div>
  );
};

export default AuthModalExample;
