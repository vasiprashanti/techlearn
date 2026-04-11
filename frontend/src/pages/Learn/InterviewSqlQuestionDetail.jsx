import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';

const sqlNotesById = {
  'iq-7': `## Notes\n\n### JOIN basics\n- Use an \`INNER JOIN\` to keep only matching rows.\n- Use a \`LEFT JOIN\` to keep all rows from the left table.\n\n### Example\n\n\`\`\`sql\nSELECT u.id, o.total\nFROM users u\nJOIN orders o ON o.user_id = u.id;\n\`\`\`\n`,
};

export default function InterviewSqlQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();

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

  if (!question) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-5xl">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate('/learn/interview-questions/sql')}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to SQL Questions
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
            onClick={() => navigate('/learn/interview-questions/sql')}
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
        </div>
      </div>
    </UserSidebarLayout>
  );
}
