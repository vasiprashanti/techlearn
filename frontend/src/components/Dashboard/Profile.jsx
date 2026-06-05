import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Lock, Camera,
  X, CheckCircle, Settings,
  Award, Zap, BookOpen, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import ScrollProgress from "../../components/ScrollProgress";
import UserSidebarLayout from "./UserSidebarLayout";

const AVATAR_COUNT = 8;
const AVATAR_PATH = "/profile_avatars";

const getInitialAvatar = () => {
  const storedUser = JSON.parse(localStorage.getItem("userData"));
  if (storedUser?.photoUrl) {
    let url = storedUser.photoUrl;
    if (url && !url.includes('/profile_avatars/')) {
      url = `${AVATAR_PATH}/avatar1.png`;
    }
    if (url.includes('/profile_avatars/') && url.includes('nobackground')) {
      url = url.replace('/nobackgroundavatar', '/avatar');
    }
    return url;
  }
  return `${AVATAR_PATH}/avatar1.png`;
};

const Profile = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isLoading, refetchUserData, xp, progress } = useUser();
  
  const isDarkMode = theme === 'dark';
  
  // Avatar State
  const [selectedAvatar, setSelectedAvatar] = useState(getInitialAvatar);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (hasInitialized) return;
    const storedUser = JSON.parse(localStorage.getItem("userData"));
    let activePhoto = user?.photoUrl || storedUser?.photoUrl;
    if (activePhoto) {
      let url = activePhoto;
      if (url && !url.includes('/profile_avatars/')) {
        url = `${AVATAR_PATH}/avatar1.png`;
      }
      if (url.includes('/profile_avatars/') && url.includes('nobackground')) {
        url = url.replace('/nobackgroundavatar', '/avatar');
      }
      setSelectedAvatar(url);
      setHasInitialized(true);
    }
  }, [user?.photoUrl, hasInitialized]);

  const handleAvatarSelect = async (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setIsSelectingAvatar(false);

    try {
      // Get the user from localStorage
      const storedUser = JSON.parse(localStorage.getItem("userData"));

      if (!storedUser || !storedUser.id) {
        throw new Error("User ID not found in localStorage");
      }

      const token = localStorage.getItem("token");
      const userId = storedUser.id;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ photoUrl: avatarUrl }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update avatar");
      }

      await res.json();

      // Update localStorage with new photoUrl and avatar
      const updatedUser = { ...storedUser, photoUrl: avatarUrl, avatar: avatarUrl };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      
      if (refetchUserData) {
        await refetchUserData();
      }
      
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  // Get userData from localStorage for display
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const displayUser = user || userData;
  
  const userInitial = displayUser?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = displayUser?.firstName ? `${displayUser.firstName} ${displayUser.lastName || ''}` : 'Student';
  const dashboardCardClass = "dashboard-surface p-5 md:p-7";

  if (isLoading) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased items-center justify-center ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"}`} />
         <div className="w-12 h-12 border-t-2 border-[#3C83F6] dark:border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollProgress />
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="space-y-8">
          
          <motion.header
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mx-auto max-w-4xl pt-8 text-center md:pt-10"
          >
            <h1 className="font-press-start leading-normal">
              <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
                MY PROFILE
              </span>
            </h1>
          </motion.header>

          {/* Main Content Grid (Responsive two-column grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 w-full lg:items-stretch">
            
            {/* Left Column - Info & Security Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full order-2 lg:order-1 flex flex-col h-full"
            >
              {/* Account Details Card */}
              <div className={`${dashboardCardClass} flex-1 flex flex-col justify-between gap-8 h-full`}>
                {/* Account Details Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-[10px] tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] font-bold">
                      Account Profile
                    </h2>
                    <div className="h-[1px] flex-1 bg-[#86c4ff]/35 dark:bg-[#66b6ec]/35"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/10 flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#dbf1ff] dark:bg-[#0d366f] text-[#2d7fe8] dark:text-[#8fd9ff] shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] font-bold mb-1">Full Name</p>
                        <p className="text-sm font-semibold text-[#0d2a57] dark:text-white truncate">
                          {displayUser?.firstName || "First"} {displayUser?.lastName || "Last"}
                        </p>
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/10 flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#dbf1ff] dark:bg-[#0d366f] text-[#2d7fe8] dark:text-[#8fd9ff] shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] font-bold mb-1">Email Address</p>
                        <p className="text-sm font-semibold text-[#0d2a57] dark:text-white truncate">
                          {displayUser?.email || "No email provided"}
                        </p>
                      </div>
                    </div>

                    {/* Account Type / Role */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/10 flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#dbf1ff] dark:bg-[#0d366f] text-[#2d7fe8] dark:text-[#8fd9ff] shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] font-bold mb-1">Account Role</p>
                        <p className="text-sm font-semibold text-[#0d2a57] dark:text-white capitalize">
                          {displayUser?.role || "Student"}
                        </p>
                      </div>
                    </div>

                    {/* Security / Password */}
                    <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 transition-all duration-300 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/10 dark:hover:border-white/10 flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-[#dbf1ff] dark:bg-[#0d366f] text-[#2d7fe8] dark:text-[#8fd9ff] shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6] font-bold mb-1">Password</p>
                        <div className="flex items-center gap-2 justify-between">
                          <p className="text-sm font-semibold text-[#0d2a57] dark:text-white tracking-[0.25em]">
                            ••••••••
                          </p>
                          <span className="rounded-full border border-[#86c4ff]/50 bg-[#dbf1ff] px-2 py-0.5 text-[8px] uppercase tracking-widest text-[#4d6f9c] dark:border-[#6bb8ec]/40 dark:bg-[#0d366f] dark:text-[#8ac7f3] font-bold">Secure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Summary Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-[10px] tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] font-bold">
                      Learning Overview
                    </h2>
                    <div className="h-[1px] flex-1 bg-[#86c4ff]/35 dark:bg-[#66b6ec]/35"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* XP Stats */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase tracking-widest text-amber-700 dark:text-yellow-500 font-bold">Total XP</span>
                        <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                      </div>
                      <p className="text-xl font-black text-amber-850 dark:text-yellow-400">
                        {Number(xp || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Exercises Solved */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase tracking-widest text-[#2d7fe8] dark:text-[#8fd9ff] font-bold">Exercises</span>
                        <Award className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-xl font-black text-[#0d2a57] dark:text-[#8fd9ff]">
                        {progress?.completedExercises || 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {progress?.totalExercises || 0}</span>
                      </p>
                    </div>

                    {/* Course Progress */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">Course</span>
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-emerald-800 dark:text-emerald-400">
                          {progress?.courseProgress || 0}%
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progress?.courseProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Avatar Profile display */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full flex flex-col order-1 lg:order-2 lg:h-full"
            >
              <div className={`${dashboardCardClass} flex flex-col items-center justify-center relative overflow-hidden lg:h-full`}>
                
                {/* Decorative background blur */}
                <div className="absolute -mr-20 -mt-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#53b6ff]/20 to-transparent blur-3xl dark:from-[#8fd9ff]/15 top-0 right-0"></div>

                <div className="relative mb-6 mt-2 group">
                  <div className="w-40 h-40 rounded-full p-1.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-400 shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-black border-4 border-transparent">
                      <img
                        src={selectedAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsSelectingAvatar(true)}
                    className="absolute bottom-2 right-2 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-10"
                    title="Change Avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="relative z-10 mb-1 text-center text-xl font-medium tracking-tight text-[#0d2a57] dark:text-[#8fd9ff]">
                  {userName}
                </h2>
                <div className="relative z-10 mt-2 inline-flex items-center gap-2 rounded-full border border-[#86c4ff]/50 bg-[#dbf1ff] px-3 py-1 dark:border-[#6bb8ec]/40 dark:bg-[#0d366f]">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                  <span className="text-[9px] uppercase tracking-widest text-[#4d6f9c] dark:text-[#8ac7f3] font-bold">
                    Student Account
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard/profile/settings')}
                  className="relative z-10 mt-5 mx-auto inline-flex w-fit items-center gap-2 rounded-xl bg-[#00113b] px-5 py-2.5 text-sm font-semibold text-[#daf0fa] shadow-md shadow-[#00113b]/15 transition hover:bg-[#001b5c] dark:bg-[#00113b] dark:text-[#daf0fa] dark:hover:bg-[#001b5c]"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </UserSidebarLayout>

      <AnimatePresence>
        {isSelectingAvatar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSelectingAvatar(false)}
              className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/95 dark:bg-[#0a1128]/95 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl w-full max-w-2xl mx-4 relative z-10"
            >
              <button
                onClick={() => setIsSelectingAvatar(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-black/50 dark:text-white/50"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center mb-8 mt-2">
                <h3 className="text-2xl font-medium text-black dark:text-white tracking-tight mb-2">
                  Choose Your Avatar
                </h3>
                <p className="text-[11px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">
                  Select a profile identity
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 mb-10">
                {Array.from({ length: AVATAR_COUNT }, (_, i) => {
                  const avatarUrl = `${AVATAR_PATH}/avatar${i + 1}.png`;
                  const isSelected = avatarUrl === (pendingAvatar || selectedAvatar);

                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setPendingAvatar(avatarUrl)}
                      className={`relative rounded-full focus:outline-none transition-all duration-300 ${
                        isSelected
                          ? "scale-110 shadow-xl"
                          : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className={`p-1 rounded-full ${isSelected ? 'bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-400' : 'bg-transparent'}`}>
                        <img
                          src={avatarUrl}
                          alt={`Avatar ${i + 1}`}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover bg-white dark:bg-black/50"
                          draggable={false}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#3C83F6] dark:bg-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a1128] shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-white dark:text-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 border-t border-black/5 dark:border-white/5 pt-8">
                <button
                  onClick={() => setIsSelectingAvatar(false)}
                  className="px-8 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAvatarSelect(pendingAvatar || selectedAvatar)}
                  disabled={!pendingAvatar || pendingAvatar.replace('nobackgroundavatar', 'avatar') === selectedAvatar.replace('nobackgroundavatar', 'avatar')}
                  className="px-8 py-3.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;
