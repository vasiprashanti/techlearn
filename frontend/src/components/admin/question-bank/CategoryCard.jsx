import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiCode, FiCheckSquare, FiBook, FiMoreHorizontal } from 'react-icons/fi';

const categoryIconMap = {
  code: FiCode,
  check: FiCheckSquare,
  book: FiBook,
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
    case 'check':
      return {
        topTint: 'bg-[#d2e9e5] dark:bg-[#204744]',
        iconBg: 'bg-[#e4f4f1] dark:bg-[#285954]',
        iconColor: 'text-[#129775] dark:text-emerald-300',
      };
    case 'book':
      return {
        topTint: 'bg-[#efe6d2] dark:bg-[#4f4228]',
        iconBg: 'bg-[#f8f0df] dark:bg-[#625133]',
        iconColor: 'text-[#d17d00] dark:text-amber-300',
      };
    default:
      return {
        topTint: 'bg-[#d8e6ef] dark:bg-[#24384e]',
        iconBg: 'bg-[#e7f0f6] dark:bg-[#30495f]',
        iconColor: 'text-[#3c83f6] dark:text-blue-300',
      };
  }
};

const getCategoryIconKey = (type) => {
  switch (type?.toLowerCase()) {
    case 'coding': return 'code';
    case 'mcq': return 'check';
    case 'notes': return 'book';
    default: return 'chart';
  }
};

const isPersistedCategory = (categoryId) => /^[a-f0-9]{24}$/i.test(String(categoryId || ''));

export const CategoryCard = ({ category, onEdit, onDelete, onView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const iconKey = getCategoryIconKey(category.categoryType);
  const theme = getCategoryTheme(iconKey);
  const Icon = categoryIconMap[iconKey] || FiBarChart2;
  const isCrudEnabled = isPersistedCategory(category.id);

  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (!event.target.closest('.category-actions-container')) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <article className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-white dark:bg-[#0f1f43] backdrop-blur-xl shadow-sm h-full flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group">
      <div className="absolute right-3 top-3 z-20 category-actions-container">
        <button
          type="button"
          className="w-8 h-8 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Open category actions"
        >
          <FiMoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 w-40 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => {
                if (!isCrudEnabled) return;
                setMenuOpen(false);
                onEdit(category);
              }}
              disabled={!isCrudEnabled}
              className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors ${isCrudEnabled ? 'text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10' : 'text-black/35 dark:text-white/35 cursor-not-allowed'}`}
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (!isCrudEnabled) return;
                setMenuOpen(false);
                onDelete(category);
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

      <div className={`px-4 pt-6 pb-3 min-h-[112px] border-b border-black/5 dark:border-white/15 ${theme.topTint}`}>
        <div className="flex items-start gap-2.5">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm ${theme.iconBg}`}>
            <Icon className={`w-5 h-5 ${theme.iconColor}`} />
          </div>
          <div className="min-h-[64px] flex-1 min-w-0">
            <h3 className="text-base md:text-lg leading-tight font-semibold text-slate-900 dark:text-white truncate">{category.title}</h3>
            <p className="mt-1 text-[11px] md:text-xs leading-tight text-slate-500 dark:text-slate-300 line-clamp-2">{category.subtitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/65 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                {category.categoryType || 'Coding'}
              </span>
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/65 dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                {category.status || 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 mt-auto bg-white/70 dark:bg-transparent">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <span>Total Questions</span>
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{category.total || 0}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <span>Active Questions</span>
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{category.active || 0}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <span>Status</span>
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{category.status || 'Draft'}</span>
        </div>

        <button
          onClick={() => onView(category)}
          className="mt-4 w-full h-10 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          View Questions
        </button>
      </div>
    </article>
  );
};

export default CategoryCard;
