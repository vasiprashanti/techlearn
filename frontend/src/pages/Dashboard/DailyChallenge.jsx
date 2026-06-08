import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, Flame, Target, Trophy, HelpCircle, Code, ShieldCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { dailyChallengeAPI } from '../../services/dailyChallengeApi';
import { useUser } from '../../context/UserContext';

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

  const xpReward = activeChallenge?.xpReward || activeChallenge?.points || 0;
  const timeEstimate = activeChallenge?.durationMinutes ? `${activeChallenge.durationMinutes} mins` : '--';
  const prompt =
    activeChallenge?.description ||
    activeChallenge?.summary ||
    "Gear up for today's algorithmic puzzle. Submit your solution within the time limit to earn bonus XP and maintain your streak.";

  const stepList = [
    { title: 'Secure Entry', desc: 'Initialize context', icon: <Target className="w-4 h-4 text-blue-500" /> },
    { title: 'Identity', desc: 'OTP verification', icon: <ShieldCheck className="w-4 h-4 text-indigo-500" /> },
    { title: 'Ruleset', desc: 'Read requirements', icon: <FileText className="w-4 h-4 text-amber-500" /> },
    { title: 'Sandbox IDE', desc: 'Code submission', icon: <Code className="w-4 h-4 text-emerald-500" /> },
    { title: 'Trophy Room', desc: 'Score & XP rewards', icon: <Trophy className="w-4 h-4 text-rose-500" /> },
  ];

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-4 md:space-y-5">
        {/* Navigation & Header */}
        <div className="w-full text-left">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="mx-auto max-w-4xl pt-2 text-center md:pt-4"
        >
          <h1 className="font-press-start leading-normal">
            <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
              DAILY CHALLENGE
            </span>
          </h1>
        </motion.div>

        {/* Dynamic Metric Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="dashboard-surface p-3.5 flex items-center justify-between border border-[#c4e8ff]/20 dark:border-white/5 shadow-sm">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] sm:text-[10px] text-[#5278a5] dark:text-[#7db9e5] font-bold uppercase tracking-wider truncate">ACCURACY</p>
              <p className="text-lg sm:text-2xl font-bold text-[#0d2a57] dark:text-[#dff3ff] truncate">
                {latestDailyChallenge ? `${latestDailyChallenge.accuracy || 0}%` : '--'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="dashboard-surface p-3.5 flex items-center justify-between border border-[#c4e8ff]/20 dark:border-white/5 shadow-sm">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] sm:text-[10px] text-[#5278a5] dark:text-[#7db9e5] font-bold uppercase tracking-wider truncate">BOUNTY</p>
              <p className="text-lg sm:text-2xl font-bold text-[#0d2a57] dark:text-[#dff3ff] truncate">
                +{xpReward} XP
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
          </div>

          <div className="dashboard-surface p-3.5 flex items-center justify-between border border-[#c4e8ff]/20 dark:border-white/5 shadow-sm">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[9px] sm:text-[10px] text-[#5278a5] dark:text-[#7db9e5] font-bold uppercase tracking-wider truncate">ESTIMATE</p>
              <p className="text-lg sm:text-2xl font-bold text-[#0d2a57] dark:text-[#dff3ff] truncate">
                {timeEstimate}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </motion.div>

        {/* Side-by-Side Content Grid for Challenge Card & Pipeline Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start w-full">
          {/* Main Algorithmic Mission Card */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-9 dashboard-surface p-4 sm:p-5 border border-[#3C83F6]/20 shadow-md relative overflow-hidden group h-full flex flex-col justify-between"
          >
            {/* Subtle background glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl group-hover:bg-blue-500/15 dark:group-hover:bg-blue-500/8 transition-all duration-700 pointer-events-none" />

            {loadingChallenge ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <p className="text-xs text-[#5278a5] dark:text-[#7db9e5]">Retrieving today's agenda...</p>
              </div>
            ) : activeChallenge ? (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-[#3C83F6]/10 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-[9px] tracking-[0.25em] font-extrabold text-[#3C83F6] uppercase block">
                        TODAY'S MISSION
                      </span>
                      <div className="text-[10px] text-black/45 dark:text-white/45 font-medium">
                        {todayFormatted}
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#2f78e6] dark:text-[#7bb9e9] shadow-sm">
                      {activeChallenge.trackType || 'CODING'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#3C83F6] bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                        Day {activeChallenge.dayNumber || 1}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-[#0d2a57] dark:text-[#dff3ff] leading-snug">
                      {activeChallenge.questionTitle || activeChallenge.title || 'Daily Challenge'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#46658d] dark:text-[#9bc7e8] leading-relaxed font-light line-clamp-4">
                      {prompt}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {error && (
                    <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-800 dark:text-rose-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startChallengeFlow}
                    disabled={starting}
                    className="w-full bg-[#3C83F6] hover:bg-blue-600 active:bg-blue-700 text-white py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 hover:shadow-blue-500/30 border border-blue-400/25 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {starting ? 'Opening Portal...' : 'Start Daily Challenge'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <HelpCircle className="w-10 h-10 mx-auto text-[#5278a5] dark:text-[#7db9e5] opacity-50" />
                <p className="text-sm font-medium text-[#0d2a57] dark:text-[#dff3ff]">No Active Challenge Found</p>
                <p className="text-xs text-[#5278a5] dark:text-[#7db9e5]">There is no challenge configured for today yet. Check back soon!</p>
              </div>
            )}
          </motion.section>

          {/* Dynamic Progression Flow Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="md:col-span-3 dashboard-surface p-4 sm:p-5 border border-[#c4e8ff]/25 dark:border-white/5 h-full flex flex-col justify-between"
          >
            <div>
              <div className="mb-3">
                <h3 className="text-sm sm:text-base font-bold text-[#0d2a57] dark:text-[#dff3ff] tracking-wide uppercase">
                  Challenge Pipeline
                </h3>
                <p className="text-[10px] sm:text-xs text-[#5278a5] dark:text-[#7db9e5] mt-0.5">
                  Standard workflow progression
                </p>
              </div>

              <div className="relative pl-6 space-y-2.5 before:absolute before:left-[11px] before:top-2 before:bottom-3 before:w-[1.5px] before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-rose-500">
                {stepList.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-3 group">
                    {/* Node icon with ring */}
                    <div className="absolute -left-[25px] top-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#071330] border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm z-10 group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                    <div className="space-y-0.5 pl-1.5">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#0d2a57] dark:text-[#dff3ff] tracking-wide group-hover:text-blue-500 dark:group-hover:text-[#8fd9ff] transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-[#5278a5] dark:text-[#7db9e5] font-light">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </UserSidebarLayout>
  );
}
