import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Dashboard/Sidebar';
import ScrollProgress from '../../components/ScrollProgress';
import leaderboardApi from '../../services/leaderboardApi';

const FALLBACK_AVATAR = '/profile_avatars/avatar1.png';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState({
    entries: [],
    currentUser: null,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isDarkMode = theme === 'dark';

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
  const userAvatar = storedUser?.photoUrl || user?.avatar || FALLBACK_AVATAR;
  const userName = user?.firstName || storedUser?.firstName || 'Student';

  const entries = leaderboardData.entries || [];
  const currentUser = leaderboardData.currentUser;
  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const restOfList = useMemo(() => entries.slice(3), [entries]);

  const getTrendIcon = (rank) => {
    if (rank <= 3) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rank >= 10) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-black/30 dark:text-white/30" />;
  };

  const getPodiumStyles = (rank) => {
    if (rank === 1) return 'h-28 md:h-48 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
    if (rank === 2) return 'h-20 md:h-36 bg-gradient-to-t from-slate-400/20 to-slate-400/5 border-slate-400/30';
    if (rank === 3) return 'h-16 md:h-28 bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-amber-700/30';
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
      <motion.div
        key={entry.userId || `${entry.rank}-${entry.name}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`flex-1 flex flex-col items-center ${rank === 1 ? 'z-20' : 'z-10'}`}
      >
        <div className="relative mb-2 md:mb-4">
          {rank === 1 ? (
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 absolute -top-8 md:-top-10 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          ) : null}
          <div
            className={`${
              rank === 1 ? 'w-20 h-20 md:w-28 md:h-28 border-yellow-500' : 'w-14 h-14 md:w-20 md:h-20'
            } rounded-full border-[3px] md:border-4 ${
              rank === 2 ? 'border-slate-400' : rank === 3 ? 'border-amber-700' : ''
            } p-0.5 md:p-1 overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm`}
          >
            <img src={avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
          </div>
          <div
            className={`absolute ${rank === 1 ? '-bottom-3 md:-bottom-4 w-8 h-8 md:w-10 md:h-10 text-sm md:text-lg' : '-bottom-2 md:-bottom-3 w-6 h-6 md:w-8 md:h-8 text-xs md:text-base'} left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold border-2 border-[#0a1128] ${
              rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
            } text-white`}
          >
            {rank}
          </div>
        </div>
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-black dark:text-white mt-3 truncate max-w-full px-1">
          {entry.name.split(' ')[0]}
        </h3>
        <p
          className={`text-[9px] md:text-[11px] uppercase tracking-widest font-bold mb-2 md:mb-4 ${
            rank === 1 ? 'text-yellow-600 dark:text-yellow-500' : rank === 2 ? 'text-slate-500 dark:text-slate-400' : 'text-amber-700 dark:text-amber-600'
          }`}
        >
          {Number(entry.totalXp || 0).toLocaleString()} XP
        </p>
        <div
          className={`w-full ${rank === 1 ? 'max-w-[110px] md:max-w-[160px] pt-3 md:pt-6' : 'max-w-[90px] md:max-w-[140px] pt-2 md:pt-4'} rounded-t-xl md:rounded-t-2xl border-t border-x backdrop-blur-xl flex justify-center ${getPodiumStyles(rank)}`}
        >
          {rank === 1 ? (
            <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 opacity-50" />
          ) : (
            <Medal className={`w-4 h-4 md:w-6 md:h-6 ${rank === 2 ? 'text-slate-400' : 'text-amber-700'} opacity-50`} />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <ScrollProgress />
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />

      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-8 pb-12 px-4 sm:px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white truncate">
                Leaderboard.
              </h1>
              <p className="hidden sm:block text-[9px] md:text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2 truncate">
                Global Rankings & Achievements
              </p>
            </motion.div>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-shrink-0 relative z-30">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen((open) => !open)}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20 overflow-hidden"
                >
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                </button>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md overflow-hidden">
                            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-black dark:text-white truncate">{userName}</h3>
                            <p className="text-xs text-black/60 dark:text-white/60 truncate">{user?.email || 'student@techlearn.com'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            navigate('/dashboard/profile');
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                            <Star className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">My Profile</div>
                            <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                          </div>
                        </button>
                        <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10" />
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                            <Minus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">Log Out</div>
                            <div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out securely</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="max-w-5xl mx-auto pt-4 md:pt-10">
            <div className="flex flex-row justify-center items-end gap-2 sm:gap-4 md:gap-6 mb-12 md:mb-20 mt-8 md:mt-10 px-0 sm:px-4">
              {renderPodiumUser(topThree[1], 2, 0.2)}
              {renderPodiumUser(topThree[0], 1, 0)}
              {renderPodiumUser(topThree[2], 3, 0.4)}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 rounded-2xl p-4 md:p-6 mb-8 md:mb-12 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#3C83F6] dark:border-white overflow-hidden p-0.5 shrink-0">
                  <img src={userAvatar} alt="Your Profile" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1">Your Ranking</p>
                  <h3 className="text-base md:text-lg font-medium text-black dark:text-white">
                    #{currentUser?.rank || '--'} <span className="text-xs md:text-sm font-normal text-black/40 dark:text-white/40 ml-1">in Global</span>
                  </h3>
                </div>
              </div>

              <div className="flex gap-6 md:gap-12 w-full sm:w-auto px-2 sm:px-0 justify-between sm:justify-end border-t sm:border-t-0 border-black/5 dark:border-white/5 pt-4 sm:pt-0">
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#3C83F6] dark:text-white" /> Total XP
                  </p>
                  <p className="text-base md:text-lg font-medium text-black dark:text-white">{Number(currentUser?.totalXp || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1">Participants</p>
                  <p className="text-base md:text-lg font-medium text-black dark:text-white">{Number(leaderboardData.totalParticipants || 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm"
            >
              <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-8 py-4 md:py-5 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                <div className="col-span-2 md:col-span-1 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold text-center md:text-left">Rank</div>
                <div className="col-span-6 md:col-span-5 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Student</div>
                <div className="col-span-4 md:col-span-3 text-[9px] md:text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold text-right md:text-left">Score</div>
                <div className="col-span-3 hidden md:block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Signal</div>
              </div>

              <div className="divide-y divide-black/5 dark:divide-white/5">
                {loading ? (
                  <div className="px-4 md:px-8 py-10 text-sm text-black/50 dark:text-white/50">Loading leaderboard...</div>
                ) : error ? (
                  <div className="px-4 md:px-8 py-10 text-sm text-red-500">{error}</div>
                ) : entries.length === 0 ? (
                  <div className="px-4 md:px-8 py-10 text-sm text-black/50 dark:text-white/50">No leaderboard activity yet.</div>
                ) : restOfList.map((entry) => (
                  <div key={entry.userId || `${entry.rank}-${entry.name}`} className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-8 py-3 md:py-4 items-center hover:bg-white/40 dark:hover:bg-black/40 transition-colors duration-300">
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-start gap-1 md:gap-2">
                      <span className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold ${getRankBadge(entry.rank)}`}>
                        {entry.rank}
                      </span>
                      <div className="hidden sm:block">{getTrendIcon(entry.rank)}</div>
                    </div>

                    <div className="col-span-6 md:col-span-5 flex items-center gap-2 md:gap-4">
                      <img
                        src={entry.avatar || entry.photoUrl || FALLBACK_AVATAR}
                        alt={entry.name}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-black/10 dark:border-white/10 shrink-0"
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
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
