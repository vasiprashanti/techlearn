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

const companyQuestions = interviewQuestionsCatalog.filter((question) => question.topic === 'Company');

const companySprintCards = [
  { name: 'Google', topics: 15, progress: 45, accent: 'bg-[#2582f4]' },
  { name: 'Amazon', topics: 18, progress: 62, accent: 'bg-[#f59e0b]' },
  { name: 'Microsoft', topics: 14, progress: 38, accent: 'bg-[#2fb45a]' },
  { name: 'Meta', topics: 12, progress: 20, accent: 'bg-[#1f3f83]' },
  { name: 'Apple', topics: 10, progress: 55, accent: 'bg-[#2582f4]' },
  { name: 'Flipkart', topics: 16, progress: 72, accent: 'bg-[#f59e0b]' },
  { name: 'Goldman Sachs', topics: 13, progress: 30, accent: 'bg-[#2fb45a]' },
  { name: 'Uber', topics: 11, progress: 15, accent: 'bg-[#1f3f83]' },
];

const defaultPrepTopics = [
  {
    title: 'DSA',
    questions: 24,
    icon: Code,
    iconColor: 'text-[#2a87f5]',
    iconBg: 'bg-[#ddecff]',
  },
  {
    title: 'SQL',
    questions: 12,
    icon: Database,
    iconColor: 'text-[#1fa86a]',
    iconBg: 'bg-[#dcf7ea]',
  },
  {
    title: 'Core CS',
    questions: 8,
    icon: Cpu,
    iconColor: 'text-[#f2a21a]',
    iconBg: 'bg-[#fff1d8]',
  },
  {
    title: 'Aptitude',
    questions: 10,
    icon: Brain,
    iconColor: 'text-[#244b86]',
    iconBg: 'bg-[#e1edff]',
  },
];

const companyPrepConfigs = Object.fromEntries(
  companySprintCards.map((company) => [
    company.name,
    {
      subtitle: 'Master the topics that matter',
      topics: defaultPrepTopics,
      solvedCount: 3,
      practiceQuestions: [
        { id: `${company.name}-q-1`, title: 'Two Sum', subtitle: 'Arrays', difficulty: 'Easy', solved: true },
        { id: `${company.name}-q-2`, title: 'Merge Intervals', subtitle: 'Arrays', difficulty: 'Medium', solved: true },
        { id: `${company.name}-q-3`, title: 'LRU Cache', subtitle: 'Design', difficulty: 'Hard', solved: false },
        { id: `${company.name}-q-4`, title: 'Valid Parentheses', subtitle: 'Stack', difficulty: 'Easy', solved: true },
        { id: `${company.name}-q-5`, title: 'Course Schedule', subtitle: 'Graph', difficulty: 'Medium', solved: false },
        { id: `${company.name}-q-6`, title: 'Median of Two Sorted Arrays', subtitle: 'Binary Search', difficulty: 'Hard', solved: false },
      ],
    },
  ])
);

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
  const [selectedCompany, setSelectedCompany] = useState(companySprintCards[0].name);
  const [detailCompany, setDetailCompany] = useState(null);

  const companyQuestionMap = useMemo(() => {
    return companyQuestions.reduce((accumulator, question) => {
      const companyName = getQuestionCompany(question);
      accumulator[companyName] = [...(accumulator[companyName] || []), question];
      return accumulator;
    }, {});
  }, []);

  const selectedCard = companySprintCards.find((card) => card.name === selectedCompany) || companySprintCards[0];
  const selectedQuestions = companyQuestionMap[selectedCompany] || [];
  const detailConfig = detailCompany ? companyPrepConfigs[detailCompany] : null;

  const difficultyClassMap = {
    Easy: 'bg-[#dff8e7] text-[#1f9c5d]',
    Medium: 'bg-[#fff2c9] text-[#e39210]',
    Hard: 'bg-[#ffe0df] text-[#ef5b57]',
  };

  if (detailConfig) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-7xl">
        <section>
          <div className="mb-8 flex items-start gap-4">
            <button
              type="button"
              onClick={() => setDetailCompany(null)}
              className="mt-3 flex h-10 w-10 items-center justify-center rounded-full text-[#1d3553] transition hover:bg-white/35"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/45 text-[#2582f4] shadow-[0_10px_24px_rgba(75,119,163,0.12)] backdrop-blur">
                  <Rocket className="h-5 w-5" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#0c2340] sm:text-[2.4rem]">
                  {detailCompany} Prep
                </h1>
              </div>
              <p className="mt-2 text-lg text-[#5c7893]">{detailConfig.subtitle}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {detailConfig.topics.map((topic) => {
              const Icon = topic.icon;

              return (
                <div
                  key={topic.title}
                  className="rounded-[24px] border border-[#edf6fc] bg-white px-5 py-6 text-left shadow-[0_18px_40px_rgba(82,123,158,0.14)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-[1.55rem] font-semibold text-[#1a2740]">{topic.title}</h2>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${topic.iconBg}`}>
                      <Icon className={`h-5 w-5 ${topic.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-8">
                    <p className="text-[2.15rem] font-bold leading-none text-[#1c2c46]">{topic.questions}</p>
                    <p className="mt-2 text-sm text-[#6d8297]">questions</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 rounded-[26px] border border-[#edf6fc] bg-white p-5 shadow-[0_18px_40px_rgba(82,123,158,0.14)] sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold text-[#1b2841]">Practice Questions</h2>
              <p className="mt-1 text-base text-[#6b8297]">
                {detailConfig.solvedCount}/{detailConfig.practiceQuestions.length} solved
              </p>
            </div>

            <div className="mt-7 space-y-2">
              {detailConfig.practiceQuestions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  className="flex w-full items-center gap-4 rounded-[22px] px-4 py-4 text-left transition hover:bg-[#f6fbfe]"
                >
                  <div className="shrink-0">
                    {question.solved ? (
                      <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[#c9d4df]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-[#1d2d47]">{question.title}</p>
                    <p className="text-sm text-[#72879b]">{question.subtitle}</p>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClassMap[question.difficulty]}`}>
                    {question.difficulty}
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-[#c4cfd9]" />
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/45 text-[#2582f4] shadow-[0_10px_24px_rgba(75,119,163,0.12)] backdrop-blur">
              <Rocket className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0c2340] sm:text-[2.4rem]">SPRINT - Company Preparation</h1>
          </div>
          <p className="mt-2 text-lg text-[#5c7893]">Target your preparation for specific companies</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {companySprintCards.map((company) => {
            const isSelected = company.name === selectedCompany;

            return (
              <button
                key={company.name}
                type="button"
                onClick={() => {
                  setSelectedCompany(company.name);
                  setDetailCompany(companyPrepConfigs[company.name] ? company.name : null);
                }}
                className={`rounded-[16px] border px-5 py-5 text-left shadow-[0_14px_28px_rgba(82,123,158,0.12)] transition duration-300 ${
                  isSelected
                    ? 'border-[#7ab4e6] bg-white shadow-[0_20px_44px_rgba(64,116,163,0.18)]'
                    : 'border-[#e2eaf1] bg-white hover:-translate-y-1 hover:border-[#9bc8ef]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[1.25rem] font-semibold leading-tight text-[#0b1f3b]">{company.name}</h2>
                    <p className="mt-2 text-sm text-[#58718b]">{company.topics} topics</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-5 w-5 text-[#b4c1cd]" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl font-semibold text-[#5c728b]">{company.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#dde7ef]">
                    <div className={`h-full rounded-full ${company.accent}`} style={{ width: `${company.progress}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-[30px] border border-[#e2eaf1] bg-white p-6 shadow-[0_18px_40px_rgba(82,123,158,0.12)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6d89a3]">Selected Company</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#0c2340]">{selectedCompany} Question Sprint</h2>
              <p className="mt-2 max-w-2xl text-sm text-[#64809a] sm:text-base">
                Focus on the most common interview patterns for {selectedCompany}. This section can grow company-wise as more curated questions get added.
              </p>
            </div>

            <div className="rounded-[24px] bg-white px-5 py-4 text-left border border-[#e2eaf1] lg:min-w-[180px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#84a0b8]">Progress</p>
              <p className="mt-2 text-4xl font-bold text-[#153554]">{selectedCard.progress}%</p>
              <p className="mt-1 text-sm text-[#6d89a3]">{selectedCard.topics} total topics</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {selectedQuestions.length ? (
              selectedQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-[24px] border border-[#d6e6f1] bg-white p-5 shadow-[0_12px_30px_rgba(111,148,180,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#85a0b6]">{selectedCompany}</p>
                      <h3 className="mt-2 text-xl font-semibold text-[#132d48]">{formatQuestionTitle(question, selectedCompany)}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyClassMap[question.difficulty]}`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#67839b]">Topic focus: {question.subtitle}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#cbddea] bg-[#f7fbfd] px-5 py-8 text-sm text-[#64809a] md:col-span-2">
                No company-specific question cards are added for {selectedCompany} yet. The layout is ready, and we can plug in the full company bank next.
              </div>
            )}
          </div>
        </div>
      </section>
    </UserSidebarLayout>
  );
}
