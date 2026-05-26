import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiCode, FiGrid } from 'react-icons/fi';
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
          subtitle: formPayload.subtitle,
          status: formPayload.status,
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
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{deleteCategoryTarget.title}</span>? This will permanently delete the category and all associated questions.
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

      {/* Background Gradient */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? 'bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]' : 'bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]'}`} />
      
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
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <article className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl px-5 py-4 min-h-[112px] sm:min-h-[104px] flex items-center gap-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#3C83F6]/10 dark:bg-[#bceaff]/20 text-[#3C83F6] dark:text-[#bceaff] flex items-center justify-center shrink-0">
                <FiCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-light tracking-tight leading-none text-black dark:text-white">{totalQuestionsCount}</p>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">Total Questions</p>
              </div>
            </article>

            <article className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl px-5 py-4 min-h-[112px] sm:min-h-[104px] flex items-center gap-3.5 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FiGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-light tracking-tight leading-none text-black dark:text-white">{categories.length}</p>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">Total Categories</p>
              </div>
            </article>
          </section>

          {/* Category Listing Container */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl md:text-2xl leading-tight font-semibold text-slate-900 dark:text-white">Question Categories</h2>
              <button
                onClick={handleAddCategoryClick}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] px-5 text-sm font-semibold transition-colors shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            <CategoryListPanel
              categories={categories}
              onEditCategory={handleEditCategoryClick}
              onDeleteCategory={handleDeleteCategoryClick}
              onViewCategory={handleViewCategory}
              onAddCategory={handleAddCategoryClick}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default QuestionBankAdminPage;
