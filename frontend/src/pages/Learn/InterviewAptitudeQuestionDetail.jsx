import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const aptitudeNotesById = {
  'iq-25': `## Notes\n\n### Ratio setup\n- Convert all ratios to a common base before comparing.\n- Keep units consistent while solving word problems.\n\n### Tip\nUse a small table to avoid arithmetic mistakes.`,
};

export default function InterviewAptitudeQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/aptitude/');
  const aptitudeSourcePath = searchParams.get('from');
  const backPath = isDashboardContext
    ? aptitudeSourcePath === '/dashboard/practice' || aptitudeSourcePath === '/dashboard/practice/aptitude'
      ? aptitudeSourcePath
      : '/dashboard/practice/aptitude'
    : '/learn/interview-questions/aptitude';

  const question = useMemo(() => {
    return interviewQuestionsCatalog.find((q) => q.id === questionId && q.topic === 'Aptitude') || null;
  }, [questionId]);

  const notes = useMemo(() => {
    if (!question) return '';
    return (
      aptitudeNotesById[question.id] ||
      `## Explanation\n\n**${question.title}** (Topic: ${question.subtitle})\n\nAptitude notes/explanation will be added here.`
    );
  }, [question]);

  if (!question) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-5xl">
        <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="mt-4 text-[#0d2a57] dark:text-[#8fd9ff]">Question not found.</div>
        </div>
      </UserSidebarLayout>
    );
  }

  return (
    <UserSidebarLayout maxWidthClass="max-w-5xl">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-5 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#0d2a57] dark:text-[#8fd9ff]">
            {question.title}
          </h1>
          <div className="mt-1 text-sm text-[#4c6f9a] dark:text-[#7fb8e2]">
            {question.subtitle} • {question.difficulty}
          </div>
        </div>

        <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
          </div>
        </div>
      </div>
    </UserSidebarLayout>
  );
}
