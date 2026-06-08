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
        const payload = await leaderboardApi.getLeaderboard(1000);
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
  let userAvatar = storedUser?.photoUrl || storedUser?.avatar || FALLBACK_AVATAR;
  if (userAvatar && userAvatar.includes('/profile_avatars/') && userAvatar.includes('nobackground')) {
    userAvatar = userAvatar.replace('/nobackgroundavatar', '/avatar');
  }

  const entries = useMemo(() => leaderboardData.entries || [], [leaderboardData.entries]);
  const currentUser = leaderboardData.currentUser;
  const topThree = useMemo(() => entries.slice(0, 3), [entries]);

  const getTrendIcon = (rank) => {
    if (rank <= 3) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rank >= 10) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-black/30 dark:text-white/30" />;
  };

  const getPodiumStyles = (rank) => {
    if (rank === 1) return 'h-20 md:h-28 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
    if (rank === 2) return 'h-12 md:h-20 bg-gradient-to-t from-slate-400/20 to-slate-400/5 border-slate-400/30';
    if (rank === 3) return 'h-8 md:h-16 bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-amber-700/30';
    return '';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]';
    if (rank === 2) return 'bg-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]';
    if (rank === 3) return 'bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.4)]';
    return 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60';
  };

  const normalizeAvatar = (avatar) => {
    if (avatar && avatar.includes('/profile_avatars/') && avatar.includes('nobackground')) {
      return avatar.replace('/nobackgroundavatar', '/avatar');
    }
    return avatar;
  };

  const renderPodiumUser = (entry, rank, delay = 0) => {
    if (!entry) return null;

    const avatar = normalizeAvatar(entry.avatar || entry.photoUrl || FALLBACK_AVATAR);

    return (
      <MotionDiv
        key={entry.userId || `${entry.rank}-${entry.name}`}
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`flex-1 flex flex-col items-center ${rank === 1 ? 'z-20' : 'z-10'}`}
      >
        <div className="relative mb-1 md:mb-2">
          {rank === 1 ? (
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 absolute -top-7 md:-top-8 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          ) : null}
          <div
            className={`${
              rank === 1 ? 'w-14 h-14 md:w-16 md:h-16 border-yellow-500' : 'w-10 h-10 md:w-12 md:h-12'
            } rounded-full border-[3px] ${
              rank === 2 ? 'border-slate-400' : rank === 3 ? 'border-amber-700' : ''
            } p-0.5 overflow-hidden shadow-lg bg-[#daf0fa] dark:bg-[#0f1f43]`}
          >
            <img src={avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
          </div>
          <div
            className={`absolute ${rank === 1 ? '-bottom-2 w-6 h-6 text-xs' : '-bottom-1.5 w-5 h-5 text-[10px]'} left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold border-2 border-[#0a1128] ${
              rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
            } text-white`}
          >
            {rank}
          </div>
        </div>
        <h3 className="text-[10px] md:text-xs font-semibold text-black dark:text-white mt-1 truncate max-w-full px-1">
          {entry.name.split(' ')[0]}
        </h3>
        <p
          className="text-[6.5px] md:text-[8px] font-press-start mb-1 md:mb-2 text-lavender"
        >
          {Number(entry.totalXp || 0).toLocaleString()} XP
        </p>
        <div
          className={`w-full ${rank === 1 ? 'max-w-[80px] md:max-w-[100px] pt-2 md:pt-3' : 'max-w-[64px] md:max-w-[80px] pt-1 md:pt-2'} rounded-t-lg md:rounded-t-xl border-t border-x backdrop-blur-xl flex justify-center ${getPodiumStyles(rank)}`}
        >
          {rank === 1 ? (
            <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 opacity-50" />
          ) : (
            <Medal className={`w-3.5 h-3.5 md:w-4 md:h-4 ${rank === 2 ? 'text-slate-400' : 'text-amber-700'} opacity-50`} />
          )}
        </div>
      </MotionDiv>
    );
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <ScrollProgress />
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        className={`flex flex-col items-center flex-1 transition-all duration-700 ease-in-out z-10 lg:ml-[90px] pt-24 pb-8 px-4 sm:px-6 md:px-10 lg:px-14 overflow-auto ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="w-full max-w-[1400px] space-y-4 md:space-y-5">
          <MotionDiv
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mx-auto max-w-4xl pt-2 text-center md:pt-4"
          >
            <h1 className="font-press-start leading-normal">
              <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
                LEADERBOARD
              </span>
            </h1>
          </MotionDiv>

          <div className="grid gap-4 pt-1 lg:grid-cols-2 lg:items-stretch">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex min-h-[220px] flex-row items-end justify-center gap-2 px-0 pt-10 sm:gap-4 md:min-h-[260px] lg:min-h-[280px] h-full"
            >
              {renderPodiumUser(topThree[1], 2, 0.2)}
              {renderPodiumUser(topThree[0], 1, 0)}
              {renderPodiumUser(topThree[2], 3, 0.4)}
            </MotionDiv>

            <div className="flex flex-col gap-4 h-full">
              <MotionDiv
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="dashboard-surface p-3 md:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-9 h-9 rounded-full border-2 border-[#3C83F6] dark:border-white overflow-hidden p-0.5 shrink-0 bg-[#daf0fa] dark:bg-[#0f1f43]">
                    <img src={userAvatar} alt="Your Profile" className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div>
                    <p className="font-press-start text-[8px] md:text-[9px] uppercase tracking-normal text-black/50 dark:text-white/50 mb-1">Your Ranking</p>
                    <h3 className="text-sm font-medium text-black dark:text-white">
                      #{currentUser?.rank || '--'} <span className="text-xs font-normal text-black/40 dark:text-white/40 ml-1">in Global</span>
                    </h3>
                  </div>
                </div>

                <div className="flex gap-4 w-full sm:w-auto px-1 sm:px-0 justify-between sm:justify-end border-t sm:border-t-0 border-black/5 dark:border-white/5 pt-2 sm:pt-0">
                  <div>
                    <p className="font-press-start text-[8px] md:text-[9px] uppercase tracking-normal text-black/50 dark:text-white/50 mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#3C83F6] dark:text-white" /> Total XP
                    </p>
                    <p className="text-xs md:text-sm font-press-start text-lavender">{Number(currentUser?.totalXp || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-press-start text-[8px] md:text-[9px] uppercase tracking-normal text-black/50 dark:text-white/50 mb-1">Participants</p>
                    <p className="text-sm font-bold text-black dark:text-white">{Number(leaderboardData.totalParticipants || 0).toLocaleString()}</p>
                  </div>
                </div>
              </MotionDiv>

              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="dashboard-surface overflow-hidden flex-1 flex flex-col"
              >
                <div className="overflow-x-auto w-full flex-1">
                  <div className="min-w-0 md:min-w-[550px] flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-4 px-4 md:px-5 py-2.5 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold font-sans">
                      <div className="w-12 shrink-0 text-center md:text-left">Rank</div>
                      <div className="flex-1">Student</div>
                      <div className="w-24 shrink-0 text-right md:text-left">Score</div>
                      <div className="w-28 shrink-0 text-right hidden md:block">Signal</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[70vh] overflow-y-auto flex-1">
                      {loading ? (
                        <div className="px-4 md:px-5 py-8 text-sm text-black/50 dark:text-white/50">Loading leaderboard...</div>
                      ) : error ? (
                        <div className="px-4 md:px-5 py-8 text-sm text-red-500">{error}</div>
                      ) : entries.length === 0 ? (
                        <div className="px-4 md:px-5 py-8 text-sm text-black/50 dark:text-white/50">No leaderboard activity yet.</div>
                      ) : entries.map((entry) => {
                        const avatar = normalizeAvatar(entry.avatar || entry.photoUrl || FALLBACK_AVATAR);

                        return (
                          <div key={entry.userId || `${entry.rank}-${entry.name}`} className="flex items-center gap-4 px-4 md:px-5 py-2.5 hover:bg-white/40 dark:hover:bg-black/40 transition-colors duration-300">
                            <div className="w-12 shrink-0 flex items-center justify-center md:justify-start gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold shrink-0 ${getRankBadge(entry.rank)}`}>
                                {entry.rank}
                              </span>
                              <div className="hidden sm:block shrink-0">{getTrendIcon(entry.rank)}</div>
                            </div>

                            <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-[#daf0fa] dark:bg-[#0f1f43] p-0.5 border border-black/10 dark:border-white/10 overflow-hidden shrink-0">
                                <img
                                  src={avatar}
                                  alt={entry.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs md:text-sm font-semibold text-black dark:text-white truncate">{entry.name}</p>
                                <p className="text-[9px] md:text-[10px] text-black/40 dark:text-white/40 md:hidden truncate mt-0.5">
                                  {entry.completedExercises || 0} completed
                                </p>
                              </div>
                            </div>

                            <div className="w-24 shrink-0 flex flex-col justify-center text-right md:text-left">
                              <span className="text-[7.5px] md:text-[10px] font-press-start text-lavender">
                                {Number(entry.totalXp || 0).toLocaleString()} XP
                              </span>
                            </div>

                            <div className="w-28 shrink-0 hidden md:flex items-center justify-end">
                              <span className="text-[9px] md:text-[10px] text-black/60 dark:text-white/60 font-medium px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full truncate border border-black/[0.03] dark:border-white/[0.03]">
                                {entry.completedExercises || 0} solved
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
