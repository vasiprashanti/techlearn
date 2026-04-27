import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Flame, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';

export default function DailyChallenge() {
  const navigate = useNavigate();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadActiveChallenge = async () => {
      setLoadingChallenge(true);
      setError('');

      try {
        const response = await dailyChallengeAPI.getActive();
        if (cancelled) return;
        setActiveChallenge(response?.data || null);
      } catch (err) {
        if (!cancelled) {
          setActiveChallenge(null);
          setError(err.message || 'Unable to load active Daily Challenge.');
        }
      } finally {
        if (!cancelled) {
          setLoadingChallenge(false);
        }
      }
    };

    loadActiveChallenge();

    return () => {
      cancelled = true;
    };
  }, []);

  const startChallengeFlow = async () => {
    if (starting) return;

    setStarting(true);
    setError('');

    try {
      let challenge = activeChallenge;

      if (!challenge?.linkId) {
        const response = await dailyChallengeAPI.getActive();
        challenge = response?.data || null;
        setActiveChallenge(challenge);
      }

      if (!challenge?.linkId) {
        throw new Error('No active Daily Challenge is configured for today.');
      }

      navigate(`/daily-challenge/${challenge.linkId}`);
    } catch (err) {
      setError(err.message || 'Unable to start Daily Challenge.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="dashboard-surface dashboard-surface-strong p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="dashboard-page-title">
                Daily Challenge
              </h1>
              <p className="dashboard-page-subtitle mt-3 max-w-2xl">
                Start today&apos;s challenge and follow the full flow: Entry → OTP → Instructions → Test → Result.
              </p>
            </div>
            <button
              type="button"
              onClick={startChallengeFlow}
              disabled={loadingChallenge || starting}
              className="dashboard-primary-btn disabled:opacity-60"
            >
              {starting ? 'Opening...' : 'Start Daily Challenge'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="dashboard-inner-surface px-4 py-4">
              <div className="dashboard-micro-label flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Current Streak
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Track in Result</p>
            </div>
            <div className="dashboard-inner-surface px-4 py-4">
              <div className="dashboard-micro-label flex items-center gap-2">
                <Target className="h-4 w-4" />
                Today Goal
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">1 Challenge</p>
            </div>
            <div className="dashboard-inner-surface px-4 py-4">
              <div className="dashboard-micro-label flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                XP Reward
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                {activeChallenge ? 'On submit' : '--'}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="dashboard-surface p-6"
        >
          {loadingChallenge ? (
            <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">Loading active challenge...</p>
          ) : activeChallenge ? (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-[#4d6f9c] dark:text-[#7fb9e6]">Active for today</p>
              <h2 className="text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                {activeChallenge.questionTitle || activeChallenge.title || 'Daily Challenge'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                <span className="rounded-full border border-[#9fcfff]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#4f719c] dark:border-[#6bb8ec]/55 dark:text-[#8ac7f3]">
                  {activeChallenge.trackType || 'Track'}
                </span>
                <span>Day {activeChallenge.dayNumber || 1}</span>
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{activeChallenge.durationMinutes || 30} mins</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">No active Daily Challenge configured for today.</p>
          )}

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
        </motion.section>
      </div>
    </UserSidebarLayout>
  );
}
