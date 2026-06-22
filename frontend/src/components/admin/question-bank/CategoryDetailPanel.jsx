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
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All levels');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [sortBy, setSortBy] = useState('newest');

  const dropdownOptionClass = 'bg-white text-slate-800 dark:bg-[#0f1f43] dark:text-white';

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        String(question.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.tags || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(question.track || question.trackType || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        difficultyFilter === 'All levels' ||
        String(question.difficulty).toLowerCase() === difficultyFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All statuses' ||
        String(question.status || 'Active').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [questions, searchTerm, difficultyFilter, statusFilter]);

  const sortedQuestions = useMemo(() => [...filteredQuestions].sort((a, b) => {
    if (sortBy === 'oldest') return new Date(a.created || 0) - new Date(b.created || 0);
    if (sortBy === 'prompt') return String(a.title || '').localeCompare(String(b.title || ''));
    if (sortBy === 'difficulty') return String(a.difficulty || '').localeCompare(String(b.difficulty || ''));
    return new Date(b.created || 0) - new Date(a.created || 0);
  }), [filteredQuestions, sortBy]);

  const activeQuestionsCount = useMemo(() => {
    return questions.filter(q => q.status === 'Active' || !q.status).length;
  }, [questions]);

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
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-350">
              {category.subtitle || 'Organize and manage questions.'}
            </p>
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

      {/* Action panel & filters */}
      <section className="bg-white dark:bg-[#0f1f43] backdrop-blur-xl border border-black/10 dark:border-white/15 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 max-w-md rounded-xl border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-black/25 shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by prompt, tag, or track..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 border-0 bg-transparent pl-10 pr-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 focus:outline-none"
              />
            </div>

            {/* Difficulty Filter Dropdown */}
            <div className="relative rounded-xl border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-black/25 shadow-[0_4px_14px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.18)] hover:bg-slate-200 dark:hover:bg-black/40 transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35 min-w-[140px]">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3.5 pr-10 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option className={dropdownOptionClass}>All levels</option>
                <option className={dropdownOptionClass}>Easy</option>
                <option className={dropdownOptionClass}>Medium</option>
                <option className={dropdownOptionClass}>Hard</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
            </div>
            <div className="relative rounded-xl border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-black/25 transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35 min-w-[140px]">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3.5 pr-10 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none">
                <option className={dropdownOptionClass}>All statuses</option>
                <option className={dropdownOptionClass}>Active</option>
                <option className={dropdownOptionClass}>Draft</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
            </div>
            <div className="relative rounded-xl border border-black/10 dark:border-white/15 bg-slate-100 dark:bg-black/25 transition-all focus-within:ring-2 focus-within:ring-[#3C83F6]/35 dark:focus-within:ring-[#7fb1ff]/35 min-w-[140px]">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none w-full h-10 rounded-xl border-0 bg-transparent px-3.5 pr-10 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none">
                <option value="newest" className={dropdownOptionClass}>Newest first</option>
                <option value="oldest" className={dropdownOptionClass}>Oldest first</option>
                <option value="prompt" className={dropdownOptionClass}>Prompt A-Z</option>
                <option value="difficulty" className={dropdownOptionClass}>Difficulty</option>
              </select>
              <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-550" />
            </div>
          </div>

          {/* Add Question Button */}
          <button
            onClick={onAddQuestion}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#3C83F6] hover:bg-[#2f73e0] dark:bg-[#bceaff] dark:hover:bg-[#a6e2ff] dark:text-[#06224d] text-white px-5 text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <FiPlus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        {/* Embedded Question Table */}
        <div className="pt-2">
          <QuestionTable
            questions={sortedQuestions}
            onView={onViewQuestion}
            onEdit={onEditQuestion}
            onDelete={onDeleteQuestion}
          />
        </div>

        {/* List size caption */}
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          Showing {sortedQuestions.length} of {questions.length} questions
        </p>
      </section>
    </div>
  );
};

export default CategoryDetailPanel;
