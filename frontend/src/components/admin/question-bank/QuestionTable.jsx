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

export const QuestionTable = ({ questions = [], onView, onEdit, onDelete }) => {
  const getPrompt = (question) => question.description || question.problemDescription || question.title || 'No prompt provided';
  const getQid = (question, index) => question.qid || `QID-${String(index + 1).padStart(6, '0')}`;
  const getTags = (question) => Array.isArray(question.tags) ? question.tags.filter(Boolean) : [];

  return (
    <div className="space-y-4">
      {/* Mobile/Tablet Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {questions.map((question, index) => (
          <article
            key={question.id || question._id}
            className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl p-5 flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">#{index + 1}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3C83F6] dark:text-[#bceaff]">{getQid(question, index)}</span>
                  <span className={`inline-flex min-w-[54px] items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase ${difficultyPillClass(question.difficulty)}`}>
                    {question.difficulty || 'Easy'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-3 leading-relaxed">
                  {getPrompt(question)}
                </h4>
                {getTags(question).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {getTags(question).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#dbeafe] dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8] dark:text-[#bceaff]">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-3 text-slate-700 dark:text-slate-350">
              <button
                onClick={() => onView && onView(question)}
                className="p-2 rounded-lg hover:text-[#3c83f6] hover:bg-[#3c83f6]/10 transition-colors"
                aria-label="View question"
              >
                <FiEye className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => onEdit && onEdit(question)}
                className="p-2 rounded-lg hover:text-[#3c83f6] hover:bg-[#3c83f6]/10 transition-colors"
                aria-label="Edit question"
              >
                <FiEdit2 className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => onDelete && onDelete(question)}
                className="p-2 rounded-lg hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                aria-label="Delete question"
              >
                <FiTrash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </article>
        ))}

        {questions.length === 0 && (
          <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No questions found.
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl overflow-auto max-h-[78vh]">
        <table className="w-full min-w-[1000px] table-fixed">
          <thead className="border-b-2 border-black/12 dark:border-white/12">
            <tr className="sticky top-0 bg-white/95 dark:bg-[#13264c]/95 backdrop-blur">
              <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-14">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-32">QID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60">Prompt</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-56">Tags</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-32">Difficulty</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black/55 dark:text-white/60 w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="border-t border-black/20 dark:border-white/10">
            {questions.map((question, index) => (
              <tr
                key={question.id || question._id}
                className="border-b border-black/12 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/[0.04]"
              >
                <td className="px-4 py-3 text-sm font-semibold text-black/55 dark:text-white/60">
                  {index + 1}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-[#3C83F6] dark:text-[#bceaff] whitespace-nowrap">
                  {getQid(question, index)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white truncate" title={getPrompt(question)}>
                  {getPrompt(question)}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {getTags(question).length > 0 ? getTags(question).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-[#dbeafe] dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8] dark:text-[#bceaff]">{tag}</span>
                    )) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No tags</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex min-w-[54px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                    {question.difficulty || 'Easy'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <button
                      onClick={() => onView && onView(question)}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10"
                      aria-label="View question"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit && onEdit(question)}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-[#3C83F6] hover:bg-[#3C83F6]/10"
                      aria-label="Edit question"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(question)}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center hover:text-rose-500 hover:bg-rose-500/10"
                      aria-label="Delete question"
                    >
                      <FiTrash2 className="w-4 h-4" />
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
