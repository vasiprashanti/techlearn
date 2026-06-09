import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Search, Code, Database, Cpu, Brain, Briefcase, ChevronRight, Flame, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserSidebarLayout from './Dashboard/UserSidebarLayout';
import { practiceAPI } from '../services/practiceApi';
import { motion } from 'framer-motion';

const difficultyOptions = ['All Difficulty', 'Easy', 'Medium', 'Hard'];
const topicOptions = ['All Topics', 'DSA', 'SQL', 'Core CS', 'Company', 'Aptitude'];
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

const trackCardDetails = {
  DSA: {
    description: 'Master arrays, strings, trees, and graph algorithms.',
    visualClass: 'from-[#d8f2ff] via-[#c7ecff] to-[#b7e4ff] dark:from-[#082a5d] dark:via-[#0a214b] dark:to-[#061936]',
  },
  SQL: {
    description: 'Practice databases, joins, filters, and SQL query logic.',
    visualClass: 'from-[#dcf7ff] via-[#c7f0ff] to-[#bceaff] dark:from-[#06315f] dark:via-[#08284f] dark:to-[#061936]',
  },
  'Core CS': {
    description: 'Revise OS, DBMS, networks, and computer architecture.',
    visualClass: 'from-[#e4f5ff] via-[#cfeeff] to-[#bde7ff] dark:from-[#132949] dark:via-[#0b2147] dark:to-[#061936]',
  },
  Aptitude: {
    description: 'Build speed across quant, reasoning, and verbal questions.',
    visualClass: 'from-[#e3eeff] via-[#d4e9ff] to-[#bfe5ff] dark:from-[#192957] dark:via-[#10234d] dark:to-[#061936]',
  },
  Company: {
    description: 'Solve company-tagged questions for targeted preparation.',
    visualClass: 'from-[#eaf6ff] via-[#d7efff] to-[#c4e8ff] dark:from-[#243052] dark:via-[#102348] dark:to-[#061936]',
  },
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

  useEffect(() => {
    setSelectedTopic(lockedTopic || 'All Topics');
  }, [lockedTopic]);

  useEffect(() => {
    setSelectedTag('All');
    setShowAllTags(false);
  }, [selectedTopic, lockedTopic]);

  useEffect(() => {
    let cancelled = false;
    const isDashboardPracticeRoute = location.pathname.startsWith('/dashboard/practice');

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
  }, [lockedTopic, location.pathname]);

  const displayQuestions = useMemo(() => {
    const merged = new Map();
    [...questions, ...remoteQuestions].forEach((question) => {
      if (question?.id) merged.set(String(question.id), question);
    });
    return [...merged.values()];
  }, [questions, remoteQuestions]);

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
    const defaultTracks = {
      'DSA': { track: 'DSA', attempted: 0, total: 0, accuracy: 0, icon: <Code className="h-9 w-9" />, ...trackCardDetails.DSA },
      'SQL': { track: 'SQL', attempted: 0, total: 0, accuracy: 0, icon: <Database className="h-9 w-9" />, ...trackCardDetails.SQL },
      'Core CS': { track: 'Core CS', attempted: 0, total: 0, accuracy: 0, icon: <Cpu className="h-9 w-9" />, ...trackCardDetails['Core CS'] },
      'Aptitude': { track: 'Aptitude', attempted: 0, total: 0, accuracy: 0, icon: <Brain className="h-9 w-9" />, ...trackCardDetails.Aptitude },
      'Company': { track: 'Company', attempted: 0, total: 0, accuracy: 0, icon: <Briefcase className="h-9 w-9" />, ...trackCardDetails.Company },
    };

    const visibleTotals = displayQuestions.reduce((accumulator, question) => {
      const topic = question.topic === 'Company' ? 'Company' : question.topic;
      if (['DSA', 'Core CS', 'SQL', 'Aptitude', 'Company'].includes(topic)) {
        accumulator[topic] = (accumulator[topic] || 0) + 1;
      }
      return accumulator;
    }, {});

    if (practiceStats?.tracks) {
      practiceStats.tracks.forEach((t) => {
        const key = t.track === 'Company' ? 'Company' : t.track;
        if (defaultTracks[key]) {
          defaultTracks[key].attempted = t.attempted || 0;
          defaultTracks[key].correct = t.correct || 0;
          defaultTracks[key].accuracy = t.accuracy || 0;
          defaultTracks[key].total = t.total || 0;
        }
      });
    }

    Object.keys(defaultTracks).forEach((key) => {
      defaultTracks[key].total = Math.max(defaultTracks[key].total, visibleTotals[key] || 0);
    });

    return Object.values(defaultTracks);
  }, [displayQuestions, practiceStats]);

  const handleTrackNavigate = (trackName) => {
    const routeMap = {
      'DSA': '/dashboard/practice/dsa',
      'SQL': '/dashboard/practice/sql',
      'Core CS': '/dashboard/practice/core-cs',
      'Aptitude': '/dashboard/practice/aptitude',
      'Company': '/dashboard/practice/company-based',
    };
    if (routeMap[trackName]) {
      navigate(routeMap[trackName]);
    }
  };

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

  const showBackBtn = location.pathname.startsWith('/dashboard/practice/');

  return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <section className="p-1 sm:p-2">
          {showBackBtn && (
            <div className="w-full text-left">
              <button
                type="button"
                onClick={() => navigate("/dashboard/practice")}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Practice
              </button>
            </div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mx-auto max-w-4xl pt-2 text-center md:pt-4 mb-8"
          >
          <h1 className="font-press-start leading-normal">
            <span className="block text-xl sm:text-2xl md:text-3xl brand-heading-primary">
              {pageTitle?.toUpperCase()}
            </span>
          </h1>
        </motion.div>

          {!showBackBtn && (
            <div className="mb-6 space-y-4">
              <div className="dashboard-surface dashboard-surface-strong p-4 flex flex-col justify-between min-h-[104px] relative overflow-hidden">
                <div className="absolute right-2 bottom-2 text-orange-500/10 dark:text-orange-500/5">
                  <Flame className="w-16 h-16" />
                </div>
                <div className="flex items-center justify-between gap-2 z-10">
                  <p className="dashboard-micro-label">Practice Streak</p>
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <p className="mt-2 text-3xl font-semibold text-[#0d2a57] dark:text-[#dff3ff] z-10">
                  {practiceStats?.streak || 0} <span className="text-xs font-normal text-[#4c6f9a] dark:text-[#7fb8e2]">days</span>
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {effectivePracticeTracks.map((track) => (
                  <button
                    key={track.track}
                    type="button"
                    onClick={() => handleTrackNavigate(track.track)}
                    className="dashboard-surface group relative flex min-h-[238px] overflow-hidden p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#3C83F6]/45 hover:shadow-lg"
                  >
                    <div className="flex h-full w-full flex-col">
                      <div className={`relative flex min-h-[96px] basis-[40%] items-center justify-center overflow-hidden border-b border-[#9fcfff]/35 bg-gradient-to-br ${track.visualClass}`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(143,217,255,0.16),transparent_42%)]" />
                        <div className="dashboard-icon-badge relative z-10 h-16 w-16 rounded-3xl text-[#2d7fe8] shadow-[0_10px_26px_rgba(60,131,246,0.16)] transition-transform duration-300 group-hover:scale-110 dark:text-[#8fd9ff]">
                          {track.icon}
                        </div>
                        <ChevronRight className="absolute right-4 top-4 h-4 w-4 text-[#2d7fe8]/60 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#2d7fe8] dark:text-[#8fd9ff]/70" />
                      </div>

                      <div className="flex basis-[60%] flex-col justify-between p-5">
                        <div>
                          <h3 className="text-xl font-semibold leading-snug text-[#0d2a57] transition-colors group-hover:text-[#2d7fe8] dark:text-[#8fd9ff] dark:group-hover:text-[#96ddff]">
                            {track.track} Practice
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-[#4c6f9a] dark:text-[#7fb8e2]">
                            {track.description}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-widest text-[#5f82ac] dark:text-[#81bde6]">
                          <span>{track.attempted || 0}/{track.total || 0} solved</span>
                          <span>{track.accuracy || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
