import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { practiceAPI } from '../../services/api';

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

  const [saveMessage, setSaveMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const recordPracticeAttempt = async (correct) => {
    if (!isDashboardContext || !questionId) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      await practiceAPI.submitAttempt({
        questionId,
        track: 'Aptitude',
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

          {isDashboardContext && (
            <div className="mt-6 rounded-xl border border-[#86c4ff]/40 bg-[#f5fbff]/80 p-4 text-sm text-[#0d2a57] dark:border-[#6fbfff]/35 dark:bg-[#0b2f67]/55 dark:text-[#8fd9ff]">
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
