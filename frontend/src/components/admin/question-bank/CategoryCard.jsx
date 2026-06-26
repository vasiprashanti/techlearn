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

export const CategoryCard = ({ category, onEdit, onDelete, onView, selected, onSelectToggle }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const iconKey = getCategoryIconKey(category.categoryType);
  const theme = getCategoryTheme(iconKey);
  const Icon = categoryIconMap[iconKey] || FiBarChart2;
  const categoryId = category.id || category._id;
  const isCrudEnabled = isPersistedCategory(categoryId);

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
    <article className={`relative rounded-2xl overflow-hidden border ${selected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] h-full flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group text-left`}>
      <div className="absolute left-4 top-4 z-20">
        <input
          type="checkbox"
          checked={selected}
          disabled={!isCrudEnabled}
          onChange={() => isCrudEnabled && onSelectToggle(categoryId)}
          className={`w-4.5 h-4.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30 ${!isCrudEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="absolute right-4 top-3.5 z-20 category-actions-container">
        <button
          type="button"
          className="w-8 h-8 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Open category actions"
        >
          <FiMoreHorizontal className="w-4.5 h-4.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 w-38 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => {
                if (!isCrudEnabled) return;
                setMenuOpen(false);
                onEdit(category);
              }}
              disabled={!isCrudEnabled}
              className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${isCrudEnabled ? 'text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10' : 'text-black/35 dark:text-white/35 cursor-not-allowed'}`}
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
              className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${isCrudEnabled ? 'text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-red-450/70 dark:text-red-450/45 cursor-not-allowed'}`}
            >
              Delete
            </button>
            {!isCrudEnabled && (
              <p className="px-3.5 pb-2.5 text-[10px] text-black/45 dark:text-white/45 border-t border-black/5 dark:border-white/5 pt-1.5 mt-1">System category</p>
            )}
          </div>
        )}
      </div>

      <div className={`px-4 pt-4 pb-3 flex items-center min-h-[76px] border-b border-black/10 dark:border-white/15 ${theme.topTint} pl-12 pr-12`}>
        <div className="flex items-center justify-between gap-2.5 text-left w-full">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-[15px] leading-snug font-bold text-slate-900 dark:text-white truncate" title={category.title}>{category.title}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5 truncate">
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/65 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 dark:text-slate-200">
                {category.categoryType || 'Coding'}
              </span>
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-white/65 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 dark:text-slate-200">
                {category.status || 'Draft'}
              </span>
            </div>
          </div>
          <div className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center border border-black/5 dark:border-white/10 shadow-sm shrink-0 bg-white/50 dark:bg-black/20 ${theme.iconBg}`}>
            <Icon className={`w-4.5 h-4.5 ${theme.iconColor}`} />
          </div>
        </div>
      </div>

      <div className="px-4 pt-3.5 pb-4 mt-auto bg-white/70 dark:bg-transparent flex flex-col gap-2.5 text-left">
        <div className="flex items-center justify-between gap-3 text-xs md:text-[13px] text-slate-550 dark:text-slate-400">
          <span>Total Questions</span>
          <span className="font-semibold text-slate-850 dark:text-slate-205 tabular-nums">{category.total || 0}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs md:text-[13px] text-slate-550 dark:text-slate-400">
          <span>Active Questions</span>
          <span className="font-semibold text-slate-850 dark:text-slate-205 tabular-nums">{category.active || 0}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs md:text-[13px] text-slate-550 dark:text-slate-400">
          <span>Status</span>
          <span className="font-semibold text-slate-850 dark:text-slate-205">{category.status || 'Draft'}</span>
        </div>

        <button
          onClick={() => onView(category)}
          className="mt-2.5 w-full h-[38px] rounded-xl bg-[#001b4a] hover:bg-[#062a66] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white text-xs sm:text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          View Questions
        </button>
      </div>
    </article>
  );
};

export default CategoryCard;
