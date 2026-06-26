import React, { useState, useMemo } from 'react';
import { FiSearch, FiPlus, FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import QuestionTable from './QuestionTable';

export const CategoryDetailPanel = ({
  category = {},
  questions = [],
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onViewQuestion,
  onBulkAddQuestions,
  usageAnalytics,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All levels');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortBy, setSortBy] = useState('newest');
  const [tagFilter, setTagFilter] = useState('All tags');
  const [activeTab, setActiveTab] = useState('questions');

  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        String(question.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(question.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.tags || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(question.track || question.trackType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === 'All levels' ||
        String(question.difficulty).toLowerCase() === difficultyFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All statuses' ||
        String(question.status || 'Active').toLowerCase() === statusFilter.toLowerCase();
      const matchesTag =
        tagFilter === 'All tags' ||
        (question.tags || []).some((tag) => String(tag).toLowerCase() === tagFilter.toLowerCase());

      return matchesSearch && matchesDifficulty && matchesStatus && matchesTag;
    });
  }, [questions, searchTerm, difficultyFilter, statusFilter, tagFilter]);

  const sortedQuestions = useMemo(() => [...filteredQuestions].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created || 0) - new Date(b.created || 0);
    if (sortBy === 'prompt') return String(a.description || a.title || '').localeCompare(String(b.description || b.title || ''));
    if (sortBy === 'easy-hard') return ['Easy', 'Medium', 'Hard'].indexOf(a.difficulty) - ['Easy', 'Medium', 'Hard'].indexOf(b.difficulty);
    if (sortBy === 'hard-easy') return ['Hard', 'Medium', 'Easy'].indexOf(a.difficulty) - ['Hard', 'Medium', 'Easy'].indexOf(b.difficulty);
    return new Date(b.created || 0) - new Date(a.created || 0);
  }), [filteredQuestions, sortBy]);

  const activeQuestionsCount = useMemo(() => {
    return questions.filter(q => q.status === 'Active' || !q.status).length;
  }, [questions]);

  const uniqueTags = useMemo(() => Array.from(new Set(questions.flatMap((question) => question.tags || []).filter(Boolean))).sort(), [questions]);
  const difficultyCounts = useMemo(() => ({
    Easy: questions.filter((q) => q.difficulty === 'Easy').length,
    Medium: questions.filter((q) => q.difficulty === 'Medium').length,
    Hard: questions.filter((q) => q.difficulty === 'Hard').length,
  }), [questions]);

  const usageTotals = usageAnalytics?.totals || {};
  const usageTemplates = usageAnalytics?.trackTemplates || [];
  const usageBatches = usageAnalytics?.batches || [];
  const usageStatCards = [
    ['Total Questions', usageTotals.totalQuestions ?? questions.length],
    ['Active Questions', usageTotals.activeQuestions ?? activeQuestionsCount],
    ['Easy Questions', usageTotals.easyQuestions ?? difficultyCounts.Easy],
    ['Medium Questions', usageTotals.mediumQuestions ?? difficultyCounts.Medium],
    ['Hard Questions', usageTotals.hardQuestions ?? difficultyCounts.Hard],
    ['Used In Track Templates', usageTotals.usedInTrackTemplates ?? 0],
    ['Active Tracks', usageTotals.activeTracks ?? 0],
    ['Active Batches', usageTotals.activeBatches ?? 0],
    ['Students Reached', usageTotals.studentsReached ?? 0],
  ];

  return (
    <div className="space-y-6">
      {/* Back navigation & Header */}
      <div>
        <button
          onClick={() => navigate('/admin/question-bank')}
          className="inline-flex items-center gap-2 text-sm text-black/55 dark:text-white/55 hover:text-black/80 dark:hover:text-white/80 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>
      </div>

      {/* Category Info Dashboard Card */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {category.title || 'Category Details'}
              </h2>
              <span className="inline-flex rounded-full border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {category.categoryType || 'Coding'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div>
              <span>Status: </span>
              <span className="text-slate-800 dark:text-slate-200">{category.status || 'Draft'}</span>
            </div>

          </div>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 gap-4">
          <article className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Questions</p>
            <p className="mt-4 text-3xl md:text-4xl font-light tracking-tight leading-none text-black dark:text-white">
              {questions.length}
            </p>
          </article>

          <article className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Questions</p>
            <p className="mt-4 text-3xl md:text-4xl font-light tracking-tight leading-none text-black dark:text-white">
              {activeQuestionsCount}
            </p>
          </article>
        </div>
      </section>

      <div className="flex items-center gap-8 border-b border-black/10 dark:border-white/10 pb-px overflow-x-auto">
        {[
          { key: 'questions', label: 'Questions' },
          { key: 'analytics', label: 'Usage Analytics' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`shrink-0 py-2 px-1 text-sm font-semibold transition-colors border-b-2 relative -bottom-[1px] ${
              activeTab === key
                ? 'border-[#3C83F6] text-[#3C83F6] dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'questions' ? (
      <section className="space-y-3">

        {/* ── Toolbar ── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">

          {/* Search */}
          <div className="relative flex-1 min-w-0 lg:max-w-xs">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 rounded-lg pl-9 pr-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#3C83F6]/40 dark:focus:border-white/30"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
            {[
              { value: difficultyFilter, onChange: setDifficultyFilter, options: ['All levels', 'Easy', 'Medium', 'Hard'] },
              { value: statusFilter,    onChange: setStatusFilter,    options: ['All statuses', 'Active', 'Draft', 'Archived'] },
              { value: tagFilter,       onChange: setTagFilter,       options: ['All tags', ...uniqueTags] },
              { value: sortBy,          onChange: setSortBy,          options: [
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'easy-hard', label: 'Easy → Hard' },
                  { value: 'hard-easy', label: 'Hard → Easy' },
                ],
              },
            ].map(({ value, onChange, options }, i) => (
              <div key={i} className="relative">
                <select
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="appearance-none h-9 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {options.map((opt) =>
                    typeof opt === 'string'
                      ? <option key={opt} className={dropdownOptionClass}>{opt}</option>
                      : <option key={opt.value} value={opt.value} className={dropdownOptionClass}>{opt.label}</option>
                  )}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 lg:ml-auto shrink-0">
            <button
              onClick={onAddQuestion}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#3C83F6] text-white hover:bg-[#2f73e0] text-sm font-semibold whitespace-nowrap transition-colors"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Add Question
            </button>
            <button
              onClick={onBulkAddQuestions}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-semibold whitespace-nowrap transition-colors"
            >
              Bulk Add
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <QuestionTable
          questions={sortedQuestions}
          onView={onViewQuestion}
          onEdit={onEditQuestion}
          onDelete={onDeleteQuestion}
        />

        {/* Caption */}
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Showing {sortedQuestions.length} of {questions.length} questions
        </p>
      </section>

      ) : (
        <section className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {usageStatCards.map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-[#0f1f43]/90 backdrop-blur-xl p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-light text-slate-950 dark:text-white">{value}</p>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <article className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-[#0f1f43]/90 backdrop-blur-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Track Templates Using This Category</h3>
              <div className="mt-4 space-y-2">
                {usageTemplates.length ? usageTemplates.map((template) => (
                  <div key={template.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{template.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{template.students || 0} students</p>
                    </div>
                    <span className="rounded-full bg-[#dbeafe] dark:bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8] dark:text-[#bceaff]">{template.status}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 dark:text-slate-400">No track templates are using this category yet.</p>}
              </div>
            </article>

            <article className="rounded-2xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-[#0f1f43]/90 backdrop-blur-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Batches Using This Category</h3>
              <div className="mt-4 space-y-2">
                {usageBatches.length ? usageBatches.map((batch) => (
                  <div key={batch.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{batch.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{batch.college || 'No college'}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{batch.students || 0} students</span>
                  </div>
                )) : <p className="text-sm text-slate-500 dark:text-slate-400">No batches are using this category yet.</p>}
              </div>
            </article>
          </div>
        </section>
      )}
    </div>
  );
};

export default CategoryDetailPanel;
