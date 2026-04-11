import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from './Dashboard/UserSidebarLayout';

const difficultyOptions = ['All Difficulty', 'Easy', 'Medium', 'Hard'];
const topicOptions = ['All Topics', 'DSA', 'SQL', 'Core CS', 'Company'];

const difficultyPillClass = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
};

const topicPillClass = {
  DSA: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  SQL: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
  'Core CS': 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
  Company: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
};

function FilterDropdown({ label, options, value, onChange, isOpen, onToggle }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-12 min-w-[14rem] items-center justify-between gap-2 rounded-full border border-white/20 bg-white/70 px-5 text-base font-medium text-gray-900 shadow-sm backdrop-blur-xl transition hover:bg-white/80 dark:border-gray-700/20 dark:bg-gray-800/60 dark:text-gray-100 dark:hover:bg-gray-800/70"
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          {value || label}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[9999] mt-3 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-lg backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/90">
          <div className="max-h-72 overflow-auto py-2">
            {options.map((option) => {
              const selected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-left text-base transition ${
                    selected
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'text-gray-900 hover:bg-white/70 dark:text-gray-100 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span className="w-4">{selected ? <Check className="h-4 w-4" /> : null}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionCatalogPage({
  pageTitle,
  pageSubtitle,
  questions,
  lockedTopic = null,
  showTopicFilter = true,
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulty');
  const [selectedTopic, setSelectedTopic] = useState(lockedTopic || 'All Topics');
  const [selectedTag, setSelectedTag] = useState('All');
  const [openMenu, setOpenMenu] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedTopic(lockedTopic || 'All Topics');
  }, [lockedTopic]);

  useEffect(() => {
    setSelectedTag('All');
  }, [selectedTopic, lockedTopic]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const availableTags = useMemo(() => {
    const pool = selectedTopic === 'All Topics'
      ? questions
      : questions.filter((question) => question.topic === selectedTopic);

    return Array.from(new Set(pool.map((question) => question.subtitle))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [questions, selectedTopic]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      const matchesSearch =
        !searchTerm ||
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.topic.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === 'All Difficulty' || question.difficulty === selectedDifficulty;

      const matchesTopic =
        selectedTopic === 'All Topics' || question.topic === selectedTopic;

      const matchesTag =
        selectedTag === 'All' || question.subtitle === selectedTag;

      return matchesSearch && matchesDifficulty && matchesTopic && matchesTag;
    });
  }, [questions, searchTerm, selectedDifficulty, selectedTopic, selectedTag]);

  const handleRowOpen = (question) => {
    if (!question?.topic || !question?.id) return;

    if (question.topic === 'DSA') {
      navigate(`/learn/interview-questions/dsa/${question.id}`);
      return;
    }

    if (question.topic === 'SQL') {
      navigate(`/learn/interview-questions/sql/${question.id}`);
      return;
    }

    if (question.topic === 'Core CS') {
      navigate('/learn/interview-questions/core-cs');
      return;
    }

    if (question.topic === 'Company') {
      navigate('/learn/interview-questions/company');
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
        <section className="p-1 sm:p-2">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-[2rem]">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {pageSubtitle}
            </p>
          </div>

          <div className="relative z-30 rounded-[1.375rem] border border-white/20 bg-white/60 p-3 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-800/60 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search questions..."
                  className="h-11 w-full rounded-full border border-white/20 bg-white/70 pl-11 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-200/40 dark:border-gray-700/20 dark:bg-gray-900/40 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-blue-600 dark:focus:ring-blue-900/30"
                />
              </label>

              <div ref={dropdownRef} className="flex flex-col gap-3 sm:flex-row">
                <FilterDropdown
                  label="All Difficulty"
                  options={difficultyOptions}
                  value={selectedDifficulty}
                  onChange={(option) => {
                    setSelectedDifficulty(option);
                    setOpenMenu(null);
                  }}
                  isOpen={openMenu === 'difficulty'}
                  onToggle={() => setOpenMenu((current) => (current === 'difficulty' ? null : 'difficulty'))}
                />
              </div>
            </div>

            {showTopicFilter && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topicOptions.map((topic) => {
                  const active = selectedTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                        active
                          ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-200'
                          : 'border-white/10 bg-white/40 text-gray-700 hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-900/30 dark:text-gray-200 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedTag('All')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                  selectedTag === 'All'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'border-white/10 bg-white/40 text-gray-700 hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-900/30 dark:text-gray-200 dark:hover:bg-gray-800/60'
                }`}
              >
                {selectedTopic === 'Company' ? 'All Companies' : 'All Topics'}
              </button>
              {availableTags.map((tag) => {
                const active = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                      active
                        ? 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700/50 dark:bg-slate-900/30 dark:text-slate-200'
                        : 'border-white/10 bg-white/40 text-gray-700 hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-900/30 dark:text-gray-200 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative z-0 mt-5 overflow-hidden rounded-[1.375rem] border border-white/20 bg-white/50 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
                    <th className="w-14 px-4 py-4">#</th>
                    <th className="px-4 py-4">Title</th>
                    <th className="w-36 px-4 py-4">Difficulty</th>
                    <th className="w-32 px-4 py-4">Topic</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question, index) => (
                    <tr
                      key={question.id}
                      onClick={() => handleRowOpen(question)}
                      className="cursor-pointer border-t border-white/10 text-sm text-gray-800 transition hover:bg-white/40 dark:border-gray-700/30 dark:text-gray-200 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{question.title}</div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{question.subtitle}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            difficultyPillClass[question.difficulty]
                          }`}
                        >
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            topicPillClass[question.topic]
                          }`}
                        >
                          {question.topic}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredQuestions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-10 text-center text-sm text-gray-600 dark:text-gray-300">
                        No questions match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 bg-white/40 px-4 py-3 text-sm text-gray-600 dark:border-gray-700/30 dark:bg-gray-900/30 dark:text-gray-300">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </div>
        </section>
    </UserSidebarLayout>
  );
}
