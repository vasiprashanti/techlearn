import { useEffect, useState } from 'react';
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
      icon: <Code className="h-10 w-10" />,
      visualClass: 'from-[#d8f2ff] via-[#c7ecff] to-[#b7e4ff] dark:from-[#082a5d] dark:via-[#0a214b] dark:to-[#061936]',
      path: '/dashboard/practice/dsa'
    },
    {
      id: 'sql',
      title: 'SQL PRACTICE',
      desc: 'Master databases, complex joins, and SQL queries.',
      icon: <Database className="h-10 w-10" />,
      visualClass: 'from-[#dcf7ff] via-[#c7f0ff] to-[#bceaff] dark:from-[#06315f] dark:via-[#08284f] dark:to-[#061936]',
      path: '/dashboard/practice/sql'
    },
    {
      id: 'core-cs',
      title: 'CORE CS PRACTICE',
      desc: 'Operating Systems, DBMS, Networks, and Computer Architecture.',
      icon: <Cpu className="h-10 w-10" />,
      visualClass: 'from-[#e4f5ff] via-[#cfeeff] to-[#bde7ff] dark:from-[#132949] dark:via-[#0b2147] dark:to-[#061936]',
      path: '/dashboard/practice/core-cs'
    },
    {
      id: 'aptitude',
      title: 'APTITUDE PRACTICE',
      desc: 'Quantitative, logical reasoning, and verbal ability puzzles.',
      icon: <Brain className="h-10 w-10" />,
      visualClass: 'from-[#e3eeff] via-[#d4e9ff] to-[#bfe5ff] dark:from-[#192957] dark:via-[#10234d] dark:to-[#061936]',
      path: '/dashboard/practice/aptitude'
    },
    {
      id: 'company',
      title: 'COMPANY QUESTIONS',
      desc: 'Practice coding questions asked in top tech companies.',
      icon: <Briefcase className="h-10 w-10" />,
      visualClass: 'from-[#eaf6ff] via-[#d7efff] to-[#c4e8ff] dark:from-[#243052] dark:via-[#102348] dark:to-[#061936]',
      path: '/dashboard/practice/company-based'
    }
  ];

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {practiceCards.map((card, index) => (
              <motion.button
                key={card.id}
                onClick={() => navigate(card.path)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="dashboard-surface group relative flex min-h-[270px] overflow-hidden p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#3C83F6]/45 hover:shadow-lg"
              >
                <div className="flex h-full w-full flex-col">
                  <div className={`relative flex min-h-[108px] basis-[40%] items-center justify-center overflow-hidden border-b border-[#9fcfff]/35 bg-gradient-to-br ${card.visualClass}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(143,217,255,0.16),transparent_42%)]" />
                    <div className="dashboard-icon-badge relative z-10 h-20 w-20 rounded-[1.65rem] text-[#2d7fe8] shadow-[0_12px_28px_rgba(60,131,246,0.16)] transition-transform duration-300 group-hover:scale-110 dark:text-[#8fd9ff]">
                      {card.icon}
                    </div>
                    <ChevronRight className="absolute right-5 top-5 h-5 w-5 text-[#2d7fe8]/55 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#2d7fe8] dark:text-[#8fd9ff]/70" />
                  </div>

                  <div className="flex basis-[60%] flex-col justify-end p-6 md:p-7">
                    <h3 className="text-xl md:text-[1.55rem] font-semibold leading-snug text-[#0d2a57] transition-colors group-hover:text-[#2d7fe8] dark:text-[#8fd9ff] dark:group-hover:text-[#96ddff]">
                      {card.title.replace(' PRACTICE', ' Practice')}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-[#4c6f9a] dark:text-[#7fb8e2]">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </UserSidebarLayout>
  );
}
