import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserSidebarLayout from './Dashboard/UserSidebarLayout';
import { practiceAPI } from '../services/practiceApi';

const difficultyOptions = ['All Difficulty', 'Easy', 'Medium', 'Hard'];
const defaultTopicOptions = ['All Topics', 'DSA', 'SQL', 'Core CS', 'Company', 'Aptitude'];
const dashboardPracticeTopicOptions = ['All Topics', 'DSA', 'SQL', 'Core CS', 'Aptitude'];
const dashboardPracticeTracks = [
  {
    title: 'DSA',
    description: 'Timed coding and problem-solving practice.',
    path: '/dashboard/practice/dsa',
  },
  {
    title: 'SQL',
    description: 'Database queries and interview patterns.',
    path: '/dashboard/practice/sql',
  },
  {
    title: 'Core CS',
    description: 'Operating systems, networks, DBMS, and fundamentals.',
    path: '/dashboard/practice/core-cs',
  },
  {
    title: 'Aptitude',
    description: 'Quantitative, logical, and placement aptitude drills.',
    path: '/dashboard/practice/aptitude',
  },
];
const INITIAL_VISIBLE_TAGS = 10;

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
        className="dashboard-inner-surface flex h-11 min-w-[138px] items-center justify-between gap-2 rounded-full px-4 text-sm font-medium text-[#5b7087] dark:text-[#9cd6ff]"
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6a88a7]" />
          {value || label}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="dashboard-surface dashboard-surface-strong absolute right-0 z-20 mt-3 w-40 overflow-hidden">
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
  const [showAllTags, setShowAllTags] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [remoteQuestions, setRemoteQuestions] = useState([]);
  const [practiceStats, setPracticeStats] = useState(null);
  const dropdownRef = useRef(null);
  const isDashboardPracticeRoute = location.pathname.startsWith('/dashboard/practice');
  const isDashboardPracticeIndex = location.pathname === '/dashboard/practice';
  const topicOptions = isDashboardPracticeRoute ? dashboardPracticeTopicOptions : defaultTopicOptions;

  useEffect(() => {
    setSelectedTopic(lockedTopic || 'All Topics');
  }, [lockedTopic]);

  useEffect(() => {
    setSelectedTag('All');
    setShowAllTags(false);
  }, [selectedTopic, lockedTopic]);

  useEffect(() => {
    let cancelled = false;

    practiceAPI
      .getQuestions(lockedTopic)
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setRemoteQuestions(data);
      })
      .catch(() => {
        if (!cancelled) setRemoteQuestions([]);
      });

    if (isDashboardPracticeRoute) {
      practiceAPI
        .getStats()
        .then((data) => {
          if (!cancelled) setPracticeStats(data);
        })
        .catch(() => {
          if (!cancelled) setPracticeStats(null);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [lockedTopic, location.pathname, isDashboardPracticeRoute]);

  const displayQuestions = useMemo(() => {
    const merged = new Map();
    [...questions, ...remoteQuestions].forEach((question) => {
      if (question?.id) merged.set(String(question.id), question);
    });
    const mergedQuestions = [...merged.values()];
    if (!isDashboardPracticeRoute) return mergedQuestions;
    return mergedQuestions.filter((question) => dashboardPracticeTopicOptions.includes(question.topic));
  }, [questions, remoteQuestions, isDashboardPracticeRoute]);

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
        ? displayQuestions
        : displayQuestions.filter((question) => question.topic === selectedTopic);

    return Array.from(new Set(pool.map((question) => question.subtitle))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [displayQuestions, selectedTopic]);

  const filteredQuestions = useMemo(() => {
    return displayQuestions.filter((question) => {
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
  }, [displayQuestions, searchTerm, selectedDifficulty, selectedTopic, selectedTag]);

  const visibleTags = useMemo(() => {
    if (showAllTags) return availableTags;
    return availableTags.slice(0, INITIAL_VISIBLE_TAGS);
  }, [availableTags, showAllTags]);

  const effectivePracticeTracks = useMemo(() => {
    if (!practiceStats?.tracks) return [];
    const visibleTotals = displayQuestions.reduce((accumulator, question) => {
      if (['DSA', 'Core CS', 'SQL', 'Aptitude'].includes(question.topic)) {
        accumulator[question.topic] = (accumulator[question.topic] || 0) + 1;
      }
      return accumulator;
    }, {});

    return practiceStats.tracks.map((track) => ({
      ...track,
      total: Math.max(Number(track.total || 0), visibleTotals[track.track] || 0),
    }));
  }, [displayQuestions, practiceStats]);

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
            <h1 className="dashboard-page-title">
              {pageTitle}
            </h1>
            <p className="dashboard-page-subtitle">
              {pageSubtitle}
            </p>
          </div>

          {practiceStats ? (
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="dashboard-surface dashboard-surface-strong p-4">
                <p className="dashboard-micro-label">Practice Streak</p>
                <p className="mt-2 text-3xl font-semibold text-[#0d2a57] dark:text-[#dff3ff]">{practiceStats.streak || 0}</p>
              </div>
              {effectivePracticeTracks.map((track) => (
                <div key={track.track} className="dashboard-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0d2a57] dark:text-[#dff3ff]">{track.track}</p>
                    <span className="rounded-full bg-white/50 px-2 py-0.5 text-xs text-[#4c6f9a] dark:bg-[#0b214d]/60 dark:text-[#9bc5e8]">
                      {track.accuracy || 0}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">
                    {track.attempted || 0}/{track.total || 0} attempted · {track.correct || 0} correct
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {isDashboardPracticeIndex ? (
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {dashboardPracticeTracks.map((track) => {
                const stats = effectivePracticeTracks.find((entry) => entry.track === track.title);

                return (
                  <button
                    key={track.title}
                    type="button"
                    onClick={() => navigate(track.path)}
                    className="dashboard-surface group p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/54 dark:hover:bg-[#0f2c60]/72"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold text-[#0d2a57] dark:text-[#dff3ff]">{track.title}</h2>
                      <span className="rounded-full bg-[#0000a8] px-2.5 py-1 text-xs font-semibold text-white">
                        {stats?.total || 0}
                      </span>
                    </div>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-[#4c6f9a] dark:text-[#8dbde2]">
                      {track.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-[#0000a8] transition group-hover:translate-x-0.5 dark:text-[#8fd9ff]">
                      Open practice
                    </p>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="dashboard-surface dashboard-surface-strong relative z-30 p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f82ac] dark:text-[#81bde6]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search questions..."
                  className="dashboard-input-surface rounded-full pl-11 pr-4"
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
              <div className="mt-3 space-y-2">
                <p className="dashboard-micro-label">Topics</p>
                <div className="question-catalog-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {topicOptions.map((topic) => {
                    const active = selectedTopic === topic;
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition border ${
                          active
                            ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-[#6bb8ec]/32 dark:bg-[#0d366f] dark:text-white'
                            : 'border-[#9fcfff]/45 bg-[#edf7ff] text-[#3f5f87] hover:bg-[#f5fbff] dark:border-[#6bb8ec]/24 dark:bg-[#081a3e] dark:text-[#d7efff] dark:hover:bg-[#0d366f]/72'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="dashboard-micro-label">
                  {selectedTopic === 'Company' ? 'Companies' : 'Subtopics'}
                </p>
                {availableTags.length > INITIAL_VISIBLE_TAGS && (
                  <button
                    type="button"
                    onClick={() => setShowAllTags((value) => !value)}
                    className="text-xs font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
                  >
                    {showAllTags ? 'Show less' : `Show all (${availableTags.length})`}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTag('All')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                    selectedTag === 'All'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/32 dark:bg-[#0b3b35] dark:text-[#f1fff9]'
                      : 'border-[#9fcfff]/45 bg-[#edf7ff] text-[#3f5f87] hover:bg-[#f5fbff] dark:border-[#6bb8ec]/24 dark:bg-[#081a3e] dark:text-[#d7efff] dark:hover:bg-[#0d366f]/72'
                  }`}
                >
                  {selectedTopic === 'Company' ? 'All Companies' : 'All Subtopics'}
                </button>
                {visibleTags.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                        active
                          ? 'border-slate-200 bg-slate-50 text-slate-800 dark:border-[#6bb8ec]/32 dark:bg-[#0d366f] dark:text-white'
                          : 'border-[#9fcfff]/45 bg-[#edf7ff] text-[#3f5f87] hover:bg-[#f5fbff] dark:border-[#6bb8ec]/24 dark:bg-[#081a3e] dark:text-[#d7efff] dark:hover:bg-[#0d366f]/72'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="dashboard-surface relative z-0 mt-5 overflow-hidden">
            <div className="question-catalog-scroll max-h-[62vh] overflow-y-auto overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-white/45 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#5f7592] dark:bg-[#0b214d]/65 dark:text-[#9bc5e8]">
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
                      className="cursor-pointer border-t border-white/10 text-sm text-[#1a365d] transition hover:bg-white/32 dark:border-[#1e3f73]/38 dark:text-[#d7efff] dark:hover:bg-[#0f2c60]/44"
                    >
                      <td className="px-4 py-4 text-[#6d86a4] dark:text-[#88b8df]">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[#0d2a57] dark:text-[#dff3ff]">{question.title}</div>
                        <div className="mt-1 text-xs text-[#5f7592] dark:text-[#88b8df]">{question.subtitle}</div>
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
                      <td colSpan="4" className="px-4 py-10 text-center text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
                        No questions match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 bg-white/32 px-4 py-3 text-sm text-[#4c6f9a] dark:border-[#1e3f73]/38 dark:bg-[#0b214d]/58 dark:text-[#7fb8e2]">
              Showing {filteredQuestions.length} of {displayQuestions.length} questions
            </div>
          </div>
        </section>
    </UserSidebarLayout>
  );
}
