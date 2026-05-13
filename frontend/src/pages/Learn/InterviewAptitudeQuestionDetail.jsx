import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { practiceAPI } from '../../services/practiceApi';

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

  const [liveQuestions, setLiveQuestions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    practiceAPI.getQuestions('Aptitude')
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setLiveQuestions(data);
      })
      .catch(() => {
        if (!cancelled) setLiveQuestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const question = useMemo(() => {
    return (
      interviewQuestionsCatalog.find((q) => q.id === questionId && q.topic === 'Aptitude') ||
      liveQuestions.find((q) => String(q.id) === String(questionId) && q.topic === 'Aptitude') ||
      null
    );
  }, [questionId, liveQuestions]);

  const notes = useMemo(() => {
    if (!question) return '';
    return (
      aptitudeNotesById[question.id] ||
      question.description ||
      `## Explanation\n\n**${question.title}** (Topic: ${question.subtitle})\n\nAptitude notes/explanation will be added here.`
    );
  }, [question]);
  const [submissionMessage, setSubmissionMessage] = useState('');

  const markSolved = async () => {
    try {
      await practiceAPI.recordSubmission({ questionId: question.id, track: 'Aptitude', isCorrect: true });
      setSubmissionMessage('Practice progress saved.');
    } catch (error) {
      setSubmissionMessage(error?.message || 'Could not save practice progress.');
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
          {isDashboardContext ? (
            <button
              type="button"
              onClick={markSolved}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
            >
              <CheckCircle className="h-4 w-4" />
              Mark solved
            </button>
          ) : null}
          {submissionMessage ? (
            <p className="mt-2 text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">{submissionMessage}</p>
          ) : null}
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
