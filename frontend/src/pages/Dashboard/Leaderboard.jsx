import { motion } from "framer-motion";
import { Trophy, Medal, Star, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import UserSidebarLayout from "../../components/Dashboard/UserSidebarLayout";
import leaderboardApi from "../../services/leaderboardApi";

const FALLBACK_AVATAR = "/profile_avatars/avatar1.png";

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState({
    entries: [],
    currentUser: null,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      setError("");

      try {
        const payload = await leaderboardApi.getLeaderboard(20);
        if (!isCancelled) {
          setLeaderboardData(payload);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || "Unable to load leaderboard.");
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

  const storedUser = JSON.parse(localStorage.getItem("userData") || "null");
  const userAvatar = storedUser?.photoUrl || user?.avatar || FALLBACK_AVATAR;
  const userName = user?.firstName || storedUser?.firstName || "Student";

  const entries = leaderboardData.entries || [];
  const currentUser = leaderboardData.currentUser;
  const podiumEntries = useMemo(() => entries.slice(0, 3), [entries]);
  const restOfList = useMemo(() => entries.slice(3), [entries]);

  const getPodiumStyles = (rank) => {
    if (rank === 1) return "h-48 bg-gradient-to-t from-[#f8df8b]/30 to-[#f8df8b]/10 border-[#f0c85f]/45 dark:from-[#7c6216]/35 dark:to-[#7c6216]/10 dark:border-[#f0c85f]/40";
    if (rank === 2) return "h-36 bg-gradient-to-t from-[#cbd7ea]/35 to-[#cbd7ea]/10 border-[#9eb4d3]/50 dark:from-[#5d6f89]/35 dark:to-[#5d6f89]/10 dark:border-[#9eb4d3]/45";
    if (rank === 3) return "h-28 bg-gradient-to-t from-[#e7b08c]/35 to-[#e7b08c]/10 border-[#cc885e]/50 dark:from-[#8a5538]/35 dark:to-[#8a5538]/10 dark:border-[#cc885e]/45";
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]";
    if (rank === 2) return "bg-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]";
    if (rank === 3) return "bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.4)]";
    return "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60";
  };

  const formatXp = (value) => `${Number(value || 0).toLocaleString()} XP`;

  const renderPodiumCard = (entry, rank, delay = 0) => {
    if (!entry) return null;

    const sizes = {
      1: "w-28 h-28",
      2: "w-20 h-20",
      3: "w-20 h-20",
    };

    const accent = {
      1: "border-yellow-500 bg-yellow-500 text-white",
      2: "border-slate-400 bg-slate-400 text-white",
      3: "border-amber-700 bg-amber-700 text-white",
    };

    return (
      <motion.div
        key={entry.userId}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className={`flex-1 flex flex-col items-center ${
          rank === 1 ? "order-1 md:order-2 z-10" : rank === 2 ? "order-2 md:order-1" : "order-3"
        }`}
      >
        <div className="relative mb-4">
          {rank === 1 ? (
            <Trophy className="w-8 h-8 text-yellow-500 absolute -top-10 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          ) : null}
          <div className={`${sizes[rank]} rounded-full border-4 p-1 overflow-hidden bg-white/10 backdrop-blur-sm ${accent[rank].split(" ")[0]}`}>
            <img src={entry.avatar || FALLBACK_AVATAR} alt={entry.name} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className={`absolute ${rank === 1 ? "-bottom-4 w-10 h-10 text-lg" : "-bottom-3 w-8 h-8"} left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-bold border-2 border-[#0a1128] ${accent[rank]}`}>
            {rank}
          </div>
        </div>
        <h3 className={`mt-${rank === 1 ? "3" : "2"} ${rank === 1 ? "text-base font-semibold" : "text-sm font-medium"} text-[#0d2a57] dark:text-[#8fd9ff]`}>
          {entry.name}
        </h3>
        <p className={`mb-4 ${rank === 1 ? "text-[11px] text-yellow-600 dark:text-yellow-500" : rank === 2 ? "text-[10px] text-[#5f82ac] dark:text-[#81bde6]" : "text-[10px] text-amber-700 dark:text-amber-500"} font-bold uppercase tracking-widest`}>
          {formatXp(entry.totalXp)}
        </p>
        <div className={`w-full ${rank === 1 ? "max-w-[160px] pt-6" : "max-w-[140px] pt-4"} rounded-t-2xl border-t border-x backdrop-blur-xl flex justify-center ${getPodiumStyles(rank)}`}>
          {rank === 1 ? (
            <Star className="w-8 h-8 text-yellow-500 opacity-50" />
          ) : (
            <Medal className={`w-6 h-6 ${rank === 2 ? "text-slate-400" : "text-amber-700"} opacity-50`} />
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
          
          {/* Top Header */}
          <header className="flex flex-col gap-4 border-b border-[#8ec8ff]/30 pb-6 dark:border-[#6fbfff]/25 md:flex-row md:items-end md:justify-between">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="brand-heading-primary font-poppins text-3xl tracking-tight md:text-4xl">
                Leaderboard.
              </h1>
              <p className="mt-2 text-xs uppercase tracking-widest text-[#4d6f9c] dark:text-[#7fb9e6]">
                Global Rankings & Achievements
              </p>
            </motion.div>

          </header>

          <div className="mx-auto max-w-6xl pt-8">
            {/* Top 3 Podium Section */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-20 mt-10 px-4">
              {renderPodiumCard(podiumEntries[1], 2, 0.2)}
              {renderPodiumCard(podiumEntries[0], 1, 0)}
              {renderPodiumCard(podiumEntries[2], 3, 0.4)}
            </div>

            {/* Current User Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
              className="mb-12 flex flex-col items-center justify-between gap-6 rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-4 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-2xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70 md:flex-row md:p-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[#2d7fe8] p-0.5 dark:border-[#8fd9ff]">
                  <img src={userAvatar} alt="Your Profile" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Your Ranking</p>
                  <h3 className="text-lg font-medium text-[#0d2a57] dark:text-[#8fd9ff]">
                    #{currentUser?.rank || "--"} <span className="ml-1 text-sm font-normal text-[#5f82ac] dark:text-[#81bde6]">in Global</span>
                  </h3>
                </div>
              </div>

              <div className="flex w-full justify-between gap-8 border-t border-[#86c4ff]/30 px-4 pt-4 md:w-auto md:justify-end md:gap-12 md:border-t-0 md:px-0 md:pt-0 dark:border-[#6fbfff]/25">
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]"><Zap className="h-3 w-3 text-[#2d7fe8] dark:text-[#8fd9ff]" /> Total XP</p>
                  <p className="text-lg font-medium text-[#0d2a57] dark:text-[#8fd9ff]">{Number(currentUser?.totalXp || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Participants</p>
                  <p className="text-lg font-medium text-[#0d2a57] dark:text-[#8fd9ff]">{Number(leaderboardData.totalParticipants || 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            {/* Full List Rankings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="overflow-hidden rounded-3xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
            >
              <div className="grid grid-cols-12 gap-4 border-b border-[#86c4ff]/35 bg-[#dbf1ff]/75 px-6 py-5 dark:border-[#6fbfff]/25 dark:bg-[#0d366f]/55 md:px-8">
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] md:col-span-1">Rank</div>
                <div className="col-span-6 text-[10px] font-bold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] md:col-span-5">Student</div>
                <div className="col-span-4 text-right text-[10px] font-bold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] md:col-span-3 md:text-left">Score</div>
                <div className="col-span-3 hidden text-[10px] font-bold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] md:block">Track</div>
              </div>

              <div className="divide-y divide-[#86c4ff]/30 dark:divide-[#6fbfff]/20">
                {loading ? (
                  <div className="px-6 py-10 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] md:px-8">
                    Loading leaderboard...
                  </div>
                ) : error ? (
                  <div className="px-6 py-10 text-sm text-red-500 md:px-8">{error}</div>
                ) : entries.length === 0 ? (
                  <div className="px-6 py-10 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] md:px-8">
                    No leaderboard activity yet.
                  </div>
                ) : restOfList.map((entry) => (
                  <div key={entry.userId} className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors duration-300 hover:bg-[#edf7ff]/75 dark:hover:bg-[#0a2f6f]/55 md:px-8">
                    <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </div>
                    
                    <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                      <img src={entry.avatar || FALLBACK_AVATAR} alt={entry.name} className="h-10 w-10 rounded-full border border-[#86c4ff]/45 object-cover dark:border-[#6fbfff]/35" />
                      <div>
                        <p className="text-sm font-medium text-[#0d2a57] dark:text-[#8fd9ff]">{entry.name}</p>
                        <p className="text-[10px] text-[#5f82ac] dark:text-[#81bde6] md:hidden">{entry.completedExercises} exercises completed</p>
                      </div>
                    </div>
                    
                    <div className="col-span-4 md:col-span-3 flex flex-col justify-center text-right md:text-left">
                      <span className="text-sm font-bold text-[#2d7fe8] dark:text-[#8fd9ff]">{formatXp(entry.totalXp)}</span>
                    </div>

                    <div className="col-span-3 hidden md:flex items-center">
                      <span className="rounded-full border border-[#86c4ff]/45 bg-[#dbf1ff] px-3 py-1 text-xs font-medium text-[#4c6f9a] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#7fb8e2]">
                        {entry.completedExercises} completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

        </div>
      </div>
    </UserSidebarLayout>
  );
};

export default Leaderboard;
