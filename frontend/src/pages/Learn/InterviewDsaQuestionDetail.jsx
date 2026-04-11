import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Play } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { compilerAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const dsaDetailsById = {
  'iq-1': {
    statement: `## Problem\nGiven an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to* \`target\`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    starterCode: `# Two Sum\n\ndef two_sum(nums, target):\n    # TODO: return [i, j]\n    return []\n\n\nif __name__ == "__main__":\n    print(two_sum([2, 7, 11, 15], 9))\n`,
  },
};

export default function InterviewDsaQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const question = useMemo(() => {
    return interviewQuestionsCatalog.find((q) => q.id === questionId && q.topic === 'DSA') || null;
  }, [questionId]);

  const details = useMemo(() => {
    if (!question) return null;
    return (
      dsaDetailsById[question.id] || {
        statement: `## Problem\n\n**${question.title}** (Topic: ${question.subtitle})\n\nProblem statement will be added here.`,
        starterCode: `# ${question.title}\n\n# TODO: write your solution here\n\n`,
      }
    );
  }, [question]);

  const [code, setCode] = useState(details?.starterCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setCode(details?.starterCode || '');
    setOutput('');
  }, [questionId, details?.starterCode]);

  if (!question || !details) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-5xl">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate('/learn/interview-questions/dsa')}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to DSA Questions
          </button>

          <div className="mt-4 text-gray-900 dark:text-white">
            Question not found.
          </div>
        </div>
      </UserSidebarLayout>
    );
  }

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');

    try {
      const result = await compilerAPI.compileCode({
        language: 'python',
        source_code: code,
        stdin: '',
      });

      let outputText = '';
      if (result?.stdout) outputText += result.stdout;
      if (result?.stderr) outputText += `\n❌ Error:\n${result.stderr}`;
      if (result?.compile_output) outputText += `\n📝 Compilation Output:\n${result.compile_output}`;
      if (!outputText.trim()) outputText = '✅ Code executed successfully (no output)';

      setOutput(outputText);
    } catch (error) {
      setOutput(`❌ Execution failed: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-6xl">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/40">
          <button
            type="button"
            onClick={() => navigate('/learn/interview-questions/dsa')}
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{details.statement}</ReactMarkdown>
          </div>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Editor</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Python</div>
            </div>

            <button
              type="button"
              onClick={runCode}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700/40 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running…' : 'Run'}
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/20 dark:border-gray-700/30">
            <Editor
              height="22rem"
              defaultLanguage="python"
              value={code}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              onChange={(value) => setCode(value ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="mt-4 rounded-xl border border-white/20 bg-white/60 p-4 text-sm text-gray-800 dark:border-gray-700/20 dark:bg-gray-950/40 dark:text-gray-200">
            <div className="mb-2 font-semibold text-gray-900 dark:text-white">Output</div>
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
              {output || 'Run your code to see output here.'}
            </pre>
          </div>
        </div>
      </div>
    </UserSidebarLayout>
  );
}
