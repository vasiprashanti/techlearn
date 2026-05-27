import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Code, Database, Cpu, Brain, Briefcase, ChevronRight } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { practiceAPI } from '../../services/practiceApi';

export default function PracticeHub() {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    practiceAPI.getStats()
      .then((data) => {
        if (data?.streak !== undefined) {
          setStreak(data.streak);
        }
      })
      .catch(() => {});
  }, []);

  const practiceCards = [
    {
      id: 'dsa',
      title: 'DSA PRACTICE',
      desc: 'Master array, string, tree, and graph algorithms.',
      icon: <Code className="w-6 h-6 text-blue-500" />,
      path: '/dashboard/practice/dsa'
    },
    {
      id: 'sql',
      title: 'SQL PRACTICE',
      desc: 'Master databases, complex joins, and SQL queries.',
      icon: <Database className="w-6 h-6 text-sky-500" />,
      path: '/dashboard/practice/sql'
    },
    {
      id: 'core-cs',
      title: 'CORE CS PRACTICE',
      desc: 'Operating Systems, DBMS, Networks, and Computer Architecture.',
      icon: <Cpu className="w-6 h-6 text-slate-500" />,
      path: '/dashboard/practice/core-cs'
    },
    {
      id: 'aptitude',
      title: 'APTITUDE PRACTICE',
      desc: 'Quantitative, logical reasoning, and verbal ability puzzles.',
      icon: <Brain className="w-6 h-6 text-indigo-500" />,
      path: '/dashboard/practice/aptitude'
    },
    {
      id: 'company',
      title: 'COMPANY QUESTIONS',
      desc: 'Practice coding questions asked in top tech companies.',
      icon: <Briefcase className="w-6 h-6 text-orange-500" />,
      path: '/dashboard/practice/company-based'
    }
  ];

  return (
    <UserSidebarLayout maxWidthClass="max-w-[640px]">
      <div className="space-y-6 px-1 py-2">
        <header className="pb-4">
          <h1 className="mt-8 font-poppins tracking-tight leading-[0.92]">
            <span className="block italic text-4xl sm:text-5xl md:text-6xl brand-heading-primary">
              PRACTICE QUESTIONS
            </span>
          </h1>
          <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-4">
            Practice and track your progress across topics
          </p>
        </header>

        <div className="space-y-5">
          {/* Streak Card */}
          <div className="dashboard-surface dashboard-surface-strong p-6 flex flex-col justify-between min-h-[110px] relative overflow-hidden">
            <div className="absolute right-4 bottom-2 text-orange-500/10 dark:text-orange-500/5">
              <Flame className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between gap-2 z-10">
              <p className="dashboard-micro-label uppercase tracking-widest text-[#4c6f9a] dark:text-[#7fb8e2]">Practice Streak</p>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-[#0d2a57] dark:text-[#dff3ff] z-10 flex items-baseline gap-1.5">
              {streak} <span className="text-xs font-normal text-[#4c6f9a] dark:text-[#7fb8e2]">days</span>
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-5">
            {practiceCards.map((card, index) => (
              <motion.button
                key={card.id}
                onClick={() => navigate(card.path)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="dashboard-surface p-6 text-left border border-transparent hover:border-[#3C83F6]/45 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 w-full flex items-center justify-between group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/50 dark:bg-white/5 shrink-0 group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#0d2a57] dark:text-[#dff3ff] group-hover:text-[#3C83F6] transition-colors uppercase tracking-wide">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#4c6f9a] dark:text-[#7fb8e2] mt-1 leading-relaxed max-w-sm">
                      {card.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#3C83F6] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </UserSidebarLayout>
  );
}
