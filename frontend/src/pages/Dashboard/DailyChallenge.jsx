import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Flame, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';
import { useUser } from '../../context/UserContext';
import heroBg from '../../assets/hero-bg.jpg';

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { latestDailyChallenge } = useUser();
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

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dailyChallengeHero = {
    title: 'Daily Challenge',
    xpReward: activeChallenge?.xpReward || activeChallenge?.points || 0,
    timeEstimate: activeChallenge?.durationMinutes ? `${activeChallenge.durationMinutes} mins` : '--',
    prompt:
      activeChallenge?.description ||
      activeChallenge?.summary ||
      "Gear up for today's algorithmic puzzle. Submit your solution within the time limit to earn bonus XP and maintain your streak.",
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 px-1 py-2"
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
                Latest Accuracy
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                {latestDailyChallenge ? `${latestDailyChallenge.accuracy || 0}%` : '--'}
              </p>
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

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="rounded-2xl flex flex-col justify-end relative overflow-hidden p-6 sm:p-8 md:p-10 min-h-[45vh] md:min-h-[350px] shadow-sm"
        >
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${heroBg})`,
              backgroundSize: 'cover',
              backgroundPosition: '65% center',
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />

          <div className="z-10 flex flex-col items-start text-left w-full mt-auto space-y-2.5 md:space-y-4 text-white">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
              <span className="text-[9px] sm:text-[10px] font-semibold text-white bg-white/16 backdrop-blur-md px-3 py-1 border border-white/20 rounded-full flex items-center gap-1.5 sm:gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{todayFormatted}</span>
                <span className="opacity-65 text-[8px] sm:text-[9px] tracking-[0.22em] uppercase font-bold shrink-0">IST</span>
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.24em] uppercase font-bold text-white bg-rose-500/72 backdrop-blur-md px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                Resets in 14h 22m
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-md leading-tight">
              {dailyChallengeHero.title}
            </h2>

            <p className="text-[13px] sm:text-sm text-white max-w-xl line-clamp-3 pb-1 drop-shadow-sm">
              {dailyChallengeHero.prompt}
            </p>

            <div className="flex items-center gap-5 mt-1.5">
              <div className="flex items-center gap-2 text-sm text-white">
                <Trophy className="text-amber-400 h-4 w-4" />
                <span>+{dailyChallengeHero.xpReward} XP</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white">
                <Clock className="text-sky-300 h-4 w-4" />
                <span>~{dailyChallengeHero.timeEstimate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startChallengeFlow}
              disabled={loadingChallenge || starting}
              className="mt-3 bg-white text-[#0a1128] px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 disabled:opacity-60 flex items-center gap-2"
            >
              {starting ? 'Opening...' : 'Start Challenge'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.section>
      </div>
    </UserSidebarLayout>
  );
}
