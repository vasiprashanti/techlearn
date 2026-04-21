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
          className="rounded-3xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/95 to-[#d9efff]/90 p-8 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="brand-heading-primary font-poppins text-3xl md:text-4xl tracking-tight leading-none">
                Daily Challenge
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base text-[#4c6f9a] dark:text-[#7fb8e2]">
                Start today&apos;s challenge and follow the full flow: Entry → OTP → Instructions → Test → Result.
              </p>
            </div>
            <button
              type="button"
              onClick={startChallengeFlow}
              disabled={loadingChallenge || starting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#082a5d] shadow-md transition hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
            >
              {starting ? 'Opening...' : 'Start Daily Challenge'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#9fcfff]/45 bg-[#dbf1ff] px-4 py-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                <Flame className="h-4 w-4" />
                Current Streak
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Track in Result</p>
            </div>
            <div className="rounded-2xl border border-[#9fcfff]/45 bg-[#dbf1ff] px-4 py-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                <Target className="h-4 w-4" />
                Today Goal
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">1 Challenge</p>
            </div>
            <div className="rounded-2xl border border-[#9fcfff]/45 bg-[#dbf1ff] px-4 py-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
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
          className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
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
