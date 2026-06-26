import React, { useState, useEffect } from 'react';
import { FiBarChart2, FiCode, FiCheckSquare, FiBook, FiMoreHorizontal } from 'react-icons/fi';

const categoryIconMap = {
  code: FiCode,
  check: FiCheckSquare,
  book: FiBook,
  chart: FiBarChart2,
};

const getCategoryTheme = (icon) => {
  return {
    topTint: 'bg-[#d8e6ef] dark:bg-[#24384e]',
    iconBg: 'bg-[#e7f0f6] dark:bg-[#30495f]',
    iconColor: 'text-[#3c83f6] dark:text-blue-300',
  };
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
    <article className={`relative rounded-xl overflow-hidden border ${selected ? 'border-[#3C83F6] ring-1 ring-[#3C83F6]/50 dark:border-blue-400 dark:ring-blue-400/50' : 'border-black/10 dark:border-white/15'} bg-white/80 dark:bg-[#0f1f43] backdrop-blur-xl shadow-[0_3px_10px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_16px_rgba(0,0,0,0.15)] h-full flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group`}>
      <div className="absolute left-3 top-2.5 z-20">
        <input
          type="checkbox"
          checked={selected}
          disabled={!isCrudEnabled}
          onChange={() => isCrudEnabled && onSelectToggle(categoryId)}
          className={`w-3.5 h-3.5 rounded border-black/15 dark:border-white/20 text-[#3C83F6] focus:ring-[#3C83F6] cursor-pointer bg-white/70 dark:bg-black/30 ${!isCrudEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        />
      </div>

      <div className="absolute right-2 top-2 z-20 category-actions-container">
        <button
          type="button"
          className="w-6 h-6 rounded-lg border border-transparent text-black/45 dark:text-white/45 hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10 transition-colors flex items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Open category actions"
        >
          <FiMoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-7 w-36 rounded-xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43] backdrop-blur-xl shadow-xl overflow-hidden z-20">
            <button
              onClick={() => {
                if (!isCrudEnabled) return;
                setMenuOpen(false);
                onEdit(category);
              }}
              disabled={!isCrudEnabled}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${isCrudEnabled ? 'text-black/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10' : 'text-black/35 dark:text-white/35 cursor-not-allowed'}`}
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
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${isCrudEnabled ? 'text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-red-400/70 dark:text-red-400/45 cursor-not-allowed'}`}
            >
              Delete
            </button>
            {!isCrudEnabled && (
              <p className="px-3 pb-2 text-[10px] text-black/45 dark:text-white/45">System category</p>
            )}
          </div>
        )}
      </div>

      {/* Top Panel (highlighted/green sections of the cards) */}
      {/* pl-11 to account for checkbox on the left */}
      <div className={`px-4 pt-4 pb-3.5 min-h-[72px] border-b border-black/10 dark:border-white/15 ${theme.topTint} pl-11 pr-4 flex items-center`}>
        <div className="flex items-center justify-between gap-2.5 text-left w-full">
          <div className="flex-1 min-w-0">
            <h3 className="text-xs md:text-sm leading-snug font-bold text-slate-900 dark:text-white truncate">{category.title}</h3>
            <p className="mt-0.5 text-[10px] md:text-[11px] leading-tight text-slate-500 dark:text-slate-355 truncate">{category.categoryType || 'Coding'}</p>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="px-4 py-3.5 mt-auto bg-white/70 dark:bg-transparent flex flex-col gap-2 text-left">
        <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-555 dark:text-slate-400">
          <span>Total Questions</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{category.total || 0}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-555 dark:text-slate-400">
          <span>Active Questions</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{category.active || 0}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] md:text-[12px] text-slate-555 dark:text-slate-400">
          <span>Status</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{category.status || 'Draft'}</span>
        </div>

        {/* View button */}
        <button
          onClick={() => onView(category)}
          className="mt-3 w-full h-9 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          View Questions
        </button>
      </div>
    </article>
  );
};

export default CategoryCard;
