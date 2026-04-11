import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, CalendarDays, Lock, Camera, 
  X, CheckCircle, Shield 
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import ScrollProgress from "../../components/ScrollProgress";

const AVATAR_COUNT = 8;
const AVATAR_PATH = "/profile_avatars";

// Helper function to get initial avatar
const getInitialAvatar = () => {
  const storedUser = JSON.parse(localStorage.getItem("userData"));
  if (storedUser?.photoUrl) {
    return storedUser.photoUrl;
  }
  return `${AVATAR_PATH}/avatar1.png`;
};

const Profile = () => {
  const { theme } = useTheme();
  const { user, isLoading } = useUser();
  
  const isDarkMode = theme === 'dark';
  
  // Avatar State
  const [selectedAvatar, setSelectedAvatar] = useState(getInitialAvatar);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(null);

  useEffect(() => {
    // Only update if there's no avatar already selected and user data is available
    const storedUser = JSON.parse(localStorage.getItem("userData"));
    if (storedUser?.photoUrl && selectedAvatar === `${AVATAR_PATH}/avatar1.png`) {
      setSelectedAvatar(storedUser.photoUrl);
    } else if (user?.photoUrl && !storedUser?.photoUrl && selectedAvatar === `${AVATAR_PATH}/avatar1.png`) {
      setSelectedAvatar(user.photoUrl);
    }
  }, [user?.photoUrl, selectedAvatar]);

  const handleAvatarSelect = async (avatarUrl) => {
    setSelectedAvatar(avatarUrl);
    setIsSelectingAvatar(false);

    try {
      // Get the user from localStorage
      const storedUser = JSON.parse(localStorage.getItem("userData"));

      if (!storedUser || !storedUser.id) {
        throw new Error("User ID not found in localStorage");
      }

      const userId = storedUser.id;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/users/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photoUrl: avatarUrl }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update avatar");
      }

      await res.json();

      // Update localStorage with new photoUrl
      const updatedUser = { ...storedUser, photoUrl: avatarUrl };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  // Get userData from localStorage for display
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const displayUser = user || userData;
  
  const userInitial = displayUser?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = displayUser?.firstName ? `${displayUser.firstName} ${displayUser.lastName || ''}` : 'Student';

  if (isLoading) {
    return (
      <div className={`flex min-h-screen w-full font-sans antialiased items-center justify-center ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />
         <div className="w-12 h-12 border-t-2 border-[#3C83F6] dark:border-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      <main className="flex-1 transition-all duration-700 ease-in-out z-10 pt-24 pb-12 px-6 md:px-12 lg:px-16">
        <div className="max-w-[1280px] mx-auto space-y-8">
          
          {/* Top Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-black/5 dark:border-white/5 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[#3C83F6] dark:text-white">
                My Profile.
              </h1>
              <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-2">
                Manage your personal information
              </p>
            </motion.div>

          </header>

          {/* Main Content Grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Column - Form/Info Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 space-y-8"
            >
              {/* Basic Info Card */}
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 md:p-12 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <h2 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 font-semibold">
                    Basic Info
                  </h2>
                  <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></div>
                </div>

                <div className="grid sm:grid-cols-2 gap-10">
                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">Full Name</p>
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white pl-7">
                      {displayUser?.firstName || "First"} {displayUser?.lastName || "Last"}
                    </p>
                  </div>

                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <CalendarDays className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">Date of Birth</p>
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white pl-7">
                      {displayUser?.dateOfBirth || "Not specified"}
                    </p>
                  </div>

                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">Gender</p>
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white pl-7 capitalize">
                      {displayUser?.gender || "Not specified"}
                    </p>
                  </div>

                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">Email Address</p>
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white pl-7">
                      {displayUser?.email || "No email provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Info Card */}
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 md:p-12 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <h2 className="text-xs tracking-widest uppercase text-black/50 dark:text-white/50 font-semibold">
                    Account Security
                  </h2>
                  <div className="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></div>
                </div>

                <div className="grid sm:grid-cols-2 gap-10">
                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">Username</p>
                    </div>
                    <p className="text-lg font-medium text-black dark:text-white pl-7">
                      {displayUser?.username || "Not specified"}
                    </p>
                  </div>

                  <div className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-4 h-4 text-[#3C83F6] dark:text-white" />
                      <p className="text-[10px] uppercase tracking-widest text-black/40 dark:text-white/40 font-semibold">Password</p>
                    </div>
                    <div className="flex items-center pl-7 gap-2">
                      <p className="text-lg font-medium text-black dark:text-white tracking-[0.2em]">
                        ••••••••
                      </p>
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 bg-black/5 dark:bg-white/5 rounded-full text-black/40 dark:text-white/40 font-bold ml-2">Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Avatar Profile display */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full lg:w-96 flex flex-col"
            >
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 md:p-12 rounded-[2rem] shadow-sm flex flex-col items-center relative overflow-hidden flex-1">
                
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#3C83F6]/10 to-transparent dark:from-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative mb-8 mt-4 group">
                  <div className="w-48 h-48 rounded-full p-1.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-400 shadow-xl">
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
                    className="absolute bottom-2 right-2 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-10"
                    title="Change Avatar"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-2xl font-medium text-black dark:text-white mb-1 tracking-tight text-center relative z-10">
                  {userName}
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full mt-2 relative z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                  <span className="text-[9px] uppercase tracking-widest text-black/60 dark:text-white/60 font-bold">
                    Student Account
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Avatar Selection Modal (Glassmorphism UI) */}
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
                  disabled={!pendingAvatar || pendingAvatar === selectedAvatar}
                  className="px-8 py-3.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;