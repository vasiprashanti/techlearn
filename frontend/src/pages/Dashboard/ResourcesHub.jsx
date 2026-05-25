import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { FiBookOpen, FiLayers, FiAward, FiFileText, FiArrowRight } from 'react-icons/fi';

const resources = [
  {
    title: 'Free Courses',
    description: 'Access our high-quality prep courses in programming languages and tools for free.',
    icon: FiBookOpen,
    path: '/learn',
    colorClass: 'text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-900/20',
    borderColor: 'hover:border-blue-500/35',
  },
  {
    title: 'Important Concepts',
    description: 'Master core computer science fundamentals and topics for placement exams.',
    icon: FiLayers,
    path: '/dashboard/resources/important-concepts',
    colorClass: 'text-purple-500 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-900/20',
    borderColor: 'hover:border-purple-500/35',
  },
  {
    title: 'Free Certifications',
    description: 'Earn professional certifications to showcase on your resume and LinkedIn.',
    icon: FiAward,
    path: '/dashboard/resources/free-certifications',
    colorClass: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-900/20',
    borderColor: 'hover:border-emerald-500/35',
  },
  {
    title: 'Resume Templates',
    description: 'Download ATS-friendly developer resume templates crafted by top professionals.',
    icon: FiFileText,
    path: '/dashboard/resources/resume-templates',
    colorClass: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-900/20',
    borderColor: 'hover:border-amber-500/35',
  },
];

export default function ResourcesHub() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';

  return (
    <UserSidebarLayout maxWidthClass="max-w-6xl">
      <div className="space-y-8 py-2 px-1">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="dashboard-page-title text-3xl md:text-4xl">
            Learning Resources
          </h1>
          <p className="dashboard-page-subtitle max-w-2xl mt-2">
            Boost your computer science preparation and career development with our curated tracks, concept reviews, certificates, and resume templates.
          </p>
        </motion.div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((res, index) => {
            const Icon = res.icon;
            return (
              <motion.button
                key={res.title}
                type="button"
                onClick={() => navigate(res.path)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={`dashboard-surface p-6 md:p-8 text-left border border-transparent ${res.borderColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative group flex flex-col justify-between h-[200px] w-full`}
              >
                {/* Visual Glow Layer for Premium Feel */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3C83F6]/0 to-[#3C83F6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
                
                <div className="z-10 flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className={`p-3 rounded-2xl w-fit ${res.colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#0d2a57] dark:text-[#dff3ff] group-hover:text-[#3C83F6] transition-colors duration-300 mt-2">
                      {res.title}
                    </h3>
                  </div>
                </div>

                <div className="z-10 mt-2 flex items-end justify-between w-full">
                  <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2] max-w-[80%] line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                  <div className="p-2 rounded-full border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 text-[#3C83F6] group-hover:bg-[#3C83F6] group-hover:text-white transition-all duration-300 transform group-hover:scale-105 shadow-sm">
                    <FiArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </UserSidebarLayout>
  );
}
