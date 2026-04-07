import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiCode, FiDatabase, FiGlobe, FiPlus, FiTerminal, FiX } from 'react-icons/fi';
import { PiBrainLight } from 'react-icons/pi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/Loader/Loader3D';
import { adminAPI, preferRemoteData } from '../../services/adminApi';
import { emptyQuestionCategories } from '../../data/adminEmptyStates';

const categoryIconMap = {
  code: FiCode,
  globe: FiGlobe,
  terminal: FiTerminal,
  database: FiDatabase,
  brain: PiBrainLight,
  chart: FiBarChart2,
};

const getCategoryTheme = (icon) => {
  switch (icon) {
    case 'code':
      return {
        topTint: 'bg-[#d9ddee] dark:bg-[#223454]',
        iconBg: 'bg-[#e6ebf5] dark:bg-[#2f4466]',
        iconColor: 'text-[#3c83f6] dark:text-blue-300',
      };
    case 'globe':
      return {
        topTint: 'bg-[#d2e9e5] dark:bg-[#204744]',
        iconBg: 'bg-[#e4f4f1] dark:bg-[#285954]',
        iconColor: 'text-[#129775] dark:text-emerald-300',
      };
    case 'terminal':
      return {
        topTint: 'bg-[#efe6d2] dark:bg-[#4f4228]',
        iconBg: 'bg-[#f8f0df] dark:bg-[#625133]',
        iconColor: 'text-[#d17d00] dark:text-amber-300',
      };
    case 'database':
      return {
        topTint: 'bg-[#e7def3] dark:bg-[#3a2f58]',
        iconBg: 'bg-[#f1eafb] dark:bg-[#4a3b73]',
        iconColor: 'text-[#8c4df4] dark:text-violet-300',
      };
    case 'brain':
      return {
        topTint: 'bg-[#f1dbe4] dark:bg-[#5a3042]',
        iconBg: 'bg-[#faeaf0] dark:bg-[#6f3b50]',
        iconColor: 'text-[#df2f64] dark:text-rose-300',
      };
    default:
      return {
        topTint: 'bg-[#d8e6ef] dark:bg-[#24384e]',
        iconBg: 'bg-[#e7f0f6] dark:bg-[#30495f]',
        iconColor: 'text-[#3c83f6] dark:text-blue-300',
      };
  }
};

export default function QuestionBank() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categoryState, setCategoryState] = useState(emptyQuestionCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ title: '', subtitle: '', icon: 'chart' });
  const [categoryError, setCategoryError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    adminAPI
      .getQuestionCategories()
      .then((remoteCategories) => {
        if (!cancelled) {
          const normalized = preferRemoteData(remoteCategories, emptyQuestionCategories).map((category) => ({
            ...getCategoryTheme(category.icon),
            ...category,
          }));
          setCategoryState(normalized);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryState(emptyQuestionCategories);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryForm({ title: '', subtitle: '', icon: 'chart' });
    setCategoryError('');
    setIsSavingCategory(false);
  };

  const saveCategory = async () => {
    if (!categoryForm.title.trim()) {
      setCategoryError('Category title is required.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError('');

    try {
      const createdCategory = await adminAPI.createQuestionCategory(categoryForm);
      const categoryWithTheme = {
        ...getCategoryTheme(createdCategory.icon),
        ...createdCategory,
      };
      setCategoryState((prev) => [...prev, categoryWithTheme]);
      closeCategoryModal();
    } catch (error) {
      setCategoryError(error.message || 'Failed to create category.');
      setIsSavingCategory(false);
    }
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeCategoryModal} />
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1d45] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Question Category</h2>
              <button onClick={closeCategoryModal} className="text-black/45 dark:text-white/55 hover:text-black dark:hover:text-white" aria-label="Close category form">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category Title</label>
                <input
                  value={categoryForm.title}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Enter category name"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Subtitle</label>
                <input
                  value={categoryForm.subtitle}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                  placeholder="Short description for the category"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Icon</label>
                <select
                  value={categoryForm.icon}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))}
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm"
                >
                  <option value="chart">Chart</option>
                  <option value="code">Code</option>
                  <option value="globe">Globe</option>
                  <option value="terminal">Terminal</option>
                  <option value="database">Database</option>
                  <option value="brain">Brain</option>
                </select>
              </div>

              {categoryError && (
                <p className="text-sm text-red-500">{categoryError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={closeCategoryModal}
                  className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCategory}
                  disabled={isSavingCategory}
                  className="h-10 px-5 rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {isSavingCategory ? 'Saving...' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#c7e5f4] to-[#daf0fa]'}`} />
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      <main
          onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-0 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          <header className={`sticky top-0 z-40 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 xl:-mx-16 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 h-16 backdrop-blur-xl border-b border-black/5 dark:border-white/10 flex items-center justify-between transition-all duration-300 ${isPageScrolled ? "bg-[#daf0fa]/78 dark:bg-[#001233]/76" : "bg-[#daf0fa]/92 dark:bg-[#001233]/90"}`}>
            <div>
              <h1 className="admin-page-title">Question Bank</h1>
            </div>
            <AdminHeaderControls user={user} logout={logout} />
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="bg-white/95 dark:bg-[#0a1d45] border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 min-h-[96px]">
              <div>
                <p className="text-sm md:text-base leading-none text-black/65 dark:text-white/65">Total Questions</p>
                <p className="mt-2.5 text-4xl font-semibold tracking-tight leading-none text-black dark:text-white">
                  {categoryState.reduce((sum, category) => sum + category.total, 0)}
                </p>
              </div>
            </article>

            <article className="bg-white/95 dark:bg-[#0a1d45] border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 min-h-[96px]">
              <div>
                <p className="text-sm md:text-base leading-none text-black/65 dark:text-white/65">Total Categories</p>
                <p className="mt-2.5 text-4xl font-semibold tracking-tight leading-none text-black dark:text-white">{categoryState.length}</p>
              </div>
            </article>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl md:text-2xl leading-tight font-semibold text-slate-900 dark:text-white">Question Categories</h2>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#3c83f6] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
              >
                <FiPlus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {categoryState.map((category) => {
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
              {categoryState.length === 0 && (
                <div className="xl:col-span-3 rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0a1d45]/70 px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-300">
                  Question categories will appear here once they are created.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}



