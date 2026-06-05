import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import ScrollProgress from '../../components/ScrollProgress';
import leaderboardApi from '../../services/leaderboardApi';

const FALLBACK_AVATAR = '/profile_avatars/avatar1.png';
const MotionDiv = motion.div;

const Leaderboard = () => {
  const { theme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({
    entries: [],
    currentUser: null,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await leaderboardApi.getLeaderboard(20);
        if (!isCancelled) {
          setLeaderboardData(payload);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message || 'Unable to load leaderboard.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      isCancelled = true;
    };
  }, []);

  const storedUser = JSON.parse(localStorage.getItem('userData') || 'null');
  const userAvatar = storedUser?.photoUrl || storedUser?.avatar || FALLBACK_AVATAR;

  const entries = useMemo(() => leaderboardData.entries || [], [leaderboardData.entries]);
  const currentUser = leaderboardData.currentUser;
  const topThree = useMemo(() => entries.slice(0, 3), [entries]);

  const getTrendIcon = (rank) => {
    if (rank <= 3) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rank >= 10) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-black/30 dark:text-white/30" />;
  };

  const getPodiumStyles = (rank) => {
    if (rank === 1) return 'h-24 md:h-32 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
    if (rank === 2) return 'h-[4.5rem] md:h-24 bg-gradient-to-t from-slate-400/20 to-slate-400/5 border-slate-400/30';
    if (rank === 3) return 'h-16 md:h-20 bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-amber-700/30';
    return '';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]';
    if (rank === 2) return 'bg-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]';
    if (rank === 3) return 'bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.4)]';
    return 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60';
  };

  const renderPodiumUser = (entry, rank, delay = 0) => {
    if (!entry) return null;

    const avatar = entry.avatar || entry.photoUrl || FALLBACK_AVATAR;

    return (
      <MotionDiv
        key={entry.userId || `${entry.rank}-${entry.name}`}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`flex-1 flex flex-col items-center ${rank === 1 ? 'z-20' : 'z-10'}`}
      >
        <div className="relative mb-2 md:mb-3">
          {rank === 1 ? (
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 absolute -top-7 md:-top-8 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          ) : null}
          <div
            className={`${
              rank === 1 ? 'w-16 h-16 md:w-20 md:h-20 border-yellow-500' : 'w-12 h-12 md:w-16 md:h-16'
            } rounded-full border-[3px] ${
              rank === 2 ? 'border-slate-400' : rank === 3 ? 'border-amber-700' : ''
            } p-0.5 md:p-1 overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm`}
          >
            <img src={avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
          </div>
          <div
            className={`absolute ${rank === 1 ? '-bottom-3 w-8 h-8 text-sm' : '-bottom-2 w-6 h-6 md:w-7 md:h-7 text-xs'} left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold border-2 border-[#0a1128] ${
              rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
            } text-white`}
          >
            {rank}
          </div>
        </div>
        <h3 className="text-xs md:text-sm font-semibold text-black dark:text-white mt-2 truncate max-w-full px-1">
          {entry.name.split(' ')[0]}
        </h3>
        <p
          className={`text-[9px] uppercase tracking-widest font-bold mb-2 md:mb-3 ${
            rank === 1 ? 'text-yellow-600 dark:text-yellow-500' : rank === 2 ? 'text-slate-500 dark:text-slate-400' : 'text-amber-700 dark:text-amber-600'
          }`}
        >
          {Number(entry.totalXp || 0).toLocaleString()} XP
        </p>
        <div
          className={`w-full ${rank === 1 ? 'max-w-[100px] md:max-w-[128px] pt-3 md:pt-4' : 'max-w-[82px] md:max-w-[108px] pt-2 md:pt-3'} rounded-t-xl md:rounded-t-2xl border-t border-x backdrop-blur-xl flex justify-center ${getPodiumStyles(rank)}`}
        >
          {rank === 1 ? (
            <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 opacity-50" />
          ) : (
            <Medal className={`w-4 h-4 md:w-5 md:h-5 ${rank === 2 ? 'text-slate-400' : 'text-amber-700'} opacity-50`} />
          )}
        </div>
      </MotionDiv>
    );
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <ScrollProgress />
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-[#020816]' : 'bg-gradient-to-br from-[#bceaff] via-[#9adfff] to-[#bceaff]'}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        className={`flex flex-col items-center flex-1 transition-all duration-700 ease-in-out z-10 lg:ml-[90px] pt-28 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-auto ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="w-full max-w-[1400px] space-y-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <MotionDiv initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="min-w-0">
              <h1 className="mt-8 font-poppins tracking-tight leading-[0.92]">
                <span className="block italic text-4xl sm:text-5xl md:text-6xl brand-heading-primary">
                  LEADERBOARD
                </span>
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-4">
                Global Rankings & Achievements
              </p>
            </MotionDiv>
          </header>
          <div className="grid gap-6 pt-4 lg:grid-cols-2 lg:items-start">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="dashboard-surface p-4 md:p-5"
            >
              <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold">
                    Top 3 Podium
                  </p>
                  <h2 className="mt-1 text-base md:text-lg font-semibold text-[#00113b] dark:text-white">
                    Compact Ranking Stage
                  </h2>
                </div>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>

              <div className="flex min-h-[280px] flex-row items-end justify-center gap-2 px-0 pt-8 sm:gap-4 md:min-h-[340px] lg:min-h-[360px] xl:min-h-[380px]">
                {renderPodiumUser(topThree[1], 2, 0.2)}
                {renderPodiumUser(topThree[0], 1, 0)}
                {renderPodiumUser(topThree[2], 3, 0.4)}
              </div>
            </MotionDiv>

            <div className="space-y-4">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="dashboard-surface p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full border-2 border-[#3C83F6] dark:border-white overflow-hidden p-0.5 shrink-0">
                    <img src={userAvatar} alt="Your Profile" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1">Your Ranking</p>
                    <h3 className="text-base font-medium text-black dark:text-white">
                      #{currentUser?.rank || '--'} <span className="text-xs font-normal text-black/40 dark:text-white/40 ml-1">in Global</span>
                    </h3>
                  </div>
                </div>

                <div className="flex gap-6 w-full sm:w-auto px-2 sm:px-0 justify-between sm:justify-end border-t sm:border-t-0 border-black/5 dark:border-white/5 pt-4 sm:pt-0">
                  <div>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#3C83F6] dark:text-white" /> Total XP
                    </p>
                    <p className="text-base font-medium text-black dark:text-white">{Number(currentUser?.totalXp || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1">Participants</p>
                    <p className="text-base font-medium text-black dark:text-white">{Number(leaderboardData.totalParticipants || 0).toLocaleString()}</p>
                  </div>
                </div>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="dashboard-surface overflow-hidden"
              >
                <div className="grid grid-cols-12 gap-2 md:gap-3 px-4 md:px-5 py-3 md:py-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                  <div className="col-span-2 md:col-span-1 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold text-center md:text-left">Rank</div>
                  <div className="col-span-6 md:col-span-5 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Student</div>
                  <div className="col-span-4 md:col-span-3 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold text-right md:text-left">Score</div>
                  <div className="col-span-3 hidden md:block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Signal</div>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {loading ? (
                    <div className="px-4 md:px-5 py-10 text-sm text-black/50 dark:text-white/50">Loading leaderboard...</div>
                  ) : error ? (
                    <div className="px-4 md:px-5 py-10 text-sm text-red-500">{error}</div>
                  ) : entries.length === 0 ? (
                    <div className="px-4 md:px-5 py-10 text-sm text-black/50 dark:text-white/50">No leaderboard activity yet.</div>
                  ) : entries.map((entry) => (
                    <div key={entry.userId || `${entry.rank}-${entry.name}`} className="grid grid-cols-12 gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3 items-center hover:bg-white/40 dark:hover:bg-black/40 transition-colors duration-300">
                      <div className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-start gap-1 md:gap-2">
                        <span className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${getRankBadge(entry.rank)}`}>
                          {entry.rank}
                        </span>
                        <div className="hidden sm:block">{getTrendIcon(entry.rank)}</div>
                      </div>

                      <div className="col-span-6 md:col-span-5 flex items-center gap-2 md:gap-3">
                        <img
                          src={entry.avatar || entry.photoUrl || FALLBACK_AVATAR}
                          alt={entry.name}
                          className="w-8 h-8 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-black dark:text-white truncate">{entry.name}</p>
                          <p className="text-[9px] md:text-[10px] text-black/40 dark:text-white/40 md:hidden truncate">
                            {entry.completedExercises || 0} completed
                          </p>
                        </div>
                      </div>

                      <div className="col-span-4 md:col-span-3 flex flex-col justify-center text-right md:text-left">
                        <span className="text-xs md:text-sm font-bold text-[#3C83F6] dark:text-white">
                          {Number(entry.totalXp || 0).toLocaleString()} XP
                        </span>
                      </div>

                      <div className="col-span-3 hidden md:flex items-center">
                        <span className="text-[10px] md:text-xs text-black/60 dark:text-white/60 font-medium px-2 md:px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full truncate">
                          {entry.completedExercises || 0} completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </MotionDiv>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
