import React from 'react';
import { FiChevronDown } from 'react-icons/fi';

export const CodingRoundQuestionFormWrapper = ({
  formData,
  onChange,
  onTestCaseChange,
  onAddTestCase,
  onRemoveTestCase,
  expandedSections,
  onToggleSection,
}) => {
  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';
  const textareaClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35 transition-all';
  const inputClass = 'mt-1 w-full px-3 py-2.5 text-sm rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] text-slate-800 dark:text-white placeholder:text-black/35 dark:placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#3C83F6]/30 dark:focus:ring-[#7fb1ff]/35 transition-all';

  return (
    <div className="space-y-4">
      <div className="border-t border-black/10 dark:border-white/10 pt-4">
        <h3 className="text-xs font-bold text-[#3C83F6] dark:text-[#bceaff] uppercase tracking-wider">Coding Specifications</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="admin-micro-label text-black/45 dark:text-white/45">Input Format</label>
          <textarea
            value={formData.inputFormat || ''}
            onChange={(e) => onChange('inputFormat', e.target.value)}
            rows={2}
            placeholder="Describe input format"
            className={textareaClass}
          />
        </div>

        <div>
          <label className="admin-micro-label text-black/45 dark:text-white/45">Output Format</label>
          <textarea
            value={formData.outputFormat || ''}
            onChange={(e) => onChange('outputFormat', e.target.value)}
            rows={2}
            placeholder="Describe output format"
            className={textareaClass}
          />
        </div>

        <div>
          <label className="admin-micro-label text-black/45 dark:text-white/45">Time Limit (seconds)</label>
          <input
            type="number"
            min="1"
            value={formData.timeLimit || '1'}
            onChange={(e) => onChange('timeLimit', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="admin-micro-label text-black/45 dark:text-white/45">Memory Limit (MB)</label>
          <input
            type="number"
            min="1"
            value={formData.memoryLimit || '256'}
            onChange={(e) => onChange('memoryLimit', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Visible Test Cases */}
      <section className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] overflow-hidden shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
        <button
          type="button"
          onClick={() => onToggleSection('visible')}
          className="w-full px-4 py-3 border-b border-black/10 dark:border-white/15 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Visible Test Cases</h3>
            <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-[#d1e6f8] dark:bg-[#1f365c] text-[11px] font-semibold text-black/75 dark:text-white/85">
              {(formData.visibleTestCases || []).length}
            </span>
          </div>
          <FiChevronDown
            className={`w-4 h-4 text-black/55 dark:text-white/60 transition-transform ${expandedSections?.visible ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections?.visible && (
          <div className="px-4 py-3 space-y-4 bg-white/40 dark:bg-black/10">
            <p className="text-xs text-black/45 dark:text-white/45">These test cases are visible to students when they run their code.</p>
            {(formData.visibleTestCases || []).map((testCase, index) => (
              <div key={`visible-${index}`} className="rounded-xl border border-black/10 dark:border-white/15 bg-slate-50 dark:bg-black/25 p-3.5 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Test Case #{index + 1}</p>
                  {(formData.visibleTestCases || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveTestCase('visibleTestCases', index)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => onTestCaseChange('visibleTestCases', index, 'input', e.target.value)}
                      rows={3}
                      className={textareaClass}
                    />
                  </div>
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Output</label>
                    <textarea
                      value={testCase.output}
                      onChange={(e) => onTestCaseChange('visibleTestCases', index, 'output', e.target.value)}
                      rows={3}
                      className={textareaClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation (optional)</label>
                  <input
                    value={testCase.explanation || ''}
                    onChange={(e) => onTestCaseChange('visibleTestCases', index, 'explanation', e.target.value)}
                    placeholder="Brief explanation..."
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddTestCase('visibleTestCases')}
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold text-black/85 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              + Add Visible Test Case
            </button>
          </div>
        )}
      </section>

      {/* Hidden Test Cases */}
      <section className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] overflow-hidden shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
        <button
          type="button"
          onClick={() => onToggleSection('hidden')}
          className="w-full px-4 py-3 border-b border-black/10 dark:border-white/15 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Hidden Test Cases</h3>
            <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-[#d1e6f8] dark:bg-[#1f365c] text-[11px] font-semibold text-black/75 dark:text-white/85">
              {(formData.hiddenTestCases || []).length}
            </span>
          </div>
          <FiChevronDown
            className={`w-4 h-4 text-black/55 dark:text-white/60 transition-transform ${expandedSections?.hidden ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections?.hidden && (
          <div className="px-4 py-3 space-y-4 bg-white/40 dark:bg-black/10">
            <p className="text-xs text-black/45 dark:text-white/45">Hidden test cases are used for grading and are not visible to students.</p>
            {(formData.hiddenTestCases || []).map((testCase, index) => (
              <div key={`hidden-${index}`} className="rounded-xl border border-black/10 dark:border-white/15 bg-slate-50 dark:bg-black/25 p-3.5 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Hidden Test Case #{index + 1}</p>
                  {(formData.hiddenTestCases || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveTestCase('hiddenTestCases', index)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => onTestCaseChange('hiddenTestCases', index, 'input', e.target.value)}
                      rows={3}
                      className={textareaClass}
                    />
                  </div>
                  <div>
                    <label className="admin-micro-label text-black/45 dark:text-white/45">Output</label>
                    <textarea
                      value={testCase.output}
                      onChange={(e) => onTestCaseChange('hiddenTestCases', index, 'output', e.target.value)}
                      rows={3}
                      className={textareaClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation (optional)</label>
                  <input
                    value={testCase.explanation || ''}
                    onChange={(e) => onTestCaseChange('hiddenTestCases', index, 'explanation', e.target.value)}
                    placeholder="Brief explanation..."
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddTestCase('hiddenTestCases')}
              className="w-full h-10 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold text-black/85 dark:text-white/85 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              + Add Hidden Test Case
            </button>
          </div>
        )}
      </section>

      {/* Reference Solution */}
      <section className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#0f1f43] overflow-hidden shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
        <button
          type="button"
          onClick={() => onToggleSection('reference')}
          className="w-full px-4 py-3 border-b border-black/10 dark:border-white/15 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        >
          <h3 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">Reference Solution</h3>
          <FiChevronDown
            className={`w-4 h-4 text-black/55 dark:text-white/60 transition-transform ${expandedSections?.reference ? 'rotate-180' : ''}`}
          />
        </button>
        {expandedSections?.reference && (
          <div className="px-4 py-3 space-y-4 bg-white/40 dark:bg-black/10">
            <div>
              <label className="admin-micro-label text-black/45 dark:text-white/45">Language</label>
              <div className="relative mt-1 rounded-xl border border-black/10 dark:border-white/15 bg-white/85 dark:bg-[#0f1f43] shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
                <select
                  value={formData.referenceLanguage || 'C++'}
                  onChange={(e) => onChange('referenceLanguage', e.target.value)}
                  className="appearance-none w-full px-3 py-2.5 pr-10 text-sm font-medium rounded-xl border-0 bg-transparent text-slate-800 dark:text-white outline-none"
                >
                  <option className={dropdownOptionClass}>C++</option>
                  <option className={dropdownOptionClass}>Python</option>
                  <option className={dropdownOptionClass}>Java</option>
                  <option className={dropdownOptionClass}>JavaScript</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45 dark:text-white/60" />
              </div>
            </div>
            <div>
              <label className="admin-micro-label text-black/45 dark:text-white/45">Solution Code</label>
              <textarea
                value={formData.solutionCode || ''}
                onChange={(e) => onChange('solutionCode', e.target.value)}
                rows={6}
                placeholder="Paste reference solution code"
                className={`${textareaClass} font-mono`}
              />
            </div>
            <div>
              <label className="admin-micro-label text-black/45 dark:text-white/45">Explanation / Editorial</label>
              <textarea
                value={formData.editorial || ''}
                onChange={(e) => onChange('editorial', e.target.value)}
                rows={3}
                placeholder="Add editorial notes"
                className={textareaClass}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default CodingRoundQuestionFormWrapper;
