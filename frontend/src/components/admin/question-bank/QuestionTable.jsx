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

  return (
    <div className="space-y-4">
      {/* Mobile/Tablet Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {questions.map((question, index) => (
          <article
            key={question.id || question._id}
            className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl p-4 flex flex-col hover:bg-white dark:hover:bg-[#162a52] hover:shadow-md transition-all duration-300 group"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">#{index + 1}</p>
                <h4 className="mt-1 text-base font-semibold text-slate-900 dark:text-white line-clamp-2">
                  {getPrompt(question)}
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {(question.tags || []).join(', ') || 'No tag'}
                </p>
              </div>
              <span className={`shrink-0 inline-flex min-w-[54px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                {question.difficulty || 'Easy'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">Created</p>
                <p className="mt-0.5 text-slate-700 dark:text-slate-350">
                  {question.created ? new Date(question.created).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">Status</p>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-semibold leading-none ${statusPillClass(question.status || 'Active')}`}>
                    {question.status || 'Active'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-3 text-slate-700 dark:text-slate-300">
              <button
                onClick={() => onView && onView(question)}
                className="p-2 rounded-lg hover:text-[#3c83f6] hover:bg-[#3c83f6]/10 transition-colors"
                aria-label="View question"
              >
                <FiEye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onEdit && onEdit(question)}
                className="p-2 rounded-lg hover:text-[#3c83f6] hover:bg-[#3c83f6]/10 transition-colors"
                aria-label="Edit question"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete && onDelete(question)}
                className="p-2 rounded-lg hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                aria-label="Delete question"
              >
                <FiTrash2 className="w-4 h-4" />
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
      <div className="hidden lg:block rounded-2xl border border-black/10 dark:border-white/15 overflow-hidden bg-white dark:bg-[#0a1737] backdrop-blur-xl shadow-sm">
        <div className="relative">
          <div className="overflow-x-auto" style={{ scrollbarGutter: 'stable both-edges' }}>
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 bg-[#edf3fb] dark:bg-white/[0.01]">
                  <th className="w-16 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">#</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Prompt</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tag</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Difficulty</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Track</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {questions.map((question, index) => (
                  <tr
                    key={question.id || question._id}
                    className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="px-5 py-4 text-xs font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white max-w-[360px]">
                      <p className="line-clamp-2" title={getPrompt(question)}>{getPrompt(question)}</p>
                    </td>
                    <td className="px-5 py-4 text-xs md:text-sm text-slate-600 dark:text-slate-350 font-medium max-w-[180px] truncate">
                      {(question.tags || []).join(', ') || 'No tag'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex min-w-[54px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none ${difficultyPillClass(question.difficulty)}`}>
                        {question.difficulty || 'Easy'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs md:text-sm text-slate-600 dark:text-slate-350 font-medium">
                      {question.track || question.trackType || 'General'}
                    </td>
                    <td className="px-5 py-4 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-mono">
                      {question.created ? new Date(question.created).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${statusPillClass(question.status || 'Active')}`}>
                        {question.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                        <button
                          onClick={() => onView && onView(question)}
                          className="p-1 hover:text-[#3c83f6] transition-colors"
                          aria-label="View question"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit && onEdit(question)}
                          className="p-1 hover:text-[#3c83f6] transition-colors"
                          aria-label="Edit question"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(question)}
                          className="p-1 hover:text-rose-500 transition-colors"
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
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No questions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionTable;
