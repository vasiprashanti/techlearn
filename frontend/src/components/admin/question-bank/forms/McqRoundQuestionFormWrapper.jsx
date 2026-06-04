import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

export const McqRoundQuestionFormWrapper = ({
  formData,
  onChange,
  onMcqOptionChange,
}) => {
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const inputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35 transition-all';

  const options = formData.options || ['A', 'B', 'C', 'D'].map(label => ({ label, text: '' }));

  return (
    <div className="space-y-2">
      <div className="border-t border-black/10 dark:border-white/10 pt-2">
        <h3 className="text-sm font-semibold text-[#3C83F6] dark:text-[#bceaff] uppercase tracking-wider text-xs font-bold">MCQ Options</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((option, index) => (
          <div key={option.label}>
            <label className="admin-micro-label text-black/45 dark:text-white/45">Option {option.label}</label>
            <input
              value={option.text || ''}
              onChange={(e) => onMcqOptionChange(index, e.target.value)}
              className={inputClass}
              placeholder={`Enter text for Option ${option.label}`}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
        <div>
          <label className="admin-micro-label text-black/45 dark:text-white/45">Correct Option</label>
          <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
            <select
              value={formData.correctOption || 'A'}
              onChange={(e) => onChange('correctOption', e.target.value)}
              className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
            >
              {options.map((option) => (
                <option className={dropdownOptionClass} key={option.label} value={option.label}>
                  Option {option.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
          </div>
        </div>
        <div>
          <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation</label>
          <input
            value={formData.explanation || ''}
            onChange={(e) => onChange('explanation', e.target.value)}
            placeholder="Explain why this option is correct"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
};

export default McqRoundQuestionFormWrapper;
