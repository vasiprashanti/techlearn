import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Code, Database, Cpu, Brain, Briefcase, Globe, Terminal, BarChart as Chart, BookOpen as Notebook, ChevronRight } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { practiceAPI } from '../../services/practiceApi';

const IconMap = {
  Code: Code,
  Database: Database,
  Cpu: Cpu,
  Brain: Brain,
  Briefcase: Briefcase,
  Globe: Globe,
  Terminal: Terminal,
  Chart: Chart,
  Notebook: Notebook,
  code: Code,
  database: Database,
  cpu: Cpu,
  brain: Brain,
  briefcase: Briefcase,
  globe: Globe,
  terminal: Terminal,
  chart: Chart,
  notebook: Notebook,
};

const visualGradients = [
  'from-[#d8f2ff] via-[#c7ecff] to-[#b7e4ff] dark:from-[#082a5d] dark:via-[#0a214b] dark:to-[#061936]',
  'from-[#dcf7ff] via-[#c7f0ff] to-[#bceaff] dark:from-[#06315f] dark:via-[#08284f] dark:to-[#061936]',
  'from-[#e4f5ff] via-[#cfeeff] to-[#bde7ff] dark:from-[#132949] dark:via-[#0b2147] dark:to-[#061936]',
  'from-[#e3eeff] via-[#d4e9ff] to-[#bfe5ff] dark:from-[#192957] dark:via-[#10234d] dark:to-[#061936]',
  'from-[#eaf6ff] via-[#d7efff] to-[#c4e8ff] dark:from-[#243052] dark:via-[#102348] dark:to-[#061936]',
];

const getVisualClass = (index) => {
  return visualGradients[index % visualGradients.length];
};

export default function PracticeHub() {
  const navigate = useNavigate();
  const [trackStats, setTrackStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      practiceAPI.getStats().catch(() => ({})),
      practiceAPI.getCategories().catch(() => [])
    ])
      .then(([statsData, categoriesData]) => {
        if (statsData?.tracks) {
          const statsMap = {};
          statsData.tracks.forEach(t => {
            let cardId = t.track.toLowerCase().replace(' ', '-');
            if (cardId === 'company-based') cardId = 'company';
            statsMap[cardId] = t.streak || 0;
            statsMap[t.track.toLowerCase()] = t.streak || 0;
          });
          setTrackStats(statsMap);
        }
        setCategories(categoriesData || []);
      })
      .catch((err) => console.error("Failed to load practice hub:", err))
      .finally(() => setLoading(false));
  }, []);

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
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3c83f6] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 max-w-5xl mx-auto">
              {categories.map((card, index) => {
                const IconComponent = IconMap[card.defaultIcon] || IconMap[card.icon] || Code;
                
                const lowerSlug = card.slug.toLowerCase();
                let routePath = `/dashboard/practice/category/${card.slug}`;
                if (lowerSlug === 'dsa') routePath = '/dashboard/practice/dsa';
                else if (lowerSlug === 'sql') routePath = '/dashboard/practice/sql';
                else if (lowerSlug === 'core-cs') routePath = '/dashboard/practice/core-cs';
                else if (lowerSlug === 'aptitude') routePath = '/dashboard/practice/aptitude';
                else if (lowerSlug === 'company-based' || lowerSlug === 'company') routePath = '/dashboard/practice/company-based';

                const streakKey = lowerSlug === 'company-based' || lowerSlug === 'company' ? 'company' : lowerSlug;
                const streak = trackStats[streakKey] || trackStats[lowerSlug] || 0;

                return (
                  <motion.button
                    key={card.id || card._id}
                    onClick={() => navigate(routePath, { state: { title: card.title } })}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="dashboard-surface group relative flex min-h-[150px] sm:min-h-[190px] lg:min-h-[225px] overflow-hidden p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#3C83F6]/45 hover:shadow-lg"
                  >
                    <div className="flex h-full w-full flex-col">
                      <div className={`relative flex min-h-[65px] sm:min-h-[80px] lg:min-h-[90px] basis-[43%] items-center justify-center overflow-hidden border-b border-[#9fcfff]/35 bg-gradient-to-br ${getVisualClass(index)}`}>
                        {card.bannerImage ? (
                          <img src={card.bannerImage} alt={card.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(143,217,255,0.16),transparent_42%)]" />
                            {card.defaultIcon !== 'None' && (
                              <div className="dashboard-icon-badge relative z-10 h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-lg sm:rounded-xl md:rounded-2xl text-[#2d7fe8] shadow-[0_6px_14px_rgba(60,131,246,0.12)] sm:shadow-[0_10px_26px_rgba(60,131,246,0.16)] transition-transform duration-300 group-hover:scale-110 dark:text-[#8fd9ff]">
                                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                              </div>
                            )}
                          </>
                        )}
                        <ChevronRight className="absolute right-3 top-3 sm:right-5 sm:top-5 h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#2d7fe8]/55 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#2d7fe8] dark:text-[#8fd9ff]/70" />
                      </div>

                      <div className="flex basis-[57%] flex-col justify-center items-center text-center p-2.5 sm:p-4 lg:p-5">
                        <h3 className="text-xs sm:text-base md:text-xl lg:text-[1.35rem] xl:text-[1.55rem] font-semibold leading-snug text-[#0d2a57] transition-colors group-hover:text-[#2d7fe8] dark:text-[#8fd9ff] dark:group-hover:text-[#96ddff]">
                          {card.title}
                        </h3>
                        <p className="mt-1 sm:mt-2 lg:mt-2.5 text-[10px] sm:text-xs md:text-sm leading-normal md:leading-relaxed text-[#4c6f9a] dark:text-[#7fb8e2] line-clamp-2">
                          {card.description || card.desc}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </UserSidebarLayout>
  );
}
