import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { programLearningAPI } from '../../services/programLearningApi';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pixel avatars from the waitlist design: [rects as x, y, width, height, fill]
const AVATARS = [
  [[2, 16, 20, 13, '#0f42ce'], [0, 21, 2, 8, '#1d5ef2'], [22, 21, 2, 8, '#1d5ef2'], [2, 28, 20, 2, '#84adff'], [10, 13, 4, 3, '#6992f7'], [5, 3, 14, 11, '#1d5ef2'], [4, 5, 1, 7, '#1d5ef2'], [19, 5, 1, 7, '#1d5ef2'], [5, 7, 14, 3, '#000000'], [7, 8, 2, 1, '#ffffff'], [15, 8, 2, 1, '#ffffff']],
  [[2, 15, 20, 14, '#0d8554'], [0, 20, 2, 9, '#13ad6f'], [22, 20, 2, 9, '#13ad6f'], [2, 28, 20, 2, '#a3f7cb'], [10, 13, 4, 2, '#8bf2b9'], [5, 2, 14, 11, '#2fd18a'], [7, 4, 4, 6, '#ffffff'], [13, 4, 4, 6, '#ffffff'], [8, 5, 2, 4, '#000000'], [14, 5, 2, 4, '#000000'], [9, 5, 1, 1, '#ffffff'], [15, 5, 1, 1, '#ffffff']],
  [[2, 15, 20, 14, '#d92b2b'], [0, 20, 2, 9, '#ff4d4d'], [22, 20, 2, 9, '#ff4d4d'], [2, 28, 20, 2, '#ffb3b3'], [10, 13, 4, 2, '#ffe0e0'], [6, 4, 12, 10, '#f74343'], [5, 1, 14, 2, '#2d283e'], [4, 2, 2, 3, '#2d283e'], [18, 2, 2, 3, '#2d283e'], [3, 4, 3, 7, '#e2e8f0'], [18, 4, 3, 7, '#e2e8f0'], [4, 5, 1, 5, '#2d283e'], [19, 5, 1, 5, '#2d283e']],
  [[2, 16, 20, 13, '#181a24'], [0, 20, 2, 9, '#2c2f40'], [22, 20, 2, 9, '#2c2f40'], [2, 28, 20, 2, '#60678a'], [10, 14, 4, 2, '#4d5370'], [6, 6, 12, 8, '#181a24'], [5, 1, 14, 5, '#3b82f6'], [3, 5, 18, 2, '#2563eb']],
  [[2, 15, 20, 14, '#0d9488'], [0, 20, 2, 9, '#14b8a6'], [22, 20, 2, 9, '#14b8a6'], [2, 28, 20, 2, '#99f6e4'], [10, 13, 4, 2, '#ccfbf1'], [6, 5, 12, 9, '#14b8a6'], [4, 1, 16, 5, '#0f172a'], [3, 3, 3, 7, '#0f172a'], [18, 3, 3, 7, '#0f172a']],
];

export default function JoinWaitlistModal({ isOpen, onClose, program }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);

  // fresh state each time the page opens
  useEffect(() => {
    if (isOpen) {
      setEmail(user?.email || '');
      setError('');
      setLoading(false);
      setSubmitted(false);
      submittingRef.current = false;
    }
  }, [isOpen, user?.email]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !program) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return; // ignore double clicks / repeated Enter

    const value = email.trim();
    if (!value) return setError('Please enter your email address.');
    if (!EMAIL_PATTERN.test(value)) return setError('Please enter a valid email address.');

    submittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const fullName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ');
      await programLearningAPI.joinWaitlist(program._id || program.id, {
        email: value,
        ...(fullName ? { name: fullName.trim() } : {}),
        ...(user?.phoneNumber ? { phone: user.phoneNumber } : {}),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error joining waitlist:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      submittingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wl-root" role="dialog" aria-modal="true" aria-label="Join our waitlist">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');
        .wl-root { position: fixed; inset: 0; z-index: 300; overflow-y: auto; background: #080c1d; color: #fff; font-family: 'Inter', sans-serif; display: flex; align-items: center; padding: 2rem 5% 2rem 12%; -webkit-font-smoothing: antialiased; }
        .wl-root * { box-sizing: border-box; }
        .wl-close { position: fixed; top: 24px; right: 28px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 8px; color: #fff; cursor: pointer; z-index: 2; transition: opacity .2s, background-color .2s; }
        .wl-close:hover { opacity: .75; background: rgba(255,255,255,.08); }
        .wl-close:focus-visible { outline: 2px solid #b8f041; outline-offset: 3px; }
        .wl-container { width: 100%; max-width: 650px; }
        .wl-avatars { display: flex; align-items: flex-end; gap: 1.25rem; margin-bottom: 2rem; }
        .wl-avatar { width: 84px; height: 110px; flex-shrink: 0; animation: wlFloat 3s ease-in-out infinite; }
        .wl-avatar:nth-child(2) { animation-delay: .4s; } .wl-avatar:nth-child(3) { animation-delay: .8s; } .wl-avatar:nth-child(4) { animation-delay: 1.2s; } .wl-avatar:nth-child(5) { animation-delay: 1.6s; }
        .wl-avatar svg { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
        @keyframes wlFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .wl-eyebrow { font-family: 'Press Start 2P', monospace; font-size: .75rem; line-height: 1.8; color: #e2e8f0; margin-bottom: .6rem; display: block; }
        .wl-heading { font-size: clamp(2.5rem, 5.5vw, 4rem); font-weight: 700; line-height: 1.15; letter-spacing: -.03em; margin: 0 0 1.5rem; overflow-wrap: anywhere; }
        .wl-pixel-our { font-family: 'Press Start 2P', monospace; font-size: .72em; letter-spacing: -.05em; display: inline-block; transform: translateY(-2px); margin: 0 .1em; }
        .wl-pixel-youre { font-family: 'Press Start 2P', monospace; font-size: .48em; font-style: italic; font-weight: 400; letter-spacing: -.05em; display: inline-block; vertical-align: middle; margin-right: .12em; }
        .wl-subtitle { font-size: 1.05rem; line-height: 1.6; color: #94a3b8; margin: 0 0 2.75rem; max-width: 700px; }
        .wl-container.is-success .wl-subtitle { margin-bottom: 0; }
        .wl-form { display: flex; gap: .875rem; width: 100%; max-width: 540px; }
        .wl-input { display: block; flex: 1; min-width: 0; width: 100%; height: 56px; padding: 0 1.25rem; background: #0d122b; border: 1px solid #1d2545; border-radius: 10px; color: #fff; font-family: inherit; font-size: 1rem; outline: none; transition: border-color .2s, box-shadow .2s; }
        .wl-input::placeholder { color: #4a5578; }
        .wl-input:focus { border-color: #384570; box-shadow: 0 0 0 3px rgba(56,69,112,.25); }
        .wl-input.error { border-color: #f87171; }
        .wl-join { flex-shrink: 0; height: 56px; padding: 0 2.25rem; background: #b8f041; color: #080c1d; border: none; border-radius: 10px; font-family: inherit; font-size: .9375rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; cursor: pointer; white-space: nowrap; transition: background-color .2s, transform .2s, opacity .2s; }
        .wl-join:hover { background: #a5d936; transform: translateY(-1px); }
        .wl-join:disabled { cursor: not-allowed; opacity: .7; transform: none; }
        .wl-feedback { margin-top: .875rem; font-size: .875rem; min-height: 20px; line-height: 1.5; color: #f87171; }
        @media (max-width: 1024px) {
          .wl-root { justify-content: center; padding: 4rem 2rem 2rem; }
          .wl-container { max-width: 560px; margin: 0 auto; text-align: center; }
          .wl-avatars { justify-content: center; gap: 1rem; margin-bottom: 1.75rem; }
          .wl-eyebrow { font-size: .65rem; margin-bottom: 1rem; }
          .wl-heading { font-size: clamp(2.25rem, 5.5vw, 3.25rem); margin-bottom: 1rem; }
          .wl-subtitle { max-width: 460px; margin: 0 auto 1.75rem; font-size: .95rem; }
          .wl-form { max-width: 420px; margin: 0 auto; gap: .65rem; }
        }
        @media (max-width: 640px) {
          .wl-root { padding: 4rem 1.25rem 2rem; }
          .wl-container { max-width: 420px; }
          .wl-avatars { gap: .65rem; margin-bottom: 1.5rem; }
          .wl-avatar { width: 44px; height: 58px; }
          .wl-eyebrow { font-size: .55rem; margin-bottom: .75rem; }
          .wl-heading { font-size: clamp(1.9rem, 7.5vw, 2.6rem); line-height: 1.2; letter-spacing: -.04em; margin-bottom: .85rem; overflow-wrap: normal; }
          .wl-pixel-our { font-size: .65em; } .wl-pixel-youre { font-size: .42em; }
          .wl-subtitle { max-width: 350px; margin: 0 auto 1.5rem; font-size: .875rem; }
          .wl-form { max-width: 340px; gap: .5rem; }
          .wl-input { height: 44px; padding: 0 .75rem; font-size: .8rem; border-radius: 8px; }
          .wl-join { height: 44px; padding: 0 .9rem; font-size: .7rem; letter-spacing: .03em; border-radius: 8px; }
          .wl-feedback { max-width: 340px; margin: .65rem auto 0; font-size: .75rem; }
          .wl-close { top: 10px; right: 10px; width: 36px; height: 36px; }
        }
        @media (prefers-reduced-motion: reduce) { .wl-avatar { animation: none; } }
      `}</style>

      <button type="button" className="wl-close" aria-label="Close" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>

      <main className={`wl-container ${submitted ? 'is-success' : ''}`}>
        <div className="wl-avatars" aria-hidden="true">
          {AVATARS.map((rects, index) => (
            <div className="wl-avatar" key={index}>
              <svg viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                {rects.map(([x, y, w, h, fill], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />)}
              </svg>
            </div>
          ))}
        </div>

        <span className="wl-eyebrow">{submitted ? "It's Official!" : 'Good things take time.'}</span>

        <h1 className="wl-heading">
          {submitted ? (
            <><span className="wl-pixel-youre">You’re </span> on the List.</>
          ) : (
            <>Join <span className="wl-pixel-our">our</span> Waitlist.</>
          )}
        </h1>

        <p className="wl-subtitle">
          {submitted
            ? "Keep an eye on your inbox! We'll hit you up when it's time. No Spam, No Cap."
            : 'Get notified when your selected TechLearn program opens for enrollment.'}
        </p>

        {!submitted && (
          <>
            <form className="wl-form" onSubmit={handleSubmit} noValidate>
              <input
                type="email"
                className={`wl-input ${error ? 'error' : ''}`}
                placeholder="Enter your email address"
                autoComplete="email"
                aria-label="Email address"
                aria-describedby="wl-feedback"
                aria-invalid={error ? 'true' : undefined}
                value={email}
                onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }}
                required
              />
              <button type="submit" className="wl-join" disabled={loading}>
                {loading ? 'JOINING...' : 'JOIN'}
              </button>
            </form>
            <div id="wl-feedback" className="wl-feedback" role="status" aria-live="polite">{error}</div>
          </>
        )}
      </main>
    </div>
  );
}
