import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe, Lock, MoonStar, ShieldCheck, UserRound } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

function Toggle({ checked, onChange, label, note }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#9fcfff]/50 bg-[#dbf1ff] p-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
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
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactorHint, setTwoFactorHint] = useState(true);

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="rounded-3xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/95 to-[#d9efff]/90 p-8 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="brand-heading-primary font-poppins text-3xl tracking-tight md:text-4xl">
                Dashboard Settings
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#4c6f9a] dark:text-[#7fb8e2] md:text-base">
                Manage your profile visibility, notifications, and learning preferences from one place.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#9fcfff]/60 bg-[#dbf1ff] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#4f719c] dark:border-[#6bb8ec]/55 dark:bg-[#0d366f] dark:text-[#8ac7f3]">
              Mock Settings
            </span>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70 lg:col-span-2"
          >
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
              <h2 className="text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Notifications</h2>
            </div>
            <div className="space-y-3">
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
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
          >
            <div className="mb-4 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
              <h2 className="text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Profile</h2>
            </div>
            <div className="space-y-3">
              <Toggle
                checked={privateProfile}
                onChange={() => setPrivateProfile((prev) => !prev)}
                label="Private Profile"
                note="Hide your public leaderboard profile from other learners."
              />
              <div className="rounded-xl border border-[#9fcfff]/50 bg-[#dbf1ff] p-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
                <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Display Name</p>
                <input
                  type="text"
                  value="Anike"
                  readOnly
                  className="mt-2 w-full rounded-lg border border-[#9fcfff]/70 bg-[#eaf7ff] px-3 py-2 text-sm text-[#234d81] outline-none dark:border-[#6bb8ec]/40 dark:bg-[#0a2f6f] dark:text-[#9cd6ff]"
                />
              </div>
            </div>
          </motion.article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
          >
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
              <h2 className="text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Security</h2>
            </div>
            <div className="space-y-3">
              <Toggle
                checked={twoFactorHint}
                onChange={() => setTwoFactorHint((prev) => !prev)}
                label="2FA Reminder"
                note="Show reminders to enable two-factor authentication for better account safety."
              />
              <button
                type="button"
                className="w-full rounded-xl border border-[#9fcfff]/70 bg-[#d5eeff] px-4 py-2.5 text-sm font-semibold text-[#17457e] transition hover:bg-[#c6e6ff] dark:border-[#6bb8ec]/45 dark:bg-[#0e376c] dark:text-[#9cd6ff] dark:hover:bg-[#13427f]"
              >
                Change Password
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
          >
            <div className="mb-4 flex items-center gap-2">
              <MoonStar className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
              <h2 className="text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Appearance</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#9fcfff]/50 bg-[#dbf1ff] p-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
                <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Theme</p>
                <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">Theme selection follows your global app preference.</p>
              </div>
              <button
                type="button"
                className="w-full rounded-xl border border-[#9fcfff]/70 bg-[#d5eeff] px-4 py-2.5 text-sm font-semibold text-[#17457e] transition hover:bg-[#c6e6ff] dark:border-[#6bb8ec]/45 dark:bg-[#0e376c] dark:text-[#9cd6ff] dark:hover:bg-[#13427f]"
              >
                Customize Accent Colors
              </button>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
          >
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
              <h2 className="text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Region & Language</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#9fcfff]/50 bg-[#dbf1ff] p-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
                <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Language</p>
                <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">English (Mock)</p>
              </div>
              <div className="rounded-xl border border-[#9fcfff]/50 bg-[#dbf1ff] p-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
                <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Time Zone</p>
                <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">Asia/Kolkata (Mock)</p>
              </div>
            </div>
          </motion.article>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2d7fe8] dark:text-[#8fd9ff]" />
                <p className="text-lg font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Save Mock Preferences</p>
              </div>
              <p className="mt-1 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">This page is mock-only and does not persist changes yet.</p>
            </div>
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#082a5d] shadow-md transition hover:scale-[1.02] hover:shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </motion.section>
      </div>
    </UserSidebarLayout>
  );
}
