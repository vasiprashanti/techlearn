import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiCode, FiDatabase, FiGlobe, FiTerminal } from 'react-icons/fi';
import { PiBrainLight } from 'react-icons/pi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { questionCategories } from '../../data/adminQuestionBankData';

const categoryIconMap = {
  code: FiCode,
  globe: FiGlobe,
  terminal: FiTerminal,
  database: FiDatabase,
  brain: PiBrainLight,
  chart: FiBarChart2,
};

const PAGE_TITLE_STYLE = {
  fontSize: 'clamp(1.4rem, 1.3rem + 0.25vw, 1.65rem)',
  fontWeight: 700,
  letterSpacing: '-0.03em',
  color: '#3c83f6',
  lineHeight: 1.1,
};

export default function QuestionBank() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#c7e5f4] to-[#daf0fa]'}`} />
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
        className={`flex-1 min-h-[100dvh] transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className="sticky top-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <div>
              <h1 className="admin-page-title" style={PAGE_TITLE_STYLE}>Question Bank</h1>
            </div>
            <AdminHeaderControls user={user} logout={logout} />
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="bg-white/95 dark:bg-[#0a1d45] border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 min-h-[96px]">
              <div>
                <p className="text-xl leading-none text-black/65 dark:text-white/65">Total Questions</p>
                <p className="mt-2.5 text-4xl font-semibold tracking-tight leading-none text-black dark:text-white">
                  {questionCategories.reduce((sum, category) => sum + category.total, 0)}
                </p>
              </div>
            </article>

            <article className="bg-white/95 dark:bg-[#0a1d45] border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 min-h-[96px]">
              <div>
                <p className="text-xl leading-none text-black/65 dark:text-white/65">Total Categories</p>
                <p className="mt-2.5 text-4xl font-semibold tracking-tight leading-none text-black dark:text-white">{questionCategories.length}</p>
              </div>
            </article>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl leading-tight font-semibold text-slate-900 dark:text-white mb-3">Question Categories</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {questionCategories.map((category) => {
                const Icon = categoryIconMap[category.icon] || FiBarChart2;

                return (
                  <article key={category.id} className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1d45] shadow-sm h-full flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className={`px-4 py-4 min-h-[104px] border-b border-black/5 dark:border-white/10 ${category.topTint}`}>
                      <div className="flex items-start gap-2.5">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm ${category.iconBg}`}>
                          <Icon className={`w-5 h-5 ${category.iconColor}`} />
                        </div>
                        <div className="min-h-[64px]">
                          <h3 className="text-base md:text-lg leading-tight font-semibold text-slate-900 dark:text-white">{category.title}</h3>
                          <p className="mt-1 text-[11px] md:text-xs leading-tight text-slate-500 dark:text-slate-300">{category.subtitle}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4 mt-auto bg-white/70 dark:bg-transparent">
                      <div className="flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
                        <span>Total Questions</span>
                        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{category.total}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
                        <span>Active Questions</span>
                        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{category.active}</span>
                      </div>

                      <button
                        onClick={() => navigate(`/question-bank/${category.slug}`)}
                        className="mt-4 w-full h-9 rounded-lg bg-[#3c83f6] hover:bg-[#2563eb] text-white text-xs md:text-sm font-semibold transition-colors"
                      >
                        View Questions
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
