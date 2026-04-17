import { motion } from 'framer-motion';
import { ArrowRight, Clock, Flame, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';

const mockChallenges = [
  {
    id: 'arrays-warmup',
    title: 'Array Warmup Sprint',
    difficulty: 'Easy',
    topic: 'Arrays',
    estimate: '15 min',
    reward: '120 XP',
  },
  {
    id: 'two-pointer-core',
    title: 'Two Pointer Drill',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    estimate: '25 min',
    reward: '220 XP',
  },
  {
    id: 'graph-bonus',
    title: 'Graph Bonus Mission',
    difficulty: 'Hard',
    topic: 'Graphs',
    estimate: '40 min',
    reward: '320 XP',
  },
];

const difficultyBadge = {
  Easy: 'bg-[#dff6e8] text-[#1f7d53] border border-[#b9e9c8]',
  Medium: 'bg-[#fff6c9] text-[#9a7a16] border border-[#f6e597]',
  Hard: 'bg-[#ffe5e3] text-[#be4b43] border border-[#ffcfc9]',
};

export default function DailyChallenge() {
  const navigate = useNavigate();

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/95 to-[#d9efff]/90 p-8 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="brand-heading-primary font-poppins text-3xl md:text-4xl tracking-tight leading-none">
                Daily Challenge
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-base text-[#4c6f9a] dark:text-[#7fb8e2]">
                A quick daily mission to keep momentum high. Solve one focused challenge every day and build consistency.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/practice/dsa')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-[#082a5d] shadow-md transition hover:scale-[1.02] hover:shadow-lg"
            >
              Open DSA Practice
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#9fcfff]/45 bg-[#dbf1ff] px-4 py-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                <Flame className="h-4 w-4" />
                Current Streak
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">12 Days</p>
            </div>
            <div className="rounded-2xl border border-[#9fcfff]/45 bg-[#dbf1ff] px-4 py-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                <Target className="h-4 w-4" />
                Today Goal
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">1 Challenge</p>
            </div>
            <div className="rounded-2xl border border-[#9fcfff]/45 bg-[#dbf1ff] px-4 py-4 dark:border-[#6bb8ec]/35 dark:bg-[#0d366f]">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                <Trophy className="h-4 w-4" />
                Weekly XP
              </div>
              <p className="mt-1 text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">+980 XP</p>
            </div>
          </div>
        </motion.section>

        <section className="space-y-4">
          {mockChallenges.map((challenge, index) => (
            <motion.article
              key={challenge.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${difficultyBadge[challenge.difficulty]}`}>
                      {challenge.difficulty}
                    </span>
                    <span className="rounded-full border border-[#9fcfff]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#4f719c] dark:border-[#6bb8ec]/55 dark:text-[#8ac7f3]">
                      {challenge.topic}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">{challenge.title}</h2>
                </div>

                <div className="flex items-center gap-6 text-[11px] uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#4f7fb7] dark:text-[#7cc3ee]" />
                    <span>{challenge.estimate}</span>
                  </div>
                  <div>{challenge.reward}</div>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/practice/dsa')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#082a5d] shadow-md transition hover:scale-[1.02] hover:shadow-lg"
                >
                  Start Challenge
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.article>
          ))}
        </section>
      </div>
    </UserSidebarLayout>
  );
}
