import { motion } from 'framer-motion';
import { BarChart3, Clock3, Target, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

const kpis = [
  {
    label: 'Weekly Accuracy',
    value: '78%',
    note: '+6% from last week',
    icon: Target,
  },
  {
    label: 'Questions Solved',
    value: '164',
    note: '42 this week',
    icon: Trophy,
  },
  {
    label: 'Avg Solve Time',
    value: '21m',
    note: '-3m improvement',
    icon: Clock3,
  },
  {
    label: 'XP Growth',
    value: '+1,320',
    note: 'Top 18% this month',
    icon: TrendingUp,
  },
];

const weeklyConsistency = [
  { day: 'Mon', score: 62 },
  { day: 'Tue', score: 78 },
  { day: 'Wed', score: 74 },
  { day: 'Thu', score: 90 },
  { day: 'Fri', score: 68 },
  { day: 'Sat', score: 54 },
  { day: 'Sun', score: 82 },
];

const trackBreakdown = [
  { track: 'DSA', solved: 62, accuracy: 81 },
  { track: 'SQL', solved: 38, accuracy: 73 },
  { track: 'Core CS', solved: 31, accuracy: 76 },
  { track: 'Aptitude', solved: 33, accuracy: 84 },
];

const recentSessions = [
  { id: 's1', title: 'Binary Search Variants', type: 'DSA', accuracy: '80%', time: '26m', xp: '+140' },
  { id: 's2', title: 'Window Functions', type: 'SQL', accuracy: '70%', time: '18m', xp: '+100' },
  { id: 's3', title: 'OS Scheduling Quiz', type: 'Core CS', accuracy: '90%', time: '16m', xp: '+160' },
  { id: 's4', title: 'Profit & Loss Drill', type: 'Aptitude', accuracy: '85%', time: '20m', xp: '+120' },
];

export default function Performance() {
  const navigate = useNavigate();

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="px-1 py-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="dashboard-page-title">
                Performance Overview
              </h1>
              <p className="dashboard-page-subtitle max-w-2xl">
                Track your consistency, accuracy, and growth across all practice tracks with a single student performance snapshot.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/leaderboard')}
              className="dashboard-primary-btn"
            >
              View Leaderboard
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.04 }}
          className="dashboard-surface p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="dashboard-inner-surface px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">{item.label}</p>
                    <Icon className="h-4 w-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">{item.value}</p>
                  <p className="mt-1 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">{item.note}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-5">
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="dashboard-surface p-6 lg:col-span-3 flex min-h-[34rem] flex-col"
          >
            <h2 className="dashboard-page-title text-xl sm:text-xl">Weekly Consistency</h2>
            <p className="dashboard-page-subtitle">Daily completion score out of 100</p>

            <div className="mt-6 grid w-full flex-1 grid-cols-7 gap-2 sm:gap-3">
              {weeklyConsistency.map((entry) => (
                <div key={entry.day} className="flex h-full w-full flex-col gap-2">
                  <div className="dashboard-inner-surface flex h-full min-h-[24rem] w-full flex-1 items-end p-2">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-[#3c83f6] via-[#45a2ff] to-[#53b6ff]"
                      style={{ height: `${entry.score}%` }}
                    />
                  </div>
                  <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">{entry.day}</p>
                </div>
              ))}
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="dashboard-surface p-6 lg:col-span-2"
          >
            <h2 className="dashboard-page-title text-xl sm:text-xl">Track Breakdown</h2>
            <p className="dashboard-page-subtitle">Solved vs accuracy by track</p>

            <div className="mt-5 space-y-4">
              {trackBreakdown.map((track) => (
                <div key={track.track} className="dashboard-inner-surface p-4">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">{track.track}</p>
                    <p className="text-[#4c6f9a] dark:text-[#7fb8e2]">{track.solved} solved</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#c4e3ff] dark:bg-[#0a2f6f]/55">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6]"
                      style={{ width: `${track.accuracy}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">{track.accuracy}% accuracy</p>
                </div>
              ))}
            </div>
          </motion.article>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="dashboard-surface p-6"
        >
          <h2 className="dashboard-page-title text-xl sm:text-xl">Recent Practice Sessions</h2>
          <p className="dashboard-page-subtitle">Latest attempts and XP earned</p>

          <div className="mt-5 space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="dashboard-inner-surface flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">{session.title}</p>
                  <p className="text-xs uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">{session.type}</p>
                </div>
                <div className="flex items-center gap-5 text-xs uppercase tracking-widest text-[#4c6f9a] dark:text-[#7fb8e2]">
                  <span>{session.accuracy} accuracy</span>
                  <span>{session.time}</span>
                  <span className="font-semibold text-[#2d7fe8] dark:text-[#8fd9ff]">{session.xp}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </UserSidebarLayout>
  );
}
