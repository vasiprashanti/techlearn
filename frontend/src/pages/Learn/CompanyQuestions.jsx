import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code,
  Cpu,
  Database,
  Rocket,
} from 'lucide-react';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { getPercentTone } from '../../lib/progressTone';

const companyQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Company');

const companySprintCards = [
  { name: 'Google', topics: 15, progress: 45 },
  { name: 'Amazon', topics: 18, progress: 62 },
  { name: 'Microsoft', topics: 14, progress: 38 },
  { name: 'Meta', topics: 12, progress: 20 },
  { name: 'Apple', topics: 10, progress: 55 },
  { name: 'Flipkart', topics: 16, progress: 72 },
  { name: 'Goldman Sachs', topics: 13, progress: 30 },
  { name: 'Uber', topics: 11, progress: 15 },
];

const defaultPrepTopics = [
  {
    title: 'DSA',
    questions: 24,
    icon: Code,
    iconColor: 'text-blue-600 dark:text-blue-300',
    iconBg: 'bg-blue-100/70 dark:bg-blue-500/15',
  },
  {
    title: 'SQL',
    questions: 12,
    icon: Database,
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    iconBg: 'bg-emerald-100/70 dark:bg-emerald-500/15',
  },
  {
    title: 'Core CS',
    questions: 8,
    icon: Cpu,
    iconColor: 'text-amber-600 dark:text-amber-300',
    iconBg: 'bg-amber-100/70 dark:bg-amber-500/15',
  },
  {
    title: 'Aptitude',
    questions: 10,
    icon: Brain,
    iconColor: 'text-indigo-600 dark:text-indigo-300',
    iconBg: 'bg-indigo-100/70 dark:bg-indigo-500/15',
  },
];

const companyPrepConfigs = {
  Google: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'gq-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'gq-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'gq-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'gq-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'gq-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'gq-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  Amazon: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'aq-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'aq-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'aq-3', title: 'Design LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'aq-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'aq-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'aq-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  Microsoft: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'mq-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'mq-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'mq-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'mq-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'mq-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'mq-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  Meta: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'meta-q-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'meta-q-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'meta-q-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'meta-q-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'meta-q-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'meta-q-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  Apple: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'apple-q-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'apple-q-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'apple-q-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'apple-q-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'apple-q-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'apple-q-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  Flipkart: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'flipkart-q-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'flipkart-q-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'flipkart-q-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'flipkart-q-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'flipkart-q-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'flipkart-q-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  'Goldman Sachs': {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'goldman-q-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'goldman-q-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'goldman-q-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'goldman-q-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'goldman-q-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'goldman-q-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
  Uber: {
    subtitle: 'Master the topics that matter',
    topics: defaultPrepTopics,
    solvedCount: 3,
    practiceQuestions: [
      { id: 'uber-q-1', title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
      { id: 'uber-q-2', title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
      { id: 'uber-q-3', title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
      { id: 'uber-q-4', title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
      { id: 'uber-q-5', title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
      { id: 'uber-q-6', title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
    ],
  },
};

const getQuestionCompany = (question) => {
  if (question.subtitle) return question.subtitle;

  const [companyName] = question.title.split(':');
  return companyName?.trim() || 'Unknown';
};

const formatQuestionTitle = (question, companyName) => {
  const prefix = `${companyName}: `;
  return question.title.startsWith(prefix) ? question.title.slice(prefix.length) : question.title;
};

export default function CompanyQuestions() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailCompany, setDetailCompany] = useState(null);

  const companyQuestionMap = useMemo(() => {
    return companyQuestions.reduce((accumulator, question) => {
      const companyName = getQuestionCompany(question);
      accumulator[companyName] = [...(accumulator[companyName] || []), question];
      return accumulator;
    }, {});
  }, []);

  const selectedCard = selectedCompany
    ? companySprintCards.find((card) => card.name === selectedCompany)
    : null;
  const selectedQuestions = selectedCompany ? companyQuestionMap[selectedCompany] || [] : [];
  const detailConfig = detailCompany ? companyPrepConfigs[detailCompany] : null;

  const difficultyClassMap = {
    Easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    Hard: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  };

  if (detailConfig) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-7xl">
          <section>
            <div className="mb-8 flex items-start gap-4">
              <button
                type="button"
                onClick={() => setDetailCompany(null)}
                className="mt-3 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/30 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-blue-600 backdrop-blur-xl border border-white/25 shadow-md dark:bg-white/10 dark:text-blue-300 dark:border-white/10">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.4rem]">
                    {detailCompany} Prep
                  </h1>
                </div>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                  {detailConfig.subtitle}
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {detailConfig.topics.map((topic) => {
                const Icon = topic.icon;

                return (
                  <div
                    key={topic.title}
                    className="rounded-[1.5rem] border border-white/25 bg-white/60 px-5 py-6 text-left shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-[1.55rem] font-semibold text-slate-900 dark:text-white">{topic.title}</h2>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${topic.iconBg}`}>
                        <Icon className={`h-5 w-5 ${topic.iconColor}`} />
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="text-[2.15rem] font-bold leading-none text-slate-900 dark:text-white">{topic.questions}</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">questions</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 rounded-[1.625rem] border border-white/25 bg-white/60 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Practice Questions</h2>
                <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                  {detailConfig.solvedCount}/{detailConfig.practiceQuestions.length} solved
                </p>
              </div>

              <div className="mt-7 space-y-2">
                {detailConfig.practiceQuestions.map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    className="flex w-full items-center gap-4 rounded-[1.375rem] px-4 py-4 text-left transition hover:bg-white/30 dark:hover:bg-white/10"
                  >
                    <div className="shrink-0">
                      {question.solved ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{question.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{question.subtitle}</p>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClassMap[question.difficulty]}`}>
                      {question.difficulty}
                    </span>

                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          </section>
      </UserSidebarLayout>
    );
  }

  return (
    <UserSidebarLayout maxWidthClass="max-w-7xl">
        <section>
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-blue-600 backdrop-blur-xl border border-white/25 shadow-md dark:bg-white/10 dark:text-blue-300 dark:border-white/10">
                <Rocket className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.4rem]">
                SPRINT - Company Preparation
              </h1>
            </div>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Target your preparation for specific companies
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {companySprintCards.map((company) => {
              const isSelected = company.name === selectedCompany;
              const liveQuestions = companyQuestionMap[company.name]?.length || 0;
              const tone = getPercentTone(company.progress);

              return (
                <button
                  key={company.name}
                  type="button"
                  onClick={() => {
                    setSelectedCompany(company.name);
                    setDetailCompany(null);
                  }}
                  className={`rounded-[1.75rem] border px-7 py-7 text-left shadow-lg backdrop-blur-xl transition duration-300 ${
                    isSelected
                      ? 'border-white/35 bg-white/70 dark:border-white/15 dark:bg-white/10'
                      : 'border-white/25 bg-white/55 hover:-translate-y-1 dark:border-white/10 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[1.85rem] font-semibold leading-none text-slate-900 dark:text-white">
                        {company.name}
                      </h2>
                      <p className="mt-4 flex items-baseline gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-[1rem] font-medium">{company.topics} topics</span>
                        <span className="text-[0.875rem] font-semibold text-slate-500 dark:text-slate-400">
                          x5
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-6 w-6 text-slate-300 dark:text-slate-600" />
                  </div>

                  <div className="mt-8">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[1.45rem] font-semibold ${tone.text}`}>
                        {company.progress}%
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {liveQuestions ? `${liveQuestions} live questions` : 'Curated layout'}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200/70 dark:bg-white/10">
                      <div
                        className={`h-full rounded-full ${tone.solid}`}
                        style={{ width: `${company.progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedCompany && selectedCard && (
            <div className="mt-8 rounded-[1.875rem] border border-white/25 bg-white/55 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    Selected Company
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
                    {selectedCompany} Question Sprint
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                    Focus on the most common interview patterns for {selectedCompany}. This section can
                    grow company-wise as more curated questions get added.
                  </p>
                </div>

                <div className="rounded-[1.5rem] bg-white/55 px-5 py-4 text-left shadow-md backdrop-blur-xl border border-white/25 dark:bg-white/5 dark:border-white/10 lg:min-w-[11.25rem]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Progress
                  </p>
                  <p className={`mt-2 text-4xl font-bold ${getPercentTone(selectedCard.progress).text}`}>{selectedCard.progress}%</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedCard.topics} total topics</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {selectedQuestions.length ? (
                  selectedQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="rounded-[1.5rem] border border-white/25 bg-white/55 p-5 shadow-md backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {selectedCompany}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                            {formatQuestionTitle(question, selectedCompany)}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClassMap[question.difficulty]}`}
                        >
                          {question.difficulty}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        Topic focus: {question.subtitle}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/35 bg-white/45 px-5 py-8 text-sm text-slate-600 backdrop-blur-xl dark:border-white/15 dark:bg-white/5 dark:text-slate-300 md:col-span-2">
                    No company-specific question cards are added for {selectedCompany} yet. The layout is
                    ready, and we can plug in the full company bank next.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
    </UserSidebarLayout>
  );
}
