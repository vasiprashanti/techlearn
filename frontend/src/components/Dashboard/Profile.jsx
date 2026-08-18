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

      const updatedUser = { ...storedUser, photoUrl: avatarUrl, avatar: avatarUrl };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      
      if (refetchUserData) {
        await refetchUserData();
      }
      
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const displayUser = user || userData;
  
  const userName = displayUser?.firstName ? `${displayUser.firstName} ${displayUser.lastName || ''}` : 'Student';

  if (isLoading) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased items-center justify-center ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"}`} />
         <div className="w-10 h-10 border-t-2 border-[#3C83F6] dark:border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <ScrollProgress />
      <UserSidebarLayout maxWidthClass="max-w-4xl">
        <div className="space-y-3.5">
          
          {/* HEADING - PRESERVED ORIGINAL BRAND DESIGN */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl pt-1 text-center"
          >
            <h1 className="font-press-start leading-normal">
              <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
                MY PROFILE
              </span>
            </h1>
          </motion.div>

          {/* 1. SLEEK COMPACT HEADER BANNER CARD - SINGLE HORIZONTAL BALANCED LAYOUT */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            className="w-full relative overflow-hidden rounded-2xl bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-md"
          >
            {/* Sleek low-profile blue banner strip */}
            <div className="h-12 sm:h-14 w-full bg-gradient-to-r from-[#0052a3] via-[#0274c4] to-[#0091d9]" />

            {/* Profile Content Bar - Single Visually Balanced Horizontal Layout */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                {/* Avatar with intentional, balanced vertical overlap */}
                <div className="relative group shrink-0 -mt-8 sm:-mt-9">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-0.5 bg-white dark:bg-[#020b23] shadow-md">
                    <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-100 dark:bg-[#091842]">
                      <img
                        src={selectedAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSelectingAvatar(true)}
                    className="absolute -bottom-1 -right-1 bg-[#3C83F6] hover:bg-[#2563eb] text-white p-1 rounded-md shadow hover:scale-110 active:scale-95 transition-all duration-300 z-10"
                    title="Change Avatar"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                {/* User info & Badges vertically centered */}
                <div className="space-y-1 my-auto">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0d2a57] dark:text-white leading-tight">
                      {userName}
                    </h2>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {displayUser?.email || "No email provided"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[8px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      {displayUser?.role === 'admin' ? 'ADMIN ACCOUNT' : 'STUDENT ACCOUNT'}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[8px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-extrabold">
                      {displayUser?.programSelection || "Placement Sprint"}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[8px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-extrabold">
                      {Number(xp || 0).toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Settings Action Button - Vertically Aligned */}
              <button
                type="button"
                onClick={() => navigate('/dashboard/profile/settings')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0 cursor-pointer self-center"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Account Settings</span>
              </button>
            </div>
          </motion.div>

          {/* 2. COMPACT THREE STAT METRIC CARDS ROW */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
          >
            {/* Total XP Card */}
            <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm min-h-[75px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">TOTAL XP</span>
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                  <Zap className="w-3.5 h-3.5 animate-pulse" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#0d2a57] dark:text-white">
                {Number(xp || 0).toLocaleString()}
              </p>
            </div>

            {/* Exercises Card */}
            <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm min-h-[75px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">EXERCISES</span>
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                  <Award className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#0d2a57] dark:text-white">
                {progress?.completedExercises || 0} <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/ {progress?.totalExercises || 0}</span>
              </p>
            </div>

            {/* Course Progress Card */}
            <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm min-h-[75px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold font-sans">COURSE</span>
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {progress?.courseProgress || 0}%
                </p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progress?.courseProgress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. TWO-COLUMN COMPACT SECTION CARDS GRID */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full items-stretch"
          >
            {/* ROW 1 - CARD A: Account Profile */}
            <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-black/5 dark:border-white/5">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#0d2a57] dark:text-white">
                    Account Profile
                  </h3>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Full Name</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white truncate">
                      {displayUser?.firstName || "First"} {displayUser?.lastName || "Last"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Email Address</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white truncate">
                      {displayUser?.email || "No email provided"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Account Role</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white capitalize">
                      {displayUser?.role || "Student"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Password</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#0d2a57] dark:text-white tracking-[0.15em]">••••••••</span>
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold">ENCRYPTED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 1 - CARD B: Education & Enrollment */}
            <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between h-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1 border-b border-black/5 dark:border-white/5">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#0d2a57] dark:text-white">
                    Education & Enrollment
                  </h3>
                </div>

                <div className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">College</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white truncate">
                      {displayUser?.collegeName || "Not assigned"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Degree</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white truncate">
                      {displayUser?.degree || "Not assigned"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Branch / Stream</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white truncate">
                      {displayUser?.branch || "Not specified"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Graduation Year</span>
                    <span className="font-semibold text-[#0d2a57] dark:text-white">
                      {displayUser?.graduationYear || "Not specified"}
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Program Selection</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {displayUser?.programSelection || "Placement Sprint"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2 - CARD C: Goals & Placement Preferences */}
            {(displayUser?.learningGoal === "Get Placed" || Boolean(displayUser?.targetRole) || Boolean(displayUser?.placementCategory)) && (
              <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-1 border-b border-black/5 dark:border-white/5">
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0d2a57] dark:text-white">
                      Goals & Placement Preferences
                    </h3>
                  </div>

                  <div className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                    <div className="py-1.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Learning Goal</span>
                      <span className="font-semibold text-[#0d2a57] dark:text-white">
                        {displayUser?.learningGoal || "Not specified"}
                      </span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Target Role</span>
                      <span className="font-semibold text-[#0d2a57] dark:text-white">
                        {displayUser?.targetRole || displayUser?.otherTargetRole || "Not specified"}
                      </span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Opportunity Type</span>
                      <span className="font-semibold text-[#0d2a57] dark:text-white">
                        {displayUser?.placementCategory || "Not specified"}
                      </span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Placement Timeline</span>
                      <span className="font-semibold text-[#0d2a57] dark:text-white">
                        {displayUser?.placementTimeline || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROW 2 - CARD D: Target Companies & Skills Cards */}
            <div className="flex flex-col gap-3.5 justify-between h-full">
              {/* Target Companies */}
              {(displayUser?.learningGoal === "Get Placed" || Boolean(displayUser?.targetCompanies?.length)) && (
                <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 pb-1 border-b border-black/5 dark:border-white/5">
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0d2a57] dark:text-white">
                      Selected Target Companies
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {Array.isArray(displayUser?.targetCompanies) && displayUser.targetCompanies.length > 0 ? (
                      displayUser.targetCompanies.map((company, index) => (
                        <span key={index} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                          {company}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">None selected</p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills & Interests */}
              {(displayUser?.learningGoal === "Learn New Skills" || (Array.isArray(displayUser?.skills) && displayUser.skills.length > 0)) && (
                <div className="bg-white/80 dark:bg-[#061438]/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 pb-1 border-b border-black/5 dark:border-white/5">
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0d2a57] dark:text-white">
                      Skills & Interests
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {Array.isArray(displayUser?.skills) && displayUser.skills.length > 0 ? (
                      displayUser.skills.map((skill, index) => (
                        <span key={index} className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-300">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">No skills selected yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </UserSidebarLayout>

      <AnimatePresence>
        {isSelectingAvatar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSelectingAvatar(false)}
              className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white/95 dark:bg-[#0a1128]/95 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-xl mx-4 relative z-10"
            >
              <button
                onClick={() => setIsSelectingAvatar(false)}
                className="absolute top-5 right-5 w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors text-black/50 dark:text-white/50"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center mb-6 mt-1">
                <h3 className="text-xl font-medium text-black dark:text-white tracking-tight mb-1">
                  Choose Your Avatar
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">
                  Select a profile identity
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mb-8">
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
                          ? "scale-110 shadow-lg"
                          : "hover:scale-105 hover:shadow-md opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className={`p-0.5 rounded-full ${isSelected ? 'bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-400' : 'bg-transparent'}`}>
                        <img
                          src={avatarUrl}
                          alt={`Avatar ${i + 1}`}
                          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover bg-white dark:bg-black/50"
                          draggable={false}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#3C83F6] dark:bg-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#0a1128] shadow-sm">
                          <CheckCircle className="w-3 h-3 text-white dark:text-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center gap-3 border-t border-black/5 dark:border-white/5 pt-6">
                <button
                  onClick={() => setIsSelectingAvatar(false)}
                  className="px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAvatarSelect(pendingAvatar || selectedAvatar)}
                  disabled={!pendingAvatar || pendingAvatar.replace('nobackgroundavatar', 'avatar') === selectedAvatar.replace('nobackgroundavatar', 'avatar')}
                  className="px-6 py-2.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md cursor-pointer"
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
