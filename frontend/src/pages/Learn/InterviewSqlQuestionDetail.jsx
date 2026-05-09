import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { practiceAPI } from '../../services/api';

const sqlNotesById = {
  'iq-7': `## Notes\n\n### JOIN basics\n- Use an \`INNER JOIN\` to keep only matching rows.\n- Use a \`LEFT JOIN\` to keep all rows from the left table.\n\n### Example\n\n\`\`\`sql\nSELECT u.id, o.total\nFROM users u\nJOIN orders o ON o.user_id = u.id;\n\`\`\`\n`,
};

export default function InterviewSqlQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/sql/');
  const sqlSourcePath = searchParams.get('from');
  const backPath = isDashboardContext
    ? sqlSourcePath === '/dashboard/practice' || sqlSourcePath === '/dashboard/practice/sql'
      ? sqlSourcePath
      : '/dashboard/practice/sql'
    : '/learn/interview-questions/sql';

  const question = useMemo(() => {
    return interviewQuestionsCatalog.find((q) => q.id === questionId && q.topic === 'SQL') || null;
  }, [questionId]);

  const notes = useMemo(() => {
    if (!question) return '';
    return (
      sqlNotesById[question.id] ||
      `## Explanation\n\n**${question.title}** (Topic: ${question.subtitle})\n\nNotes/explanation will be added here (admin markdown upload).`
    );
  }, [question]);

  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const recordPracticeAttempt = async (correct) => {
    if (!isDashboardContext || !questionId) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      await practiceAPI.submitAttempt({
        questionId,
        track: 'SQL',
        isCorrect: Boolean(correct),
      });
      setSaveMessage(correct ? 'Marked as solved.' : 'Attempt saved.');
    } catch (error) {
      setSaveMessage('Could not save progress.');
      console.error('Failed to record practice attempt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!question) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-5xl">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="mt-4 text-gray-900 dark:text-white">Question not found.</div>
        </div>
      </UserSidebarLayout>
    );
  }

  return (
    <UserSidebarLayout maxWidthClass="max-w-5xl">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {question.title}
          </h1>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {question.subtitle} • {question.difficulty}
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
          </div>

          {isDashboardContext && (
            <div className="mt-6 rounded-xl border border-[#d6e9ff] bg-[#f5fbff]/80 p-4 text-sm text-[#0d2a57] dark:border-[#2a4f87] dark:bg-[#0b214d]/65 dark:text-[#8fd9ff]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Track your practice</p>
                  <p className="text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">
                    Mark this question as attempted or solved.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => recordPracticeAttempt(false)}
                    disabled={isSaving}
                    className="rounded-full border border-[#86c4ff]/55 bg-white/80 px-3 py-1 text-xs font-semibold text-[#2d7fe8] transition hover:bg-[#e9f4ff] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#6fbfff]/40 dark:bg-[#0d366f] dark:text-[#8fd9ff]"
                  >
                    Mark attempted
                  </button>
                  <button
                    type="button"
                    onClick={() => recordPracticeAttempt(true)}
                    disabled={isSaving}
                    className="rounded-full border border-emerald-300/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                  >
                    Mark solved
                  </button>
                </div>
              </div>
              {saveMessage && (
                <p className="mt-2 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">{saveMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </UserSidebarLayout>
  );
}
