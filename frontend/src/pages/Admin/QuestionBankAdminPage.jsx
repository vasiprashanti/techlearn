import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiCode, FiGrid, FiChevronDown, FiSearch } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/AdminDashbaord/Admin_Sidebar';
import LoadingScreen from '../../components/AdminDashbaord/AdminPageLoader';
import CategoryListPanel from '../../components/admin/question-bank/CategoryListPanel';
import CategoryCreateModal from '../../components/admin/question-bank/CategoryCreateModal';
import { useQuestionBankCategories } from '../../hooks/useQuestionBankCategories';
import { questionBankApi } from '../../api/questionBankApi';

export const QuestionBankAdminPage = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { categories = [], loading, error, refetch } = useQuestionBankCategories();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPageScrolled, setIsPageScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('MCQ');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [sortBy, setSortBy] = useState('newest');

  const handleSelectToggle = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedCategoryIds([]);
  };

  const handleBulkDelete = async () => {
    setCategoryError('');
    setIsBulkDeleting(true);
    try {
      await questionBankApi.bulkDeleteCategories(selectedCategoryIds);
      await refetch();
      setSelectedCategoryIds([]);
      setIsBulkDeleteConfirmOpen(false);
    } catch (err) {
      setCategoryError(err.message || 'Failed to bulk delete categories.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const isDarkMode = theme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <LoadingScreen />;
  }

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleEditCategoryClick = (category) => {
    setEditingCategory(category);
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategoryClick = (category) => {
    setDeleteCategoryTarget(category);
    setCategoryError('');
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryError('');
  };

  const handleSaveCategory = async (formPayload) => {
    try {
      if (editingCategory) {
        const editableFields = {
          title: formPayload.title,
          status: formPayload.status,
          visibility: formPayload.visibility,
        };
        await questionBankApi.updateCategory(editingCategory.id || editingCategory._id, editableFields);
      } else {
        await questionBankApi.createCategory(formPayload);
      }
      await refetch();
      handleCloseCategoryModal();
    } catch (err) {
      setCategoryError(err.message || 'Failed to save category.');
      throw err;
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryTarget?.id && !deleteCategoryTarget?._id) return;
    setIsDeletingCategory(true);
    setCategoryError('');
    try {
      await questionBankApi.deleteCategory(deleteCategoryTarget.id || deleteCategoryTarget._id);
      await refetch();
      setDeleteCategoryTarget(null);
    } catch (err) {
      setCategoryError(err.message || 'Failed to delete category.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleViewCategory = (category) => {
    navigate(`/admin/question-bank/${category.id || category._id}`);
  };

  const totalQuestionsCount = categories.reduce((sum, cat) => sum + (cat.total || 0), 0);
  const activeCategoriesCount = categories.filter((cat) => cat.status === 'Active').length;
  const draftCategoriesCount = categories.filter((cat) => cat.status === 'Draft').length;
  const getCategoryTime = (category, fields) => {
    for (const field of fields) {
      const timestamp = new Date(category?.[field] || 0).getTime();
      if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;
    }
    return 0;
  };
  const filteredCategories = categories
    .filter((category) => {
      const q = categorySearch.trim().toLowerCase();
      const matchesSearch = !q ||
        String(category.title || '').toLowerCase().includes(q) ||
        String(category.categoryType || '').toLowerCase().includes(q);
      const matchesType = category.categoryType === typeFilter;
      const matchesStatus = category.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return getCategoryTime(a, ['createdAt']) - getCategoryTime(b, ['createdAt']);
      if (sortBy === 'last-opened') {
        return getCategoryTime(b, ['lastOpenedAt', 'openedAt', 'updatedAt', 'createdAt']) -
          getCategoryTime(a, ['lastOpenedAt', 'openedAt', 'updatedAt', 'createdAt']);
      }
      return getCategoryTime(b, ['createdAt']) - getCategoryTime(a, ['createdAt']);
    });

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased admin-dashboard-typography text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Category Create/Edit Modal */}
      <CategoryCreateModal
        isOpen={isCategoryModalOpen}
        editingCategory={editingCategory}
        onSave={handleSaveCategory}
        onClose={handleCloseCategoryModal}
      />

      {/* Delete Category Confirmation Dialog */}
      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDeleteCategoryTarget(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#3C83F6] dark:text-[#bceaff]">Delete Category?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteCategoryTarget.title}</span>? This will permanently delete the category and archive all associated questions.
            </p>
            {categoryError && (
              <p className="mt-3 text-xs text-red-500">{categoryError}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteCategoryTarget(null)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategory}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isDeletingCategory ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[145] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setIsBulkDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0a1737]/95 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Bulk Delete Categories?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to delete the {selectedCategoryIds.length} selected categories? This will permanently delete them and archive all associated questions.
            </p>
            {categoryError && (
              <p className="mt-3 text-xs text-red-500">{categoryError}</p>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/15 text-sm font-medium text-black/65 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Gradient */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]'}`} />
      
      {/* Admin Sidebar Navigation */}
      <Sidebar onToggle={setSidebarCollapsed} isCollapsed={sidebarCollapsed} />

      {/* Main Content Pane */}
      <main
        onScroll={(e) => setIsPageScrolled(e.currentTarget.scrollTop > 12)}
        className={`flex-1 h-screen transition-all duration-700 ease-in-out z-10 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} pt-28 pb-12 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 overflow-y-auto overflow-x-hidden`}
      >
        <div className="max-w-[1600px] mx-auto space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 mt-4">
              <div className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <button onClick={refetch} className="font-semibold underline underline-offset-2">Retry</button>
              </div>
            </div>
          )}

          <div>
            <h1 className="admin-page-title">Question Bank</h1>
          </div>

          {/* Metrics Statistics section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-3.5 sm:px-4 py-3 flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center shrink-0">
                <FiCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Total Questions</p>
                <p className="mt-0.5 text-lg sm:text-2xl font-semibold tracking-tight leading-none text-[#3C83F6] dark:text-[#bceaff]">{totalQuestionsCount}</p>
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-3.5 sm:px-4 py-3 flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FiGrid className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Total Categories</p>
                <p className="mt-0.5 text-lg sm:text-2xl font-semibold tracking-tight leading-none text-[#3C83F6] dark:text-[#bceaff]">{categories.length}</p>
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-3.5 sm:px-4 py-3 flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FiGrid className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Active Categories</p>
                <p className="mt-0.5 text-lg sm:text-2xl font-semibold tracking-tight leading-none text-[#3C83F6] dark:text-[#bceaff]">{activeCategoriesCount}</p>
              </div>
            </article>

            <article className="bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-xl px-3.5 sm:px-4 py-3 flex items-center gap-3 shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <FiGrid className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Draft Categories</p>
                <p className="mt-0.5 text-lg sm:text-2xl font-semibold tracking-tight leading-none text-[#3C83F6] dark:text-[#bceaff]">{draftCategoriesCount}</p>
              </div>
            </article>
          </section>

          {/* Category Listing Container */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl leading-tight font-semibold text-slate-900 dark:text-white">Question Categories</h2>
                
                <div className="flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl h-9 shrink-0">
                  <input
                    type="checkbox"
                    checked={filteredCategories.length > 0 && filteredCategories.every(c => selectedCategoryIds.includes(c.id || c._id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newSelections = new Set([...selectedCategoryIds, ...filteredCategories.map(c => c.id || c._id)]);
                        setSelectedCategoryIds(Array.from(newSelections));
                      } else {
                        setSelectedCategoryIds(selectedCategoryIds.filter(id => !filteredCategories.some(c => (c.id || c._id) === id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white dark:bg-black/30"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">Select All</span>
                </div>
              </div>
              <button
                onClick={handleAddCategoryClick}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] px-5 text-sm font-semibold transition-colors shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/45" />
                <input
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories..."
                  className="h-10 w-full rounded-xl border border-black/10 bg-white/80 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#3C83F6]/25 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"
                />
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-black/10 bg-white/80 px-3 pr-9 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#3C83F6]/25 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"
                >
                  <option value="MCQ">MCQ</option>
                  <option value="Coding">Coding</option>
                  <option value="Query">Query</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 dark:text-white/60" />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-black/10 bg-white/80 px-3 pr-9 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#3C83F6]/25 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 dark:text-white/60" />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-black/10 bg-white/80 px-3 pr-9 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-[#3C83F6]/25 dark:border-white/15 dark:bg-[#0f1f43] dark:text-white"
                >
                  <option value="oldest">Oldest First</option>
                  <option value="newest">Newest First</option>
                  <option value="last-opened">Last Opened</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45 dark:text-white/60" />
              </div>
            </div>

            <CategoryListPanel
              categories={filteredCategories}
              selectedCategoryIds={selectedCategoryIds}
              onSelectToggle={handleSelectToggle}
              onEditCategory={handleEditCategoryClick}
              onDeleteCategory={handleDeleteCategoryClick}
              onViewCategory={handleViewCategory}
              onAddCategory={handleAddCategoryClick}
            />
          </section>

          {/* Floating Bulk Action Bar */}
          {selectedCategoryIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3.5 rounded-full border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#0f1f43]/85 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom duration-300">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'category' : 'categories'} selected
              </span>
              <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
              <button
                onClick={handleClearSelection}
                className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Clear
              </button>
              <button
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuestionBankAdminPage;
