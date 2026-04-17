import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserSidebarLayout from './Dashboard/UserSidebarLayout';

const difficultyOptions = ['All Difficulty', 'Easy', 'Medium', 'Hard'];
const topicOptions = ['All Topics', 'DSA', 'SQL', 'Core CS', 'Company', 'Aptitude'];

const difficultyPillClass = {
  Easy: 'bg-[#dff8e7] text-[#1f9c5d] border-[#bceccb]',
  Medium: 'bg-[#fff2c9] text-[#b7791f] border-[#ffe396]',
  Hard: 'bg-[#ffe0df] text-[#d95c56] border-[#ffc5c2]',
};

const topicPillClass = {
  DSA: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  SQL: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
  'Core CS': 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
  Company: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  Aptitude: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
};

function FilterDropdown({ label, options, value, onChange, isOpen, onToggle }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-11 min-w-[138px] items-center justify-between gap-2 rounded-full border border-[#cfdeea] bg-[#edf5fa] px-4 text-sm font-medium text-[#5b7087] shadow-[0_8px_20px_rgba(125,157,189,0.09)] transition hover:border-[#bdd2e3] hover:bg-[#f3f8fb]"
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6a88a7]" />
          {value || label}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-3 w-40 overflow-hidden rounded-2xl border border-[#d5e5f0] bg-[#f8fbfd] shadow-[0_18px_48px_rgba(76,114,152,0.14)]">
          <div className="py-2">
            {options.map((option) => {
              const selected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChange(option)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                    selected
                      ? 'bg-[#ddeaf5] text-[#123f7b]'
                      : 'text-[#4a5f77] hover:bg-[#edf4f9]'
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
  const location = useLocation();
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

    const isDashboardPracticeRoute = location.pathname.startsWith('/dashboard/');

    if (question.topic === 'DSA') {
      if (isDashboardPracticeRoute) {
        const sourcePath = encodeURIComponent(location.pathname);
        navigate(`/dashboard/practice/dsa/${question.id}?from=${sourcePath}`);
      } else {
        navigate(`/learn/interview-questions/dsa/${question.id}`);
      }
      return;
    }

    if (question.topic === 'SQL') {
      if (isDashboardPracticeRoute) {
        const sourcePath = encodeURIComponent(location.pathname);
        navigate(`/dashboard/practice/sql/${question.id}?from=${sourcePath}`);
      } else {
        navigate(`/learn/interview-questions/sql/${question.id}`);
      }
      return;
    }

    if (question.topic === 'Core CS') {
      if (isDashboardPracticeRoute) {
        const sourcePath = encodeURIComponent(location.pathname);
        navigate(`/dashboard/practice/core-cs/${question.id}?from=${sourcePath}`);
      } else {
        navigate(`/learn/interview-questions/core-cs/${question.id}`);
      }
      return;
    }

    if (question.topic === 'Company') {
      if (isDashboardPracticeRoute) {
        const sourcePath = encodeURIComponent(location.pathname);
        navigate(`/dashboard/practice/company-based/${question.id}?from=${sourcePath}`);
      } else {
        navigate(`/learn/interview-questions/company/${question.id}`);
      }
      return;
    }

    if (question.topic === 'Aptitude') {
      if (isDashboardPracticeRoute) {
        const sourcePath = encodeURIComponent(location.pathname);
        navigate(`/dashboard/practice/aptitude/${question.id}?from=${sourcePath}`);
      } else {
        navigate(`/learn/interview-questions/aptitude/${question.id}`);
      }
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

          <div className="relative z-0 mt-5 overflow-hidden rounded-[1.375rem] border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
            <div className="question-catalog-scroll max-h-[62vh] overflow-y-auto overflow-x-auto">
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
