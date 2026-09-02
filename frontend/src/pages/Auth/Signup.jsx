import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { navigateUserByProgram } from '../../utils/navigation';
import { auth } from '../../config/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import authHeroImg from '../../assets/auth-hero.jpg';

export default function Signup({
  onClose,
  onSwitchToLogin,
  onSwitchToSignup,
  initialMode = 'signup',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, isLoading: authLoading, setSession } = useAuth();
  const { refetchUserData } = useUser();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isLoginMode, setIsLoginMode] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    setIsLoginMode(initialMode === 'login');
  }, [initialMode]);

  // Block signed-in users from accessing login/signup pages
  useEffect(() => {
    if (!authLoading && (isAuthenticated || localStorage.getItem('token'))) {
      if (onClose) {
        onClose();
      } else {
        const storedUser = user || JSON.parse(localStorage.getItem('userData') || 'null');
        navigateUserByProgram(storedUser, navigate, { replace: true });
      }
    }
  }, [authLoading, isAuthenticated, user, navigate, onClose]);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    const lastPage = sessionStorage.getItem('lastNonAuthPage');
    if (lastPage && !['/login', '/signup'].includes(lastPage)) {
      navigate(lastPage);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const getApiBase = () => {
    const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const cleanBase = rawBase.replace(/\/+$/, '');
    return cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;
  };

  const handlePendingAssessmentIfPresent = async () => {
    const pendingRaw = sessionStorage.getItem('pending_assessment');
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        sessionStorage.removeItem('pending_assessment');
        if (pending.programId) {
          navigate('/free-assessment/setup', { state: { programId: pending.programId } });
          return true;
        }
      } catch (err) {
        console.warn('Pending assessment parse error:', err);
      }
    }
    return false;
  };

  // Google OAuth Login / Signup
  const handleGoogleAuth = async () => {
    setStatusMsg({ text: '', type: '' });
    setLoading(true);

    if (!auth) {
      setStatusMsg({
        text: 'Google Sign-In is not configured. Please use email and password.',
        type: 'error',
      });
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const res = await fetch(`${getApiBase()}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: idToken,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        if (setSession) setSession(data.user, data.token);
        if (refetchUserData) await refetchUserData();

        if (await handlePendingAssessmentIfPresent()) {
          return;
        }

        handleClose();
        navigateUserByProgram(data.user, navigate);
      } else {
        setStatusMsg({
          text: data.message || 'Google sign-in succeeded, but backend verification failed.',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setStatusMsg({ text: 'Google sign-in popup closed.', type: 'info' });
      } else {
        setStatusMsg({ text: err.message || 'Google Auth Failed', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Form Submit
  const handleEmailAuth = async (e) => {
    if (e) e.preventDefault();
    setStatusMsg({ text: '', type: '' });

    if (!email.trim() || !password) {
      setStatusMsg({ text: 'Please enter both email and password.', type: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setStatusMsg({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (!isLoginMode && password.length < 6) {
      setStatusMsg({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setLoading(true);

    if (isLoginMode) {
      try {
        const response = await fetch(`${getApiBase()}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await response.json();

        if (response.ok && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
          if (setSession) setSession(data.user, data.token);
          if (refetchUserData) await refetchUserData();

          if (await handlePendingAssessmentIfPresent()) {
            return;
          }

          handleClose();
          navigateUserByProgram(data.user, navigate);
        } else {
          setStatusMsg({
            text: data.message || 'Invalid email or password.',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Login error:', err);
        setStatusMsg({
          text: 'Unable to connect to the server. Please try again.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const regRes = await fetch(`${getApiBase()}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: email.split('@')[0],
          }),
        });

        const regData = await regRes.json();

        if (regRes.ok && regData.token) {
          localStorage.setItem('token', regData.token);
          localStorage.setItem('userData', JSON.stringify(regData.user));
          if (setSession) setSession(regData.user, regData.token);
          if (refetchUserData) await refetchUserData();

          if (await handlePendingAssessmentIfPresent()) {
            return;
          }

          handleClose();
          navigateUserByProgram(regData.user, navigate);
        } else {
          setStatusMsg({
            text: regData.message || 'Account creation failed. Please check your details.',
            type: 'error',
          });
        }
      } catch (err) {
        console.error('Signup error:', err);
        setStatusMsg({
          text: 'Network error during signup. Please try again.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Forgot Password handler
  const handleForgotPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setStatusMsg({ text: 'Please enter your email address to reset password.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email.trim());
        setStatusMsg({
          text: 'Password reset link sent! Check your inbox.',
          type: 'info',
        });
      } else {
        const res = await fetch(`${getApiBase()}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        setStatusMsg({
          text: data.message || 'If an account exists, a reset link has been sent.',
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setStatusMsg({
        text: err.message || 'Failed to send reset email. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && (isAuthenticated || localStorage.getItem('token'))) {
    return null;
  }

  const isModal = Boolean(onClose);

  const containerClasses = isModal
    ? 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto'
    : 'min-h-screen w-full flex items-center justify-center p-6 lg:p-10 transition-colors duration-300';

  return (
    <div
      className={`${containerClasses} ${isDark ? 'dark-mode dark' : ''}`}
      style={{
        '--bg': isDark ? '#080d25' : '#c0e9ff',
        '--text': isDark ? '#f5f7ff' : '#050a5b',
        '--muted': isDark ? '#9da7c2' : '#68718b',
        '--lime': isDark ? '#9bd45a' : '#8cbf4a',
        '--lime-hover': isDark ? '#afe56b' : '#a2d354',
        '--card': isDark ? '#11172d' : '#ffffff',
        '--border': isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(5, 10, 91, 0.14)',
        background: isModal ? 'transparent' : 'var(--bg)',
        color: 'var(--text)',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <style>{`
        .tl-auth-page {
          width: 100%;
          max-width: 1180px;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
          column-gap: 90px;
          align-items: center;
          position: relative;
        }

        .tl-visual-side {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .tl-product-preview {
          width: 100%;
          max-width: 650px;
          position: relative;
          background: transparent;
          overflow: visible;
          transform: rotate(-1deg);
          transition: transform 0.3s ease;
        }

        .tl-product-preview:hover {
          transform: rotate(0deg);
        }

        .tl-product-image {
          width: 85%;
          max-height: 520px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 25px 70px rgba(5, 10, 91, 0.14);
          display: block;
        }

        .tl-form-side {
          width: 100%;
          max-width: 400px;
          justify-self: end;
          margin: 0;
        }

        .tl-eyebrow {
          font-family: "Press Start 2P", cursive;
          font-size: 8px;
          line-height: 1.7;
          color: var(--muted);
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }

        .tl-auth-title {
          font-size: 36px;
          line-height: 1.05;
          letter-spacing: -1.8px;
          font-weight: 800;
          margin-bottom: 27px;
          color: var(--text);
        }

        .tl-auth-card {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 26px;
          box-shadow: 0 20px 55px rgba(5, 10, 91, 0.09);
        }

        .tl-field {
          margin-bottom: 16px;
        }

        .tl-field label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 7px;
          color: var(--text);
        }

        .tl-input-wrap {
          position: relative;
        }

        .tl-input {
          width: 100%;
          height: 46px;
          padding: 0 13px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: transparent;
          color: var(--text);
          outline: none;
          font-size: 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .tl-input::placeholder {
          color: var(--muted);
        }

        .tl-input:focus {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(140, 191, 74, 0.14);
        }

        .tl-password-input {
          padding-right: 60px;
        }

        .tl-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          color: var(--muted);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        .tl-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: -5px;
          margin-bottom: 16px;
        }

        .tl-forgot button,
        .tl-forgot a {
          background: transparent;
          border: none;
          color: var(--muted);
          font-size: 10px;
          text-decoration: none;
          cursor: pointer;
        }

        .tl-forgot button:hover,
        .tl-forgot a:hover {
          color: var(--text);
          text-decoration: underline;
        }

        .tl-submit-btn {
          width: 100%;
          height: 46px;
          border: 0;
          border-radius: 9px;
          background: var(--lime);
          color: #07101b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tl-submit-btn:hover {
          background: var(--lime-hover);
          transform: translateY(-1px);
        }

        .tl-submit-btn:active {
          transform: translateY(0);
        }

        .tl-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tl-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 21px 0;
          color: var(--muted);
          font-size: 9px;
          font-weight: 600;
        }

        .tl-divider::before,
        .tl-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .tl-google-btn {
          width: 100%;
          height: 46px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: transparent;
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .tl-google-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .tl-google-btn:active {
          transform: translateY(0);
        }

        .tl-google-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .tl-switch-auth {
          text-align: center;
          margin-top: 20px;
          color: var(--muted);
          font-size: 11px;
        }

        .tl-switch-auth a,
        .tl-switch-auth button {
          background: transparent;
          border: none;
          color: var(--text);
          font-weight: 700;
          cursor: pointer;
          font-size: 11px;
          text-decoration: none;
        }

        .tl-switch-auth a:hover,
        .tl-switch-auth button:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .tl-terms {
          text-align: center;
          margin-top: 15px;
          color: var(--muted);
          font-size: 9px;
          line-height: 1.5;
        }

        .tl-back-btn {
          position: fixed;
          top: 22px;
          right: 25px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.4);
          color: var(--text);
          font-size: 15px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 50;
          transition: all 0.2s;
        }

        .dark-mode .tl-back-btn {
          background: rgba(17, 23, 45, 0.7);
        }

        .tl-back-btn:hover {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 0.7);
        }

        .dark-mode .tl-back-btn:hover {
          background: rgba(17, 23, 45, 0.95);
        }

        .tl-close-btn {
          position: absolute;
          top: -15px;
          right: -15px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 60;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .tl-status-box {
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 11px;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .tl-status-box.error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .tl-status-box.info {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }

        @media (max-width: 950px) {
          .tl-auth-page {
            grid-template-columns: 1fr;
            max-width: 520px;
            row-gap: 45px;
          }

          .tl-visual-side {
            align-items: center;
          }

          .tl-product-preview {
            max-width: 480px;
            display: flex;
            justify-content: center;
          }

          .tl-product-image {
            width: 75%;
          }

          .tl-form-side {
            max-width: 520px;
            justify-self: center;
          }
        }

        @media (max-width: 560px) {
          .tl-auth-page {
            row-gap: 30px;
          }

          .tl-product-preview {
            transform: none;
          }

          .tl-product-image {
            border-radius: 12px;
            width: 90%;
          }

          .tl-auth-title {
            font-size: 28px;
            letter-spacing: -1px;
          }

          .tl-auth-card {
            padding: 20px;
          }
        }
      `}</style>

      {/* Top Right Close / Back Button */}
      {!isModal && (
        <button
          className="tl-back-btn"
          id="authBackBtn"
          type="button"
          onClick={handleClose}
          title="Go back"
          aria-label="Go back"
        >
          ✕
        </button>
      )}

      {/* Main Layout Card (Wrapped in modal box if modal) */}
      <div
        className={`tl-auth-page ${isModal ? 'bg-[var(--card)] p-6 md:p-10 rounded-2xl border border-[var(--border)] shadow-2xl max-w-4xl' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        {isModal && (
          <button
            type="button"
            className="tl-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            &times;
          </button>
        )}

        {/* LEFT / PRODUCT PREVIEW */}
        <section className="tl-visual-side">
          <div className="tl-product-preview">
            <img
              className="tl-product-image"
              src={authHeroImg}
              alt="TechLearn preview"
            />
          </div>
        </section>

        {/* RIGHT / FORM */}
        <section className="tl-form-side">
          {/* Header Eyebrow & Title */}
          {showForgotPassword ? (
            <div>
              <div className="tl-eyebrow">ACCOUNT RECOVERY</div>
              <h1 className="tl-auth-title">Reset password</h1>
            </div>
          ) : isLoginMode ? (
            <div>
              <div className="tl-eyebrow">SIGN IN TO CONTINUE.</div>
              <h1 className="tl-auth-title">Welcome back</h1>
            </div>
          ) : (
            <div>
              <div className="tl-eyebrow">DO IT FOR THE PLOT.</div>
              <h1 className="tl-auth-title">Create your account</h1>
            </div>
          )}

          {/* Form Card */}
          <div className="tl-auth-card">
            {statusMsg.text && (
              <div className={`tl-status-box ${statusMsg.type}`}>
                {statusMsg.text}
              </div>
            )}

            {showForgotPassword ? (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="tl-field">
                  <label htmlFor="resetEmail">Email</label>
                  <input
                    className="tl-input"
                    id="resetEmail"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="tl-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>

                <div className="tl-switch-auth">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setStatusMsg({ text: '', type: '' });
                    }}
                  >
                    Back to Log in
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN / SIGNUP FORM */
              <form onSubmit={handleEmailAuth} id="authForm">
                {/* Email Field */}
                <div className="tl-field">
                  <label htmlFor="email">Email</label>
                  <input
                    className="tl-input"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="tl-field">
                  <label htmlFor="password">Password</label>
                  <div className="tl-input-wrap">
                    <input
                      className="tl-input tl-password-input"
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="tl-password-toggle"
                      id="passwordToggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Forgot Password (Login mode only) */}
                {isLoginMode && (
                  <div className="tl-forgot">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setStatusMsg({ text: '', type: '' });
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="tl-submit-btn"
                  id="submitBtn"
                  disabled={loading}
                >
                  {loading
                    ? 'PLEASE WAIT...'
                    : isLoginMode
                    ? 'LOG IN'
                    : 'CREATE ACCOUNT'}
                </button>
              </form>
            )}

            {!showForgotPassword && (
              <>
                {/* Divider */}
                <div className="tl-divider">OR</div>

                {/* Google Button */}
                <button
                  type="button"
                  className="tl-google-btn"
                  id="googleBtn"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  <svg className="tl-google-icon" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.75z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.54 13.84a5.86 5.86 0 0 1 0-3.68V7.63H3.29a9.76 9.76 0 0 0 0 8.74l3.25-2.53z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 6.13c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.38l3.25 2.53C7.31 7.85 9.46 6.13 12 6.13z"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Switch Login / Signup */}
                <div className="tl-switch-auth">
                  {isLoginMode ? (
                    <span>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoginMode(false);
                          setStatusMsg({ text: '', type: '' });
                          if (isModal) {
                            if (onSwitchToSignup) onSwitchToSignup();
                          } else {
                            navigate('/signup', { replace: true });
                          }
                        }}
                      >
                        Sign up
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoginMode(true);
                          setStatusMsg({ text: '', type: '' });
                          if (isModal) {
                            if (onSwitchToLogin) onSwitchToLogin();
                          } else {
                            navigate('/login', { replace: true });
                          }
                        }}
                      >
                        Log in
                      </button>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Terms (Signup mode only) */}
          {!isLoginMode && !showForgotPassword && (
            <div className="tl-terms">
              By creating an account, you agree to our{' '}
              <a href="#" className="underline text-[var(--muted)] hover:text-[var(--text)]">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="underline text-[var(--muted)] hover:text-[var(--text)]">
                Privacy Policy
              </a>
              .
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
