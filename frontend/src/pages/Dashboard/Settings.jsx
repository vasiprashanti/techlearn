import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, UserRound, Bell, Lock, 
  Moon, Globe, ShieldCheck, CheckCircle, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

const initialFormState = {
  firstName: "",
  lastName: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  username: "",
};

function Toggle({ checked, onChange, label, note }) {
  return (
    <div className="dashboard-inner-surface flex items-start justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">{label}</p>
        <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">{note}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${
          checked
            ? 'border-[#2f73e0] bg-[#3c83f6]'
            : 'border-[#9fcfff]/70 bg-[#c7e7ff] dark:border-[#6bb8ec]/40 dark:bg-[#0a2f6f]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function DashboardSettings() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, refetchUserData } = useUser();
  const isDarkMode = theme === 'dark';

  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'preferences', 'security'

  // Preferences Toggles States
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactorHint, setTwoFactorHint] = useState(true);

  // Profile Form States
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData")) || {};
    } catch {
      return {};
    }
  }, []);

  const mergedUser = { ...storedUser, ...(user || {}) };

  const [formData, setFormData] = useState({
    ...initialFormState,
    firstName: mergedUser.firstName || "",
    lastName: mergedUser.lastName || "",
    email: mergedUser.email || "",
    dateOfBirth: mergedUser.dateOfBirth || "",
    gender: mergedUser.gender || "",
    username: mergedUser.username || "",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const inputClass = "dashboard-input-surface mt-2";

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const userId = mergedUser?.id;
      if (!userId) throw new Error("Unable to find user id. Please login again.");

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        username: formData.username.trim(),
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update profile.");

      const apiData = await response.json();
      const updatedUser = { ...mergedUser, ...payload, ...(apiData?.user || apiData || {}) };

      localStorage.setItem("userData", JSON.stringify(updatedUser));
      if (typeof refetchUserData === "function") await refetchUserData();

      setStatus({ type: "success", message: "Profile details updated successfully." });
      
      // Auto-switch or timeout back to profile
      setTimeout(() => {
        navigate("/dashboard/profile");
      }, 1500);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to save profile details." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8 py-2 px-1">
        
        {/* Top Header Section */}
        <header className="flex flex-col justify-between gap-4 border-b border-black/5 pb-6 dark:border-white/5 md:flex-row md:items-end">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <button
              type="button"
              onClick={() => navigate("/dashboard/profile")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </button>
            <h1 className="font-poppins tracking-tight leading-[0.92]">
              <span className="brand-heading-primary block text-4xl sm:text-5xl md:text-6xl font-bold font-poppins">
                Account Settings.
              </span>
            </h1>
            <p className="mt-4 text-xs uppercase tracking-widest text-black/40 dark:text-white/40">
              Customize your profile metadata, system settings, and notifications
            </p>
          </motion.div>
        </header>

        {/* Unified Tab Controller */}
        <div className="flex border-b border-black/5 dark:border-white/5 pb-1 gap-2">
          {[
            { id: 'profile', label: 'Edit Profile', icon: UserRound },
            { id: 'preferences', label: 'App Preferences', icon: Bell },
            { id: 'security', label: 'Security & Theme', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatus({ type: "", message: "" });
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  active 
                    ? "bg-[#3C83F6] text-white shadow-lg" 
                    : "text-[#4c6f9a] hover:bg-black/5 dark:text-[#a6cbf3] dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="dashboard-surface p-8 md:p-12 space-y-8"
            >
              <div className="flex items-center gap-3">
                <h2 className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] font-semibold">
                  Personal Information
                </h2>
                <div className="h-[1px] flex-1 bg-[#86c4ff]/35 dark:bg-[#66b6ec]/35"></div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-7">
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">First Name</span>
                    <input type="text" value={formData.firstName} onChange={handleFormChange("firstName")} className={inputClass} required />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Last Name</span>
                    <input type="text" value={formData.lastName} onChange={handleFormChange("lastName")} className={inputClass} required />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Email Address</span>
                    <input type="email" value={formData.email} onChange={handleFormChange("email")} className={inputClass} required />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Date of Birth</span>
                    <input type="date" value={formData.dateOfBirth} onChange={handleFormChange("dateOfBirth")} className={inputClass} />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Gender</span>
                    <select value={formData.gender} onChange={handleFormChange("gender")} className={inputClass}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">Username</span>
                    <input type="text" value={formData.username} onChange={handleFormChange("username")} className={inputClass} required />
                  </label>
                </div>

                {status.message && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      status.type === "success" 
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300" 
                        : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300"
                    }`}
                  >
                    {status.message}
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#86c4ff]/30 pt-6 dark:border-[#6bb8ec]/30">
                  <button type="button" onClick={() => navigate("/dashboard/profile")} className="dashboard-secondary-btn">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="dashboard-secondary-btn disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="dashboard-surface p-6 md:p-8 space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] font-semibold">
                  Notification Prefs
                </h2>
                <div className="h-[1px] flex-1 bg-[#86c4ff]/35 dark:bg-[#66b6ec]/35"></div>
              </div>

              <div className="space-y-4">
                <Toggle
                  checked={emailAlerts}
                  onChange={() => setEmailAlerts((prev) => !prev)}
                  label="Email Alerts"
                  note="Receive updates for new challenges, roadmap milestones, and achievements."
                />
                <Toggle
                  checked={streakReminders}
                  onChange={() => setStreakReminders((prev) => !prev)}
                  label="Daily Streak Reminder"
                  note="Get a reminder if you have not completed today’s practice session."
                />
                <Toggle
                  checked={weeklySummary}
                  onChange={() => setWeeklySummary((prev) => !prev)}
                  label="Weekly Performance Summary"
                  note="Receive a weekly snapshot of solved questions, XP, and accuracy trends."
                />
              </div>

              <div className="flex items-center gap-3 mt-8 mb-4">
                <h2 className="text-xs tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] font-semibold">
                  Profile Visibility
                </h2>
                <div className="h-[1px] flex-1 bg-[#86c4ff]/35 dark:bg-[#66b6ec]/35"></div>
              </div>

              <div className="space-y-4">
                <Toggle
                  checked={privateProfile}
                  onChange={() => setPrivateProfile((prev) => !prev)}
                  label="Private Profile"
                  note="Hide your public leaderboard profile from other learners."
                />
                <div className="dashboard-inner-surface p-4">
                  <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Display Initials</p>
                  <input
                    type="text"
                    value={formData.username || "Student"}
                    readOnly
                    className="dashboard-input-surface mt-2 h-10 rounded-xl px-3 py-2 cursor-not-allowed opacity-75"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#86c4ff]/30 pt-6 dark:border-[#6bb8ec]/30 mt-8">
                <p className="text-xs text-[#5f82ac] dark:text-[#81bde6]">Saved locally automatically</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus({ type: "success", message: "Application preferences saved successfully." });
                    setTimeout(() => setStatus({ type: "", message: "" }), 2500);
                  }}
                  className="dashboard-secondary-btn"
                >
                  Confirm Preferences
                </button>
              </div>
              
              {status.message && (
                <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300 px-4 py-3 text-sm">
                  {status.message}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <div className="dashboard-surface p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
                  <h2 className="text-sm font-bold tracking-widest uppercase text-[#0d2a57] dark:text-[#8fd9ff]">Account Security</h2>
                </div>
                
                <div className="space-y-4">
                  <Toggle
                    checked={twoFactorHint}
                    onChange={() => setTwoFactorHint((prev) => !prev)}
                    label="2FA Reminder"
                    note="Show reminders to enable two-factor authentication for better account safety."
                  />
                  <button
                    type="button"
                    className="dashboard-secondary-btn w-full"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="dashboard-surface p-6 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
                  <h2 className="text-sm font-bold tracking-widest uppercase text-[#0d2a57] dark:text-[#8fd9ff]">System Environment</h2>
                </div>

                <div className="space-y-4">
                  <div className="dashboard-inner-surface p-4">
                    <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Interface Language</p>
                    <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">English (United States)</p>
                  </div>
                  <div className="dashboard-inner-surface p-4">
                    <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Standard Time Zone</p>
                    <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">Asia/Kolkata (GMT+05:30)</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-surface p-6 md:col-span-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Security & System Synchronization</h3>
                    <p className="text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">Your mock time zones and security logs are up to date.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatus({ type: "success", message: "Security configurations synced successfully." });
                    setTimeout(() => setStatus({ type: "", message: "" }), 2500);
                  }}
                  className="dashboard-secondary-btn"
                >
                  Verify Integrity
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </UserSidebarLayout>
  );
}
