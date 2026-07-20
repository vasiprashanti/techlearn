import React from 'react';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';

const difficultyPillClass = (difficulty) => {
  const norm = String(difficulty || '').trim();
  if (norm === 'Easy') return 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  if (norm === 'Medium') return 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300';
  return 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-455';
};

const statusPillClass = (status) => {
  const norm = String(status || '').trim();
  return norm === 'Active'
    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    : 'bg-slate-500/10 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400';
};

export const QuestionTable = ({ 
  questions = [], 
  onView, 
  onEdit, 
  onDelete, 
  isSelectionMode = false,
  selectedIds = [], 
  onSelectToggle, 
  onSelectAll 
}) => {
  const getPrompt = (question) => question.description || question.problemDescription || question.title || 'No prompt provided';
  const getQid = (question, index) => question.qid || `QID-${String(index + 1).padStart(6, '0')}`;
  const getTags = (question) => Array.isArray(question.tags) ? question.tags.filter(Boolean) : [];

  const allIds = questions.map(q => q.id || q._id);
  const allSelected = questions.length > 0 && allIds.every(id => selectedIds.includes(id));

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#0f1f43] border border-black/5 dark:border-white/10 rounded-xl overflow-auto max-h-[78vh]">
        <table className="w-full min-w-0 table-fixed">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30">
              <th className="px-2 py-2 text-center text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[55px] whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {isSelectionMode && (
                    <input 
                      type="checkbox" 
                      checked={allSelected} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectAll && onSelectAll([...new Set([...selectedIds, ...allIds])]);
                        } else {
                          onSelectAll && onSelectAll(selectedIds.filter(id => !allIds.includes(id)));
                        }
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                    />
                  )}
                  <span>#</span>
                </div>
              </th>
              <th className="px-2 py-2 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[100px] whitespace-nowrap">QID</th>
              <th className="px-2 py-2 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 whitespace-nowrap">Prompt</th>
              <th className="px-2 py-2 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[140px] whitespace-nowrap">Tags</th>
              <th className="px-2 py-2 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[100px] whitespace-nowrap">Difficulty</th>
              <th className="px-2 py-2 text-left text-[10px] sm:text-xs font-semibold text-black/45 dark:text-white/50 w-[110px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="border-t border-black/5 dark:border-white/10">
            {questions.map((question, index) => (
              <tr
                key={question.id || question._id}
                className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors"
              >
                <td className="px-2 py-2 text-center whitespace-nowrap w-[55px]">
                  <div className="flex items-center justify-center gap-1.5">
                    {isSelectionMode && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(question.id || question._id)} 
                        onChange={() => onSelectToggle && onSelectToggle(question.id || question._id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                      />
                    )}
                    <span className="text-[11px] sm:text-xs font-semibold text-black/45 dark:text-white/50">{index + 1}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-xs font-semibold text-[#3C83F6] dark:text-[#bceaff] whitespace-nowrap">
                  {getQid(question, index)}
                </td>
                <td className="px-2 py-2 text-[11px] sm:text-xs font-medium text-slate-800 dark:text-white/85 truncate" title={getPrompt(question)}>
                  {getPrompt(question)}
                </td>
                <td className="px-2 py-2 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {getTags(question).length > 0 ? getTags(question).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#dbeafe] dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#1d4ed8] dark:text-[#bceaff]">{tag}</span>
                    )) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">No tags</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-xs">
                  <span className={`inline-flex min-w-[50px] items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                    {question.difficulty || 'Easy'}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <button
                      onClick={() => onView && onView(question)}
                      className="w-7 h-7 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 transition-colors"
                      aria-label="View question"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit && onEdit(question)}
                      className="w-7 h-7 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10 transition-colors"
                      aria-label="Edit question"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(question)}
                      className="w-7 h-7 rounded-lg inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      aria-label="Delete question"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {questions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default QuestionTable;
