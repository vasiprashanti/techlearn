import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CheckCircle, Play } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { compilerAPI } from '../../services/api';
import { practiceAPI } from '../../services/practiceApi';
import { useTheme } from '../../context/ThemeContext';

const dsaDetailsById = {
  'iq-1': {
    statement: `## Problem\nGiven an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to* \`target\`.\n\nYou may assume that each input would assume that each input would have exactly one solution, and you may not use the same element twice.`,
    starterCode: `# Two Sum\n\ndef two_sum(nums, target):\n    # TODO: return [i, j]\n    return []\n\n\nif __name__ == "__main__":\n    print(two_sum([2, 7, 11, 15], 9))\n`,
  },
};

const LANGUAGES = {
  python: { id: "python", name: "Python", monacoLanguage: "python", starter: "# Write your Python solution here\n" },
  javascript: { id: "javascript", name: "JavaScript", monacoLanguage: "javascript", starter: "// Write your JavaScript solution here\n" },
  java: { id: "java", name: "Java", monacoLanguage: "java", starter: "public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}\n" }
};

export default function InterviewDsaQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/dsa/');
  const sourceParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDailyMode = sourceParams.get('mode') === 'daily';
  const dsaSourcePath = sourceParams.get('from');
  const dsaListPath = isDailyMode
    ? '/dashboard'
    : isDashboardContext
      ? dsaSourcePath === '/dashboard/practice' || dsaSourcePath === '/dashboard/practice/dsa'
        ? dsaSourcePath
        : '/dashboard/practice/dsa'
      : '/learn/interview-questions/dsa';

  const [liveQuestions, setLiveQuestions] = useState([]);
  const [dailyTasksList, setDailyTasksList] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchDailyTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/daily-task/today`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload?.success) {
          if (payload.data?.isFullyCompleted) {
            navigate('/dashboard', { replace: true });
            return;
          }
          if (payload.data?.tasks) {
            setDailyTasksList(payload.data.tasks);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching daily tasks:", err);
    }
  };

  useEffect(() => {
    if (isDailyMode) {
      fetchDailyTasks();
      setIsSubmitted(false);
    }
  }, [questionId, isDailyMode]);

  const dailySequence = useMemo(() => {
    if (!isDailyMode) return [];
    return dailyTasksList.filter(t => t.taskType === 'Coding' || t.taskType === 'Debugging');
  }, [dailyTasksList, isDailyMode]);

  const currentTaskIndex = useMemo(() => {
    return dailySequence.findIndex(t => String(t.questionId) === String(questionId));
  }, [dailySequence, questionId]);



  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const localQ = interviewQuestionsCatalog.find((q) => q.id === questionId && q.topic === 'DSA');
    if (localQ) {
      setQuestion(localQ);
      setLoading(false);
      return;
    }

    practiceAPI.getQuestionById(questionId)
      .then((data) => {
        if (!cancelled && data) {
          setQuestion({
            id: String(data._id),
            title: data.title,
            subtitle: data.categoryTitle || data.trackType || 'DSA',
            difficulty: data.difficulty || 'Easy',
            description: data.description || '',
            solutionCode: data.solutionCode || '',
            inputFormat: data.inputFormat || '',
            outputFormat: data.outputFormat || '',
            topic: 'DSA'
          });
        }
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load DSA question details:", err);
        if (!cancelled) {
          setQuestion(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [questionId]);

  const details = useMemo(() => {
    if (!question) return null;
    return (
      dsaDetailsById[question.id] || {
        statement: question.description
          ? `## Problem\n\n${question.description}\n\n${question.inputFormat ? `### Input Format\n${question.inputFormat}\n\n` : ''}${question.outputFormat ? `### Output Format\n${question.outputFormat}` : ''}`
          : `## Problem\n\n**${question.title}** (Topic: ${question.subtitle})\n\nProblem statement will be added here.`,
        starterCode: question.solutionCode || `# ${question.title}\n\n# TODO: write your solution here\n\n`,
      }
    );
  }, [question]);

  const [code, setCode] = useState(details?.starterCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isLastSubmissionCorrect, setIsLastSubmissionCorrect] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  useEffect(() => {
    if (!isDailyMode) {
      setCode(details?.starterCode || '');
      setOutput('');
    }
  }, [questionId, details?.starterCode, isDailyMode]);

  useEffect(() => {
    if (isDailyMode && dailySequence[currentTaskIndex]) {
      const currentTask = dailySequence[currentTaskIndex];
      if (currentTask.code) {
        setCode(currentTask.code);
        if (currentTask.language) {
          setSelectedLanguage(currentTask.language);
        }
        setIsLastSubmissionCorrect(currentTask.isCorrect || false);
        setOutput('');
        return;
      }
    }
    setCode(details?.starterCode || '');
    setIsLastSubmissionCorrect(false);
    setOutput('');
  }, [questionId, details?.starterCode, isDailyMode, dailySequence, currentTaskIndex]);

  if (loading) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
            <div className="absolute h-10 w-10 animate-ping rounded-full border-2 border-blue-400/30"></div>
          </div>
          <div className="text-sm font-semibold tracking-wide text-blue-700/80 dark:text-blue-300/80 animate-pulse">
            Loading assessment challenge...
          </div>
        </div>
      </UserSidebarLayout>
    );
  }

  if (!question || !details) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-[1400px]">
        <div className="rounded-2xl border border-red-200/30 bg-gradient-to-br from-red-50/90 to-red-100/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-red-900/30 dark:from-red-950/40 dark:to-red-900/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">Question Not Found</h2>
          <p className="text-sm text-red-700/80 dark:text-red-400/80 mb-6 max-w-md mx-auto">
            The requested assessment was not found or has been moved. Please return to the practice page.
          </p>
          <button
            type="button"
            onClick={() => navigate(dsaListPath)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-105 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to DSA Questions
          </button>
        </div>
      </UserSidebarLayout>
    );
  }

  const isDsaCodeEmpty = (c, lang) => {
    if (!c) return true;
    let cleaned = c;
    const l = String(lang || "").toLowerCase();
    if (l === "python" || l === "python3") {
      cleaned = cleaned.replace(/#.*$/gm, "");
      cleaned = cleaned.replace(/"""[\s\S]*?"""/g, "");
      cleaned = cleaned.replace(/'''[\s\S]*?'''/g, "");
    } else {
      cleaned = cleaned.replace(/\/\/.*$/gm, "");
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
    }
    return cleaned.trim().length === 0;
  };

  const runCode = async () => {
    if (isDsaCodeEmpty(code, selectedLanguage)) {
      setOutput('Error: Code cannot be empty.');
      return;
    }
    setIsRunning(true);
    setOutput('Running...');

    try {
      const result = await compilerAPI.compileCode({
        language: selectedLanguage,
        source_code: code,
        stdin: '',
      });

      let outputText = '';
      if (result?.stdout) outputText += result.stdout;
      if (result?.stderr) outputText += `\nError:\n${result.stderr}`;
      if (result?.compile_output) outputText += `\nCompilation Output:\n${result.compile_output}`;
      if (!outputText.trim()) outputText = 'Code executed successfully (no output)';

      setOutput(outputText);
    } catch (error) {
      setOutput(`Execution failed: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const markSolved = async () => {
    if (isDsaCodeEmpty(code, selectedLanguage)) {
      setOutput('Error: Code cannot be empty.');
      return;
    }
    try {
      setOutput('Submitting code for evaluation...');
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'DSA',
        isCorrect: false,
        code,
        language: selectedLanguage,
        finalize: false,
      });
      if (res && res.isCorrect) {
        setOutput('Submission successful! All test cases passed.');
        setIsLastSubmissionCorrect(true);
      } else {
        setOutput('Error: Incorrect submission. Some test cases failed.');
        setIsLastSubmissionCorrect(false);
      }
    } catch (error) {
      setOutput(`Submission failed: ${error?.message || 'Unknown error occurred'}`);
    }
  };

  const handleNext = async () => {
    try {
      await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'DSA',
        isCorrect: isLastSubmissionCorrect,
        code,
        language: selectedLanguage,
        finalize: false,
      });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
    const nextType = dailySequence[currentTaskIndex + 1].taskType === 'SQL' ? 'sql' : 'dsa';
    navigate(`/dashboard/practice/${nextType}/${dailySequence[currentTaskIndex + 1].questionId}?mode=daily`);
  };

  const handleFinish = async () => {
    try {
      await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'DSA',
        isCorrect: isLastSubmissionCorrect,
        code,
        language: selectedLanguage,
        finalize: true,
      });
    } catch (err) {
      console.error("Failed to finalize task:", err);
    }
    navigate('/dashboard');
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <div className="min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)] flex flex-col lg:overflow-hidden w-full">
        {/* Workspace Body split */}
        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden gap-4">
          {/* Left Panel - Contains ALL content inside the card */}
          <aside className="w-full lg:w-[35%] xl:w-[40%] h-[300px] lg:h-auto flex flex-col shrink-0 overflow-hidden rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
            {/* Header inside the Left Card */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 shrink-0">
              {!isDailyMode && (
                <button
                  type="button"
                  onClick={() => navigate(dsaListPath)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              
              <h1 className="text-xl font-bold tracking-tight text-[#0d2a57] dark:text-white mb-2">
                {question.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                  {question.subtitle}
                </span>
                <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                  {question.difficulty}
                </span>
              </div>
            </div>

            {/* Scrollable description inside the Left Card */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{details.statement}</ReactMarkdown>
              </div>
            </div>
          </aside>

          {/* Right Panel - Divided into 2 cards (ratio 2:1, outer cards rounded, inner modules sharp) */}
          <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-4 lg:overflow-hidden">
            {/* Card 1: Coding Space (outer rounded-2xl, inner editor sharp) */}
            <section className="h-[450px] lg:h-auto lg:flex-[2] flex flex-col overflow-hidden rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-4 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Code Editor</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const nextLang = e.target.value;
                      setSelectedLanguage(nextLang);
                      setCode(LANGUAGES[nextLang].starter);
                    }}
                    className="rounded-lg border border-gray-300 px-2 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    {Object.values(LANGUAGES).map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Run / Submit buttons in Top Right Corner of Editor Card */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={runCode}
                    disabled={isRunning}
                    className="inline-flex w-20 justify-center items-center gap-1.5 rounded-lg border border-[#86c4ff]/55 bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#6fbfff]/40"
                  >
                    <Play className="h-3 w-3" />
                    {isRunning ? 'Run...' : 'Run'}
                  </button>

                  {isDashboardContext && (
                    <button
                      type="button"
                      onClick={markSolved}
                      disabled={isSubmitted}
                      className="inline-flex w-36 justify-center items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Submit Code
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden rounded-none border border-white/20 dark:border-gray-700/30">
                <Editor
                  height="100%"
                  language={LANGUAGES[selectedLanguage].monacoLanguage}
                  value={code}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  onChange={(value) => {
                    setCode(value ?? '');
                    setIsLastSubmissionCorrect(false);
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </section>

            {/* Card 2: Terminal / Output Console (flex-[1], outer rounded-2xl, inner terminal sharp) */}
            <section className="flex-[1] min-h-[180px] lg:min-h-0 flex flex-col overflow-hidden rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-4 shadow-[0_12px_34px_rgba(60,131,246,0.12)] backdrop-blur-xl dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
              <div className="font-semibold mb-2 shrink-0 text-sm text-[#0d2a57] dark:text-[#8fd9ff] border-b border-black/5 dark:border-white/5 pb-1.5">
                Terminal
              </div>
              <pre className="flex-grow overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed bg-white/50 dark:bg-black/35 p-3 rounded-none border dark:border-gray-700/50 text-[#0d2a57] dark:text-emerald-400">
                {output || 'Run your query to see result output here.'}
              </pre>
            </section>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <footer className="h-16 shrink-0 mt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="text-xs text-[#4c6f9a] dark:text-[#7fb8e2]">
            {submissionMessage || (isDailyMode && `Daily Task Question ${currentTaskIndex + 1} of ${dailySequence.length}`)}
          </div>
          
          {/* Back & Next Navigation buttons at the bottom right */}
          {isDailyMode && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (currentTaskIndex === 0) {
                    navigate('/dashboard');
                  } else {
                    const prevTask = dailySequence[currentTaskIndex - 1];
                    const prevType = prevTask.taskType === 'SQL' ? 'sql' : 'dsa';
                    navigate(`/dashboard/practice/${prevType}/${prevTask.questionId}?mode=daily`);
                  }
                }}
                className="inline-flex w-24 justify-center items-center gap-2 rounded-xl border border-[#86c4ff]/55 bg-white/40 dark:bg-black/35 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-black/50 transition"
              >
                Back
              </button>

              {currentTaskIndex < dailySequence.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex w-28 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex w-28 justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  Finish
                </button>
              )}
            </div>
          )}
        </footer>
      </div>

      {showFinishModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#86c4ff]/30 bg-white p-6 shadow-2xl dark:bg-gray-900 text-gray-900 dark:text-white">
            <h3 className="text-lg font-bold text-[#0d2a57] dark:text-[#8fd9ff] mb-2">
              Finish without completing the task?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 font-medium">
              You have not successfully completed this task. If you finish now, your progress will not be saved. Do you want to finish anyway?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishModal(false);
                  navigate('/dashboard');
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              >
                Yes, Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </UserSidebarLayout>
  );
}
