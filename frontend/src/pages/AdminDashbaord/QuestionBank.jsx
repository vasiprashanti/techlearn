import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { FiSearch, FiCode, FiGlobe, FiCpu, FiDatabase, FiBarChart2, FiBell, FiPlus, FiEdit2 } from 'react-icons/fi';

const searchRoutes = [
  { id: 'dashboard', title: 'Dashboard', category: 'Overview' },
  { id: 'analytics', title: 'Analytics', category: 'Overview' },
  { id: 'system-health', title: 'System Health', category: 'Overview' },
  { id: 'colleges', title: 'Colleges', category: 'Organization' },
  { id: 'batches', title: 'Batches', category: 'Organization' },
  { id: 'students', title: 'Students', category: 'Organization' },
  { id: 'question-bank', title: 'Question Bank', category: 'Learning' },
  { id: 'track-templates', title: 'Track Templates', category: 'Learning' },
  { id: 'resources', title: 'Resources', category: 'Learning' },
  { id: 'certificates', title: 'Certificates', category: 'Learning' },
  { id: 'submission-monitor', title: 'Submission Monitor', category: 'Operations' },
  { id: 'notifications', title: 'Notifications', category: 'Operations' },
  { id: 'audit-logs', title: 'Audit Logs', category: 'Operations' },
  { id: 'reports', title: 'Reports', category: 'Operations' },
];

const categories = [
  {
    id: 1,
    title: 'Data Structures & Algorithms',
    subtitle: 'Core DSA concepts',
    total: 4,
    active: 4,
    icon: <FiCode className="w-5 h-5" />,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-400/10',
    tags: ['Arrays', 'Trees', 'Graphs', 'DP'],
  },
  {
    id: 2,
    title: 'Web Development',
    subtitle: 'Full-stack web development',
    total: 3,
    active: 3,
    icon: <FiGlobe className="w-5 h-5" />,
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-500/10 dark:bg-violet-400/10',
    tags: ['React', 'Node.js', 'REST APIs'],
  },
  {
    id: 3,
    title: 'Python Programming',
    subtitle: 'Python fundamentals to advanced',
    total: 1,
    active: 1,
    icon: <FiCpu className="w-5 h-5" />,
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-400/10',
    tags: ['OOP', 'Libraries'],
  },
  {
    id: 4,
    title: 'Database Management',
    subtitle: 'SQL and NoSQL databases',
    total: 1,
    active: 1,
    icon: <FiDatabase className="w-5 h-5" />,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    tags: ['SQL', 'NoSQL'],
  },
  {
    id: 5,
    title: 'Machine Learning',
    subtitle: 'ML fundamentals and applications',
    total: 1,
    active: 1,
    icon: <FiBarChart2 className="w-5 h-5" />,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-400/10',
    tags: ['Supervised', 'Neural Nets'],
  },
];

const questionSeed = {
  'Data Structures & Algorithms': [
    { id: 'q-101', title: 'Two Sum', difficulty: 'Easy', version: 3 },
    { id: 'q-102', title: 'Binary Tree Traversal', difficulty: 'Medium', version: 2 },
  ],
  'Web Development': [
    { id: 'q-201', title: 'Build Debounced Search', difficulty: 'Medium', version: 1 },
  ],
  'Python Programming': [
    { id: 'q-301', title: 'DataFrame Cleanup', difficulty: 'Easy', version: 1 },
  ],
  'Database Management': [
    { id: 'q-401', title: 'Optimized Join Query', difficulty: 'Hard', version: 2 },
  ],
  'Machine Learning': [
    { id: 'q-501', title: 'Linear Regression Baseline', difficulty: 'Medium', version: 4 },
  ],
};

export default function QuestionBank() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0].title);
  const [questionsByCategory, setQuestionsByCategory] = useState(questionSeed);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({ title: '', difficulty: 'Easy' });
  const [historyQuestion, setHistoryQuestion] = useState(null);
  const searchInputRef = useRef(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(prev => !prev); }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
    else setSearchQuery('');
  }, [isSearchOpen]);

  const filteredRoutes = searchRoutes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRouteSelect = (id) => { setIsSearchOpen(false); navigate('/' + id); };

  const filteredCategories = categories.filter(c =>
    c.title.toLowerCase().includes(categorySearch.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const currentQuestions = questionsByCategory[activeCategory] || [];

  const openQuestionForm = (question = null) => {
    setEditingQuestion(question);
    setQuestionForm(question ? { title: question.title, difficulty: question.difficulty } : { title: '', difficulty: 'Easy' });
    setIsQuestionFormOpen(true);
  };

  const saveQuestion = () => {
    if (!questionForm.title.trim()) return;
    setQuestionsByCategory((prev) => {
      const categoryQuestions = [...(prev[activeCategory] || [])];
      if (editingQuestion) {
        return {
          ...prev,
          [activeCategory]: categoryQuestions.map((q) => q.id === editingQuestion.id
            ? { ...q, title: questionForm.title.trim(), difficulty: questionForm.difficulty, version: q.version + 1 }
            : q),
        };
      }

      const next = {
        id: `q-${Date.now()}`,
        title: questionForm.title.trim(),
        difficulty: questionForm.difficulty,
        version: 1,
      };
      return {
        ...prev,
        [activeCategory]: [next, ...categoryQuestions],
      };
    });
    setIsQuestionFormOpen(false);
  };

  return (
    <>
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white/90 dark:bg-[#020b23]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/5">
              <FiSearch className="w-5 h-5 text-black/40 dark:text-white/40 mr-4 shrink-0" />
              <input ref={searchInputRef} type="text" placeholder="Search pages, tracks, or settings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-lg text-[#3C83F6] dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30" />
              <div className="flex items-center gap-1 text-[10px] font-medium text-black/40 dark:text-white/40 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded ml-4 shrink-0 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setIsSearchOpen(false)}>
                <span>ESC</span>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-black/40 dark:text-white/40">No results found for &ldquo;{searchQuery}&rdquo;</div>
              ) : filteredRoutes.map(route => (
                <button key={route.id} onClick={() => handleRouteSelect(route.id)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors group text-left">
                  <div>
                    <h4 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{route.title}</h4>

                  </div>
                  <span className="text-black/20 dark:text-white/20 group-hover:translate-x-1 transition-transform">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsQuestionFormOpen(false)} />
          <div className="relative w-full max-w-xl bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setIsQuestionFormOpen(false)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="admin-micro-label text-black/40 dark:text-white/40">Question Title</label>
                <input value={questionForm.title} onChange={(e) => setQuestionForm((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-sm" placeholder="Enter question title" />
              </div>
              <div>
                <label className="admin-micro-label text-black/40 dark:text-white/40">Difficulty</label>
                <select value={questionForm.difficulty} onChange={(e) => setQuestionForm((p) => ({ ...p, difficulty: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 text-sm">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <button onClick={saveQuestion} className="w-full py-2.5 rounded-xl text-sm font-medium border border-[#3C83F6]/20 bg-[#3C83F6]/10 text-[#3C83F6] dark:text-white dark:bg-white/10 dark:border-white/20">Save Question</button>
            </div>
          </div>
        </div>
      )}

      {historyQuestion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setHistoryQuestion(null)} />
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0a1737]/95 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#3C83F6] dark:text-white">Version History</h2>
              <button onClick={() => setHistoryQuestion(null)} className="text-sm text-black/40 dark:text-white/40">Close</button>
            </div>
            <div className="p-6 space-y-2">
              <p className="text-sm text-black/70 dark:text-white/70">{historyQuestion.title}</p>
              {Array.from({ length: historyQuestion.version }).map((_, idx) => (
                <div key={idx} className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-xs text-black/60 dark:text-white/60">
                  v{historyQuestion.version - idx} • Updated constraints and testcases
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
        <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
        <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

        <main className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-6 md:px-12 lg:px-16 overflow-y-auto overflow-x-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="max-w-[1400px] mx-auto space-y-8">

            <header className="sticky top-0 z-30 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16 h-16 bg-[#daf0fa]/88 dark:bg-[#001233]/84 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h1 className="admin-page-title">Question Bank</h1>

              </div>
              <AdminHeaderControls user={user} logout={logout} />
            </header>

            {/* KPI Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between">
                <span className="admin-micro-label text-black/50 dark:text-white/50">Total Questions</span>
                <div className="mt-6">
                  <span className="text-5xl font-light tracking-tighter text-[#3C83F6] dark:text-white">10</span>
                </div>
              </div>
              <div className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between">
                <span className="admin-micro-label text-black/50 dark:text-white/50">Total Categories</span>
                <div className="mt-6">
                  <span className="text-5xl font-light tracking-tighter text-[#3C83F6] dark:text-white">5</span>
                </div>
              </div>
            </div>

            {/* Category search */}
            <div className="flex items-center justify-between">
              <h2 className="admin-section-heading">Question Categories</h2>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 dark:text-white/30" />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-white/40 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-black/20 dark:focus:border-white/20 text-black/70 dark:text-white/70 placeholder:text-black/25 dark:placeholder:text-white/25 transition-colors w-48"
                />
              </div>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-xl p-6 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-black/60 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg ${cat.bg} ${cat.color} flex items-center justify-center shrink-0`}>
                      {cat.icon}
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {cat.tags.map(tag => (
                        <span key={tag} className="admin-micro-label px-2 py-0.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-full text-black/40 dark:text-white/40">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-sm font-medium text-[#3C83F6] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.title}</h3>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">{cat.subtitle}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex gap-5">
                      <div>
                        <p className="admin-micro-label text-black/40 dark:text-white/40">Total Questions</p>
                        <p className="text-lg font-light text-black/80 dark:text-white mt-0.5">{cat.total}</p>
                      </div>
                      <div>
                        <p className="admin-micro-label text-black/40 dark:text-white/40">Active Questions</p>
                        <p className="text-lg font-light text-emerald-600 dark:text-emerald-400 mt-0.5">{cat.active}</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveCategory(cat.title)} className="admin-micro-label text-[#3C83F6] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-[#3C83F6]/20 dark:border-blue-400/20 px-3 py-1.5 rounded-lg hover:bg-[#3C83F6]/5 dark:hover:bg-blue-400/5">
                      View Questions
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="admin-section-heading">Question List • {activeCategory}</h2>
                <button onClick={() => openQuestionForm()} className="flex items-center gap-2 admin-micro-label px-4 py-2 rounded-xl bg-[#3C83F6]/10 dark:bg-white/10 border border-[#3C83F6]/20 dark:border-white/20 text-[#3C83F6] dark:text-white/70">
                  <FiPlus className="w-3.5 h-3.5" />Add Question
                </button>
              </div>
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/40 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10">
                      {['Title', 'Difficulty', 'Version', 'Actions'].map((h) => (
                        <th key={h} className="text-left px-5 py-3 admin-micro-label text-black/35 dark:text-white/35">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuestions.map((q) => (
                      <tr key={q.id} className="border-b border-black/5 dark:border-white/5 last:border-0">
                        <td className="px-5 py-3 text-sm text-black/75 dark:text-white/75">{q.title}</td>
                        <td className="px-5 py-3 text-xs text-black/55 dark:text-white/55">{q.difficulty}</td>
                        <td className="px-5 py-3 text-xs text-[#3C83F6] dark:text-white/75">v{q.version}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openQuestionForm(q)} className="text-xs border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-black/60 dark:text-white/60 hover:text-[#3C83F6] dark:hover:text-white">
                              <FiEdit2 className="inline mr-1" />Edit
                            </button>
                            <button onClick={() => setHistoryQuestion(q)} className="text-xs border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-black/60 dark:text-white/60 hover:text-[#3C83F6] dark:hover:text-white">
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentQuestions.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-black/40 dark:text-white/40">No questions in this category yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </main>
      </div>
    </>
  );
}
