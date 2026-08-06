import React from 'react';
import Signup from '../../pages/Auth/Signup';

export default function LoginModal({ isOpen, onClose, onSwitchToSignup }) {
  if (!isOpen) return null;

  return (
    <Signup
      onClose={onClose}
      onSwitchToLogin={onSwitchToSignup}
      onSwitchToSignup={onSwitchToSignup}
      initialMode="login"
    />
  );
}
