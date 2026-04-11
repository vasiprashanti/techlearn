import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Search } from 'lucide-react';
import UserSidebarLayout from './Dashboard/UserSidebarLayout';

const difficultyOptions = ['All Difficulty', 'Easy', 'Medium', 'Hard'];
const topicOptions = ['All Topics', 'DSA', 'SQL', 'Core CS', 'Company'];

const difficultyPillClass = {
  Easy: 'bg-[#dff8e7] text-[#1f9c5d] border-[#bceccb]',
  Medium: 'bg-[#fff2c9] text-[#b7791f] border-[#ffe396]',
  Hard: 'bg-[#ffe0df] text-[#d95c56] border-[#ffc5c2]',
};

const topicPillClass = {
  DSA: 'bg-[#dcecff] text-[#2567c7] border-[#bedaff]',
  SQL: 'bg-[#def1ff] text-[#2374c6] border-[#c5e4ff]',
  'Core CS': 'bg-[#e5ebf2] text-[#4c5e78] border-[#d4dce7]',
  Company: 'bg-[#ffe9c9] text-[#c67a10] border-[#ffd89e]',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Difficulty');
  const [selectedTopic, setSelectedTopic] = useState(lockedTopic || 'All Topics');
  const [openMenu, setOpenMenu] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedTopic(lockedTopic || 'All Topics');
  }, [lockedTopic]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const quickFilters = showTopicFilter
    ? ['Easy', 'Medium', 'Hard', 'DSA', 'SQL', 'Core CS', 'Company']
    : ['Easy', 'Medium', 'Hard'];

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

      return matchesSearch && matchesDifficulty && matchesTopic;
    });
  }, [questions, searchTerm, selectedDifficulty, selectedTopic]);

  const applyQuickFilter = (value) => {
    if (difficultyOptions.includes(value)) {
      setSelectedDifficulty((current) => (current === value ? 'All Difficulty' : value));
      return;
    }

    if (!showTopicFilter) return;

    if (topicOptions.includes(value)) {
      setSelectedTopic((current) => (current === value ? 'All Topics' : value));
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
      <section className="p-1 sm:p-2">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-[#18354f] sm:text-[2rem]">{pageTitle}</h1>
          <p className="mt-1 text-sm text-[#6d87a1]">{pageSubtitle}</p>
        </div>

        <div className="rounded-[22px] border border-[#d7e7f2] bg-[#e6f2f9]/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89a3b9]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search questions..."
                className="h-11 w-full rounded-full border border-[#d5e3ee] bg-[#f7fbfd] pl-11 pr-4 text-sm text-[#47627c] outline-none transition placeholder:text-[#9aaec0] focus:border-[#89b5db] focus:ring-4 focus:ring-[#a8cceb]/20"
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

              {showTopicFilter && (
                <FilterDropdown
                  label="All Topics"
                  options={topicOptions}
                  value={selectedTopic}
                  onChange={(option) => {
                    setSelectedTopic(option);
                    setOpenMenu(null);
                  }}
                  isOpen={openMenu === 'topic'}
                  onToggle={() => setOpenMenu((current) => (current === 'topic' ? null : 'topic'))}
                />
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickFilters.map((filter) => {
              const active = selectedDifficulty === filter || selectedTopic === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => applyQuickFilter(filter)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    active
                      ? 'border border-[#64d09a] bg-[#dff8e9] text-[#168d55] shadow-[0_8px_20px_rgba(68,175,117,0.14)]'
                      : 'bg-[#edf4f8] text-[#6c8197] hover:bg-[#e5eff6]'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[22px] border border-[#d4e5ef] bg-[#d9edf8]/65 shadow-[0_14px_30px_rgba(100,142,177,0.1)]">
          <div className="question-catalog-scroll max-h-[540px] overflow-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 z-10 bg-[#edf3f7] text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#7d91a5]">
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
                    className="border-t border-[#d9e7f0] text-sm text-[#2f445b] transition hover:bg-[#e2f1f9]/70"
                  >
                    <td className="px-4 py-4 text-[#8fa4b7]">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[#263e59]">{question.title}</div>
                      <div className="mt-1 text-xs text-[#8ea4b8]">{question.subtitle}</div>
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
                    <td colSpan="4" className="px-4 py-10 text-center text-sm text-[#6f859d]">
                      No questions match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#d9e7f0] bg-[#eef5f9] px-4 py-3 text-sm text-[#7e93a7]">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
        </div>
      </section>
    </UserSidebarLayout>
  );
}
