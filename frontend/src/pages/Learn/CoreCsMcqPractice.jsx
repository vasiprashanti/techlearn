import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { coreCsMcqs } from '../../data/coreCsMcqs';

const difficultyOptions = ['All Difficulty', 'Easy', 'Medium', 'Hard'];

const difficultyPillClass = {
  Easy: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  Hard: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
};

function DifficultyDropdown({ value, onChange, isOpen, onToggle }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-12 min-w-[14rem] items-center justify-between gap-2 rounded-full border border-white/20 bg-white/70 px-5 text-base font-medium text-gray-900 shadow-sm backdrop-blur-xl transition hover:bg-white/80 dark:border-gray-700/20 dark:bg-gray-800/60 dark:text-gray-100 dark:hover:bg-gray-800/70"
      >
        <span className="flex items-center gap-2">{value}</span>
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[9999] mt-3 w-64 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-lg backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/90">
          <div className="max-h-72 overflow-auto py-2">
            {difficultyOptions.map((option) => {
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
                  <span className="w-4">{selected ? <CheckCircle className="h-4 w-4" /> : null}</span>
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

export default function CoreCsMcqPractice() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulty');
  const [selectedTag, setSelectedTag] = useState('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const tags = useMemo(() => {
    return Array.from(new Set(coreCsMcqs.map((q) => q.tag))).sort((a, b) => a.localeCompare(b));
  }, []);

  const filtered = useMemo(() => {
    return coreCsMcqs.filter((q) => {
      const matchesDifficulty =
        selectedDifficulty === 'All Difficulty' || q.difficulty === selectedDifficulty;
      const matchesTag = selectedTag === 'All' || q.tag === selectedTag;
      return matchesDifficulty && matchesTag;
    });
  }, [selectedDifficulty, selectedTag]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
  }, [selectedDifficulty, selectedTag]);

  const current = filtered[currentIndex] || null;

  const isCorrect = showFeedback && current && selectedOption === current.correctIndex;

  const getOptionStyle = (index) => {
    if (!current) return '';

    if (!showFeedback) {
      return selectedOption === index
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-white/70 dark:hover:bg-gray-800/70';
    }

    if (index === current.correctIndex) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    }

    if (selectedOption === index && selectedOption !== current.correctIndex) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }

    return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300';
  };

  const nextDisabled = !current || currentIndex >= filtered.length - 1;

  return (
    <UserSidebarLayout maxWidthClass="max-w-5xl">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate('/learn/interview-questions')}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Core CS MCQ Practice
          </h1>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Select an answer to see the explanation instantly.
          </div>
        </div>

        <div className="relative z-30 rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DifficultyDropdown
              value={selectedDifficulty}
              onChange={(value) => {
                setSelectedDifficulty(value);
                setOpenMenu(false);
              }}
              isOpen={openMenu}
              onToggle={() => setOpenMenu((v) => !v)}
            />

            <div className="text-sm text-gray-600 dark:text-gray-300">{filtered.length} questions</div>
          </div>

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
              All Topics
            </button>
            {tags.map((tag) => {
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

        {!current ? (
          <div className="rounded-2xl border border-white/20 bg-white/60 p-6 text-gray-700 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30 dark:text-gray-200">
            No questions match the selected filters.
          </div>
        ) : (
          <div className="relative z-0 rounded-2xl border border-white/20 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30">
            <div className="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div>
                Question {currentIndex + 1} of {filtered.length}
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700/20 dark:bg-gray-900/30 dark:text-gray-200">
                  {current.tag}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    difficultyPillClass[current.difficulty] ||
                    'border-white/20 bg-white/60 text-gray-900 dark:border-gray-700/20 dark:bg-gray-900/30 dark:text-gray-100'
                  }`}
                >
                  {current.difficulty}
                </span>
              </div>
            </div>

            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{current.question}</h2>

            <div className="mt-4 space-y-3">
              {current.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={showFeedback}
                  onClick={() => {
                    setSelectedOption(idx);
                    setShowFeedback(true);
                  }}
                  className={`w-full rounded-xl border-2 p-4 text-left text-sm transition ${getOptionStyle(idx)} ${
                    showFeedback ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{opt}</div>
                    {showFeedback && idx === current.correctIndex ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    ) : showFeedback && selectedOption === idx && selectedOption !== current.correctIndex ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
                        <X className="h-5 w-5 text-white" />
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            {showFeedback && (
              <div
                className={`mt-5 rounded-xl border p-4 ${
                  isCorrect
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {isCorrect ? <CheckCircle className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-semibold ${
                        isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}
                    >
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </div>
                    <div
                      className={`mt-1 text-sm leading-relaxed ${
                        isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {current.explanation}
                      {!isCorrect ? (
                        <div className="mt-2">
                          <span className="font-semibold">Correct answer:</span>{' '}
                          {current.options[current.correctIndex]}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                disabled={!showFeedback || nextDisabled}
                onClick={() => {
                  setCurrentIndex((v) => Math.min(v + 1, filtered.length - 1));
                  setSelectedOption(null);
                  setShowFeedback(false);
                }}
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700/40 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </UserSidebarLayout>
  );
}
