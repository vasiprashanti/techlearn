import React from 'react';
import Signup from '../../pages/Auth/Signup';

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  if (!isOpen) return null;

  return (
    <Signup
      onClose={onClose}
      onSwitchToLogin={onSwitchToLogin}
      onSwitchToSignup={onSwitchToLogin}
      initialMode="signup"
    />
  );
}