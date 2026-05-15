import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiChevronDown, FiCode, FiDatabase, FiGlobe, FiLayers, FiMoreHorizontal, FiPlus, FiTerminal, FiTrash2, FiX } from 'react-icons/fi';
import { PiBrainLight } from 'react-icons/pi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import AdminHeaderControls from '../../components/AdminDashbaord/AdminHeaderControls';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
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

const isPersistedCategory = (categoryId) => /^[a-f0-9]{24}$/i.test(String(categoryId || ''));

const categoryTypeBadgeClass = (type) => {
  const t = String(type || 'Coding');
  if (t === 'MCQ') {
    return 'bg-violet-100 text-violet-800 border-violet-200/90 dark:bg-violet-500/15 dark:text-violet-100 dark:border-violet-400/25';
  }
  if (t === 'Notes') {
    return 'bg-emerald-100 text-emerald-900 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-emerald-400/25';
  }
  return 'bg-sky-100 text-sky-900 border-sky-200/90 dark:bg-sky-500/15 dark:text-sky-100 dark:border-sky-400/25';
};

const categoryStatusBadgeClass = (status) => {
  const s = String(status || 'Active');
  if (s === 'Hidden') {
    return 'bg-amber-100 text-amber-950 border-amber-200/90 dark:bg-amber-500/12 dark:text-amber-100 dark:border-amber-400/25';
  }
  if (s === 'Draft') {
    return 'bg-slate-200 text-slate-800 border-slate-300/90 dark:bg-slate-600/25 dark:text-slate-100 dark:border-slate-400/30';
  }
  return 'bg-green-100 text-green-900 border-green-200/90 dark:bg-green-500/15 dark:text-green-100 dark:border-green-400/25';
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
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    categoryType: 'Coding',
    icon: 'chart',
    status: 'Active',
  });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState(null);
  const [categoryError, setCategoryError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const isDarkMode = theme === 'dark';
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';

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
            status:
              category.status === 'Draft' || category.status === 'Hidden' || category.status === 'Active'
                ? category.status
                : category.visibility === 'Hidden'
                  ? 'Hidden'
                  : 'Active',
            total: Number(category.total ?? category.totalQuestions ?? 0) || 0,
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

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const clickedTrigger = event.target.closest('.category-actions-trigger');
      const clickedMenu = event.target.closest('.category-actions-menu');
      if (!clickedTrigger && !clickedMenu) {
        setOpenCategoryMenuId(null);
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategoryId(null);
    setCategoryForm({ title: '', description: '', categoryType: 'Coding', icon: 'chart', status: 'Active' });
    setCategoryError('');
    setIsSavingCategory(false);
  };

  const openEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setCategoryError('');
    setCategoryForm({
      title: category.title || '',
      description: category.description || category.subtitle || '',
      categoryType: category.categoryType || 'Coding',
      icon: category.icon || 'chart',
      status: category.status || 'Active',
    });
    setIsCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.title.trim()) {
      setCategoryError('Category title is required.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError('');

    try {
      if (editingCategoryId) {
        const updatedCategory = await adminAPI.updateQuestionCategory(editingCategoryId, categoryForm);
        const updatedTheme = {
          ...getCategoryTheme(updatedCategory.icon),
          ...updatedCategory,
          total: Number(updatedCategory.total ?? updatedCategory.totalQuestions ?? 0) || 0,
        };
        setCategoryState((prev) => prev.map((category) => (
          String(category.id) === String(editingCategoryId)
            ? {
              ...category,
              ...updatedTheme,
            }
            : category
        )));
        closeCategoryModal();
      } else {
        const createdCategory = await adminAPI.createQuestionCategory(categoryForm);
        const categoryWithTheme = {
          ...getCategoryTheme(createdCategory.icon),
          ...createdCategory,
          total: Number(createdCategory.total ?? createdCategory.totalQuestions ?? 0) || 0,
        };
        setCategoryState((prev) => [...prev, categoryWithTheme]);
        const slug = String(categoryWithTheme.slug || createdCategory.slug || '').trim();
        closeCategoryModal();
        if (slug) {
          navigate(`/question-dataset/${slug}`, { state: { openAddQuestion: true } });
        }
      }
    } catch (error) {
      setCategoryError(error.message || 'Failed to save category.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget?.id) return;
    setIsDeletingCategory(true);
    setCategoryError('');
    try {
      await adminAPI.deleteQuestionCategory(deleteCategoryTarget.id);
      setCategoryState((prev) => prev.filter((category) => String(category.id) !== String(deleteCategoryTarget.id)));
      setDeleteCategoryTarget(null);
    } catch (error) {
      setCategoryError(error.message || 'Failed to delete category.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={closeCategoryModal} />
          <div className="relative w-full max-w-xl rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1d45] shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingCategoryId ? 'Edit category' : 'Create category'}
              </h2>
              <button onClick={closeCategoryModal} className="text-black/45 dark:text-white/55 hover:text-black dark:hover:text-white" aria-label="Close category form">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!editingCategoryId && (
                <div className="rounded-xl border border-[#3c83f6]/25 bg-[#f0f6fc] dark:bg-[#0f274f]/80 px-3.5 py-3">
                  <p className="text-xs font-semibold text-[#0d2a57] dark:text-sky-200">Suggested workflow</p>
                  <ol className="mt-2 space-y-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-snug">
                    <li>Name the category and choose its <strong className="font-semibold text-slate-800 dark:text-slate-100">type</strong> (Coding, MCQ, or Notes).</li>
                    <li>Save — you&apos;ll open the question dataset for that category.</li>
                    <li>Use <strong className="font-semibold text-slate-800 dark:text-slate-100">Add Question</strong>; the correct form appears automatically from the type.</li>
                  </ol>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category name</label>
                <input
                  value={categoryForm.title}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. Arrays and hashing"
                  className="mt-1 w-full h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category type</label>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Controls which editor is used when adding questions to this dataset.</p>
                <div className="relative mt-1.5 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={categoryForm.categoryType}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, categoryType: event.target.value }))}
                    className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3.5 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="Coding">Coding</option>
                    <option className={dropdownOptionClass} value="MCQ">MCQ</option>
                    <option className={dropdownOptionClass} value="Notes">Notes</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short description for the category"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={categoryForm.status}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3.5 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="Active">Active</option>
                    <option className={dropdownOptionClass} value="Hidden">Hidden</option>
                    <option className={dropdownOptionClass} value="Draft">Draft</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Icon</label>
                <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                  <select
                    value={categoryForm.icon}
                    onChange={(event) => setCategoryForm((prev) => ({ ...prev, icon: event.target.value }))}
                    className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3.5 pr-10 text-sm font-medium text-slate-800 dark:text-white outline-none"
                  >
                    <option className={dropdownOptionClass} value="chart">Chart</option>
                    <option className={dropdownOptionClass} value="code">Code</option>
                    <option className={dropdownOptionClass} value="globe">Globe</option>
                    <option className={dropdownOptionClass} value="terminal">Terminal</option>
                    <option className={dropdownOptionClass} value="database">Database</option>
                    <option className={dropdownOptionClass} value="brain">Brain</option>
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
                </div>
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
                  {isSavingCategory ? 'Saving...' : editingCategoryId ? 'Save changes' : 'Save category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteCategoryTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a1d45] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-black/85 dark:text-white/90">Delete Category?</h3>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              Are you sure you want to delete <span className="font-semibold">{deleteCategoryTarget.title}</span>? Associated questions in this category will also be removed.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteCategoryTarget(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-medium text-black/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                disabled={isDeletingCategory}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white text-sm font-semibold inline-flex items-center gap-2"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isDeletingCategory ? 'Deleting...' : 'Delete'}
              </button>
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
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl md:text-2xl leading-tight font-semibold text-slate-900 dark:text-white">Question Categories</h2>
              </div>
              <button
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm({ title: '', description: '', categoryType: 'Coding', icon: 'chart', status: 'Active' });
                  setCategoryError('');
                  setIsCategoryModalOpen(true);
                }}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#3c83f6] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb]"
              >
                <FiPlus className="w-4 h-4" />
                Create category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {categoryState.map((category) => {
                const Icon = categoryIconMap[category.icon] || FiBarChart2;
                const isCrudEnabled = isPersistedCategory(category.id);
                const categoryName = category.title || 'Untitled category';
                const categoryType = category.categoryType || 'Coding';
                const categoryStatus = category.status || 'Active';
                const totalQuestions = Number(category.total ?? 0) || 0;

                return (
                  <article
                    key={category.id}
                    className="relative flex flex-col h-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1d45] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="absolute right-3 top-3 z-20">
                      <button
                        type="button"
                        className="category-actions-trigger w-8 h-8 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenCategoryMenuId((current) => (current === category.id ? null : category.id));
                        }}
                        aria-label="Open category actions"
                      >
                        <FiMoreHorizontal className="w-4 h-4" />
                      </button>

                      {openCategoryMenuId === category.id && (
                        <div className="category-actions-menu absolute right-0 top-9 w-40 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#071739] backdrop-blur-xl shadow-xl overflow-hidden">
                          <button
                            onClick={() => {
                              if (!isCrudEnabled) return;
                              setOpenCategoryMenuId(null);
                              openEditCategory(category);
                            }}
                            disabled={!isCrudEnabled}
                            className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${isCrudEnabled ? 'text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10' : 'text-black/35 dark:text-white/35 cursor-not-allowed'}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (!isCrudEnabled) return;
                              setOpenCategoryMenuId(null);
                              setDeleteCategoryTarget(category);
                            }}
                            disabled={!isCrudEnabled}
                            className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${isCrudEnabled ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-red-400/70 dark:text-red-400/45 cursor-not-allowed'}`}
                          >
                            Delete
                          </button>
                          {!isCrudEnabled && (
                            <p className="px-3.5 pb-2.5 text-[11px] text-black/45 dark:text-white/45">System category</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`px-5 pt-5 pb-4 border-b border-black/5 dark:border-white/10 ${category.topTint}`}>
                      <div className="flex items-start gap-3 pr-8">
                        <div
                          className={`shrink-0 h-11 w-11 rounded-xl flex items-center justify-center border border-black/10 dark:border-white/10 shadow-sm ${category.iconBg}`}
                          aria-hidden
                        >
                          <Icon className={`w-5 h-5 ${category.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-black/50 dark:text-white/50">Category name</p>
                          <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900 dark:text-white line-clamp-2">{categoryName}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 px-5 py-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Category type</span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${categoryTypeBadgeClass(categoryType)}`}
                        >
                          {categoryType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Status</span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryStatusBadgeClass(categoryStatus)}`}
                        >
                          {categoryStatus}
                        </span>
                      </div>
                      <div className="rounded-xl border border-black/10 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.04] px-3.5 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FiLayers className="w-4 h-4 shrink-0 text-[#3c83f6] dark:text-sky-300" aria-hidden />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total questions</span>
                        </div>
                        <span className="text-xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{totalQuestions}</span>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-0 mt-auto">
                      <button
                        type="button"
                        onClick={() => navigate(`/question-dataset/${category.slug}`)}
                        className="w-full h-10 rounded-xl bg-[#3c83f6] hover:bg-[#2563eb] text-white text-sm font-semibold transition-colors shadow-sm"
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



