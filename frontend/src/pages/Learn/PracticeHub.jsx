import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Code, Database, Cpu, Brain, Briefcase, ChevronRight } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { practiceAPI } from '../../services/practiceApi';

export default function PracticeHub() {
  const navigate = useNavigate();
  const [trackStats, setTrackStats] = useState({});

  useEffect(() => {
    practiceAPI.getStats()
      .then((data) => {
        if (data?.tracks) {
          const statsMap = {};
          data.tracks.forEach(t => {
            let cardId = t.track.toLowerCase().replace(' ', '-');
            if (cardId === 'company-based') cardId = 'company';
            statsMap[cardId] = t.streak || 0;
          });
          setTrackStats(statsMap);
        }
      })
      .catch(() => {});
  }, []);

  const practiceCards = [
    {
      id: 'dsa',
      title: 'DSA',
      desc: 'Master array, string, tree, and graph algorithms.',
      icon: <Code className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />,
      visualClass: 'from-[#d8f2ff] via-[#c7ecff] to-[#b7e4ff] dark:from-[#082a5d] dark:via-[#0a214b] dark:to-[#061936]',
      path: '/dashboard/practice/dsa'
    },
    {
      id: 'sql',
      title: 'SQL',
      desc: 'Master databases, complex joins, and SQL queries.',
      icon: <Database className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />,
      visualClass: 'from-[#dcf7ff] via-[#c7f0ff] to-[#bceaff] dark:from-[#06315f] dark:via-[#08284f] dark:to-[#061936]',
      path: '/dashboard/practice/sql'
    },
    {
      id: 'core-cs',
      title: 'CORE CS',
      desc: 'Operating Systems, DBMS, Networks, and Computer Architecture.',
      icon: <Cpu className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />,
      visualClass: 'from-[#e4f5ff] via-[#cfeeff] to-[#bde7ff] dark:from-[#132949] dark:via-[#0b2147] dark:to-[#061936]',
      path: '/dashboard/practice/core-cs'
    },
    {
      id: 'aptitude',
      title: 'APTITUDE',
      desc: 'Quantitative, logical reasoning, and verbal ability puzzles.',
      icon: <Brain className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />,
      visualClass: 'from-[#e3eeff] via-[#d4e9ff] to-[#bfe5ff] dark:from-[#192957] dark:via-[#10234d] dark:to-[#061936]',
      path: '/dashboard/practice/aptitude'
    },
    {
      id: 'company',
      title: 'COMPANY BASED',
      desc: 'Practice coding questions asked in top tech companies.',
      icon: <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />,
      visualClass: 'from-[#eaf6ff] via-[#d7efff] to-[#c4e8ff] dark:from-[#243052] dark:via-[#102348] dark:to-[#061936]',
      path: '/dashboard/practice/company-based'
    }
  ];

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="space-y-8 px-1 py-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="relative mx-auto max-w-4xl pt-2 text-center md:pt-4"
        >
          <h1 className="font-press-start leading-normal">
            <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
              PRACTICE QUESTIONS
            </span>
          </h1>
        </motion.div>

        <div className="space-y-5">
          {/* Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 max-w-5xl mx-auto">
            {practiceCards.map((card, index) => (
              <motion.button
                key={card.id}
                onClick={() => navigate(card.path)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="dashboard-surface group relative flex min-h-[150px] sm:min-h-[190px] lg:min-h-[225px] overflow-hidden p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#3C83F6]/45 hover:shadow-lg"
              >
                <div className="flex h-full w-full flex-col">
                  <div className={`relative flex min-h-[65px] sm:min-h-[80px] lg:min-h-[90px] basis-[43%] items-center justify-center overflow-hidden border-b border-[#9fcfff]/35 bg-gradient-to-br ${card.visualClass}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(143,217,255,0.16),transparent_42%)]" />
                    
                    <div className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 dark:border-orange-500/30 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-orange-600 dark:text-[#ffb38a] shadow-[0_2px_10px_rgba(249,115,22,0.12)] backdrop-blur-[6px]">
                      <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500 animate-pulse fill-orange-500/20" />
                      <span>{trackStats[card.id] || 0}</span>
                    </div>

                    <div className="dashboard-icon-badge relative z-10 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-lg sm:rounded-xl md:rounded-2xl text-[#2d7fe8] shadow-[0_6px_14px_rgba(60,131,246,0.12)] sm:shadow-[0_10px_26px_rgba(60,131,246,0.16)] transition-transform duration-300 group-hover:scale-110 dark:text-[#8fd9ff]">
                      {card.icon}
                    </div>
                    <ChevronRight className="absolute right-3 top-3 sm:right-5 sm:top-5 h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#2d7fe8]/55 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#2d7fe8] dark:text-[#8fd9ff]/70" />
                  </div>

                  <div className="flex basis-[57%] flex-col justify-center items-center text-center p-2.5 sm:p-4 lg:p-5">
                    <h3 className="text-xs sm:text-base md:text-xl lg:text-[1.35rem] xl:text-[1.55rem] font-semibold leading-snug text-[#0d2a57] transition-colors group-hover:text-[#2d7fe8] dark:text-[#8fd9ff] dark:group-hover:text-[#96ddff]">
                      {card.title}
                    </h3>
                    <p className="mt-1 sm:mt-2 lg:mt-2.5 text-[10px] sm:text-xs md:text-sm leading-normal md:leading-relaxed text-[#4c6f9a] dark:text-[#7fb8e2]">
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
