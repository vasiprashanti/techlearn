import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Trophy, Medal, TrendingUp, TrendingDown, 
  Minus, Star, Zap
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Dashboard/Sidebar";
import ScrollProgress from "../../components/ScrollProgress";

// Mock Data for the Leaderboard
const mockLeaderboard = [
  { rank: 1, name: "Alex Chen", xp: 15450, avatar: "/profile_avatars/avatar1.png", trend: "up", level: "Diamond", track: "Full Stack" },
  { rank: 2, name: "Sarah Connor", xp: 14200, avatar: "/profile_avatars/avatar2.png", trend: "up", level: "Platinum", track: "Data Science" },
  { rank: 3, name: "David Kim", xp: 12850, avatar: "/profile_avatars/avatar3.png", trend: "down", level: "Platinum", track: "Frontend" },
  { rank: 4, name: "Emily Davis", xp: 11500, avatar: "/profile_avatars/avatar4.png", trend: "same", level: "Gold", track: "Backend" },
  { rank: 5, name: "Michael Chang", xp: 10900, avatar: "/profile_avatars/avatar5.png", trend: "up", level: "Gold", track: "Full Stack" },
  { rank: 6, name: "Jessica Smith", xp: 9200, avatar: "/profile_avatars/avatar6.png", trend: "down", level: "Silver", track: "Frontend" },
  { rank: 7, name: "Ryan Patel", xp: 8800, avatar: "/profile_avatars/avatar7.png", trend: "up", level: "Silver", track: "Data Science" },
  { rank: 8, name: "Amanda Lee", xp: 7500, avatar: "/profile_avatars/avatar8.png", trend: "same", level: "Bronze", track: "Backend" },
];

const Leaderboard = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const isDarkMode = theme === 'dark';
  
  const userName = user?.firstName ? user.firstName : 'Student';
  const userAvatar = JSON.parse(localStorage.getItem("userData"))?.photoUrl || "/profile_avatars/avatar1.png";

  const topThree = mockLeaderboard.slice(0, 3);
  const restOfList = mockLeaderboard.slice(3);

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-black/30 dark:text-white/30" />;
  };

  const getPodiumStyles = (rank) => {
    if (rank === 1) return "h-48 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
    if (rank === 2) return "h-36 bg-gradient-to-t from-slate-400/20 to-slate-400/5 border-slate-400/30";
    if (rank === 3) return "h-28 bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-amber-700/30";
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return "bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.4)]";
    if (rank === 2) return "bg-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]";
    if (rank === 3) return "bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.4)]";
    return "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60";
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      {/* Main Sidebar */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main className={`flex-1 transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} pt-24 pb-12 px-6 md:px-12 lg:px-16 overflow-auto`}>
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Top Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                Leaderboard.
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2">
                Global Rankings & Achievements
              </p>
            </motion.div>

          </header>

          <div className="max-w-5xl mx-auto pt-10">
            {/* Top 3 Podium Section */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-20 mt-10 px-4">
              {/* 2nd Place */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 flex flex-col items-center order-2 md:order-1"
              >
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-400 p-1 overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.3)] bg-white/10 backdrop-blur-sm">
                    <img src={topThree[1].avatar} alt={topThree[1].name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#0a1128]">2</div>
                </div>
                <h3 className="text-sm font-medium text-black dark:text-white mt-2">{topThree[1].name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-4">{topThree[1].xp} XP</p>
                <div className={`w-full max-w-[140px] rounded-t-2xl border-t border-x backdrop-blur-xl flex justify-center pt-4 ${getPodiumStyles(2)}`}>
                  <Medal className="w-6 h-6 text-slate-400 opacity-50" />
                </div>
              </motion.div>

              {/* 1st Place */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="flex-1 flex flex-col items-center order-1 md:order-2 z-10"
              >
                <div className="relative mb-4">
                  <Trophy className="w-8 h-8 text-yellow-500 absolute -top-10 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                  <div className="w-28 h-28 rounded-full border-4 border-yellow-500 p-1 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.4)] bg-white/10 backdrop-blur-sm">
                    <img src={topThree[0].avatar} alt={topThree[0].name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-[#0a1128]">1</div>
                </div>
                <h3 className="text-base font-semibold text-black dark:text-white mt-3">{topThree[0].name}</h3>
                <p className="text-[11px] uppercase tracking-widest text-yellow-600 dark:text-yellow-500 font-bold mb-4">{topThree[0].xp} XP</p>
                <div className={`w-full max-w-[160px] rounded-t-2xl border-t border-x backdrop-blur-xl flex justify-center pt-6 ${getPodiumStyles(1)}`}>
                  <Star className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                className="flex-1 flex flex-col items-center order-3"
              >
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-700 p-1 overflow-hidden shadow-[0_0_20px_rgba(180,83,9,0.3)] bg-white/10 backdrop-blur-sm">
                    <img src={topThree[2].avatar} alt={topThree[2].name} className="w-full h-full rounded-full object-cover" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#0a1128]">3</div>
                </div>
                <h3 className="text-sm font-medium text-black dark:text-white mt-2">{topThree[2].name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-600 font-bold mb-4">{topThree[2].xp} XP</p>
                <div className={`w-full max-w-[140px] rounded-t-2xl border-t border-x backdrop-blur-xl flex justify-center pt-4 ${getPodiumStyles(3)}`}>
                  <Medal className="w-6 h-6 text-amber-700 opacity-50" />
                </div>
              </motion.div>
            </div>

            {/* Current User Stats Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 rounded-2xl p-4 md:p-6 mb-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#3C83F6] dark:border-white overflow-hidden p-0.5">
                  <img src={userAvatar} alt="Your Profile" className="w-full h-full rounded-full object-cover" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1">Your Ranking</p>
                  <h3 className="text-lg font-medium text-black dark:text-white">#42 <span className="text-sm font-normal text-black/40 dark:text-white/40 ml-1">in Global</span></h3>
                </div>
              </div>

              <div className="flex gap-8 md:gap-12 w-full md:w-auto px-4 md:px-0 justify-between md:justify-end border-t md:border-t-0 border-black/5 dark:border-white/5 pt-4 md:pt-0">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-[#3C83F6] dark:text-white" /> Total XP</p>
                  <p className="text-lg font-medium text-black dark:text-white">2,450</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-semibold mb-1">To Next Rank</p>
                  <p className="text-lg font-medium text-black dark:text-white">150 <span className="text-xs text-black/40 dark:text-white/40">XP</span></p>
                </div>
              </div>
            </motion.div>

            {/* Full List Rankings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm"
            >
              <div className="grid grid-cols-12 gap-4 px-6 md:px-8 py-5 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                <div className="col-span-2 md:col-span-1 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Rank</div>
                <div className="col-span-6 md:col-span-5 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Student</div>
                <div className="col-span-4 md:col-span-3 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold text-right md:text-left">Score</div>
                <div className="col-span-3 hidden md:block text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">Track</div>
              </div>

              <div className="divide-y divide-black/5 dark:divide-white/5">
                {restOfList.map((user, index) => (
                  <div key={user.rank} className="grid grid-cols-12 gap-4 px-6 md:px-8 py-4 items-center hover:bg-white/40 dark:hover:bg-black/40 transition-colors duration-300">
                    <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(user.rank)}`}>
                        {user.rank}
                      </span>
                      {getTrendIcon(user.trend)}
                    </div>
                    
                    <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10" />
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">{user.name}</p>
                        <p className="text-[10px] text-black/40 dark:text-white/40 md:hidden">{user.track}</p>
                      </div>
                    </div>
                    
                    <div className="col-span-4 md:col-span-3 flex flex-col justify-center text-right md:text-left">
                      <span className="text-sm font-bold text-[#3C83F6] dark:text-white">{user.xp.toLocaleString()} XP</span>
                    </div>

                    <div className="col-span-3 hidden md:flex items-center">
                      <span className="text-xs text-black/60 dark:text-white/60 font-medium px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                        {user.track}
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