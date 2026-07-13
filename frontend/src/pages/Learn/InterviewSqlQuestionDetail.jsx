import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
import { practiceAPI } from '../../services/practiceApi';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';

const sqlNotesById = {
  'iq-7': `## Notes\n\n### JOIN basics\n- Use an \`INNER JOIN\` to keep only matching rows.\n- Use a \`LEFT JOIN\` to keep all rows from the left table.\n\n### Example\n\n\`\`\`sql\nSELECT u.id, o.total\nFROM users u\nJOIN orders o ON o.user_id = u.id;\n\`\`\`\n`,
};

export default function InterviewSqlQuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDailyMode = searchParams.get('mode') === 'daily';
  const isDashboardContext = location.pathname.startsWith('/dashboard/practice/sql/');
  const sqlSourcePath = searchParams.get('from');
  const backPath = isDailyMode
    ? '/dashboard'
    : isDashboardContext
      ? sqlSourcePath === '/dashboard/practice' || sqlSourcePath === '/dashboard/practice/sql'
        ? sqlSourcePath
        : '/dashboard/practice/sql'
      : '/learn/interview-questions/sql';

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

  useEffect(() => {
    if (!isDailyMode) return;

    const handleClipboardEvent = (e) => {
      e.preventDefault();
      alert("Copy/Cut/Paste is disabled during daily tasks.");
    };

    const handleKeydown = (e) => {
      const pressedKey = String(e.key || "").toLowerCase();
      const isClipboardShortcut =
        ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "insert"].includes(pressedKey)) ||
        (e.shiftKey && pressedKey === "insert");

      if (isClipboardShortcut) {
        e.preventDefault();
        alert("Clipboard keyboard shortcuts are disabled during daily tasks.");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      alert("Right-click context menu is disabled during daily tasks.");
    };

    document.addEventListener("copy", handleClipboardEvent, true);
    document.addEventListener("cut", handleClipboardEvent, true);
    document.addEventListener("paste", handleClipboardEvent, true);
    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      document.removeEventListener("copy", handleClipboardEvent, true);
      document.removeEventListener("cut", handleClipboardEvent, true);
      document.removeEventListener("paste", handleClipboardEvent, true);
      document.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [isDailyMode]);

  const dailySequence = useMemo(() => {
    if (!isDailyMode) return [];
    return dailyTasksList.filter(t => t.taskType === 'SQL');
  }, [dailyTasksList, isDailyMode]);

  const currentTaskIndex = useMemo(() => {
    return dailySequence.findIndex(t => String(t.questionId) === String(questionId));
  }, [dailySequence, questionId]);

  useEffect(() => {
    if (isDailyMode && dailySequence[currentTaskIndex]) {
      const currentTask = dailySequence[currentTaskIndex];
      if (currentTask.code) {
        setCode(currentTask.code);
        setIsLastSubmissionCorrect(currentTask.isCorrect || false);
        setOutput('');
        return;
      }
    }
    setCode('-- Write your SQL query here\nSELECT * FROM users;\n');
    setIsLastSubmissionCorrect(false);
    setOutput('');
  }, [questionId, isDailyMode, dailySequence, currentTaskIndex]);

  useEffect(() => {
    let cancelled = false;
    practiceAPI.getQuestions('SQL')
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

  const { theme } = useTheme();
  const [code, setCode] = useState('-- Write your SQL query here\nSELECT * FROM users;\n');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('sql');
  const [isLastSubmissionCorrect, setIsLastSubmissionCorrect] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);

  const isQueryEmpty = (q) => {
    if (!q) return true;
    let cleaned = q.replace(/--.*$/gm, "");
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
    return cleaned.trim().length === 0;
  };

  const runQuery = async () => {
    if (isQueryEmpty(code)) {
      setOutput('Error: Query cannot be empty.');
      return;
    }
    setIsRunning(true);
    setOutput('Executing SQL query...');
    try {
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'SQL',
        isCorrect: false,
        code,
        language: selectedLanguage,
        finalize: false,
      });

      if (res?.isCorrect) {
        setOutput('Query executed successfully. Output matched the expected answer.');
        setIsLastSubmissionCorrect(true);
      } else {
        setOutput('Query executed, but the answer does not match the expected result yet.');
        setIsLastSubmissionCorrect(false);
      }
    } catch (error) {
      setOutput(`Execution failed: ${error?.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const localQ = interviewQuestionsCatalog.find((q) => q.id === questionId && q.topic === 'SQL');
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
            subtitle: data.categoryTitle || 'SQL',
            difficulty: data.difficulty || 'Easy',
            description: data.description || '',
            topic: 'SQL'
          });
        }
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load SQL question details:", err);
        if (!cancelled) {
          setQuestion(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [questionId]);

  const notes = useMemo(() => {
    if (!question) return '';
    return (
      sqlNotesById[question.id] ||
      question.description ||
      `## Explanation\n\n**${question.title}** (Topic: ${question.subtitle})\n\nNotes/explanation will be added here (admin markdown upload).`
    );
  }, [question]);
  const [submissionMessage, setSubmissionMessage] = useState('');

  const markSolved = async () => {
    if (isQueryEmpty(code)) {
      setOutput('Error: Query cannot be empty.');
      return;
    }
    try {
      setOutput('Submitting query for evaluation...');
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'SQL',
        isCorrect: false,
        code,
        finalize: false,
      });
      if (res && res.isCorrect) {
        setOutput('Submission successful! Query is correct.');
        setIsLastSubmissionCorrect(true);
      } else {
        setOutput('Error: Incorrect query. Please check your SQL and try again.');
        setIsLastSubmissionCorrect(false);
      }
    } catch (error) {
      setOutput(`Submission failed: ${error?.message || 'Unknown error occurred'}`);
    }
  };

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

  if (!question) {
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
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-105 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </button>
        </div>
      </UserSidebarLayout>
    );
  }

  const handleNext = async () => {
    try {
      await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'SQL',
        isCorrect: isLastSubmissionCorrect,
        code,
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
        track: 'SQL',
        isCorrect: isLastSubmissionCorrect,
        code,
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
          <aside className="w-full lg:w-[35%] xl:w-[40%] h-[300px] lg:h-auto flex flex-col shrink-0 overflow-hidden rounded-xl border border-[#2563eb]/15 dark:border-[#15366f]/45 bg-white/20 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
            {/* Header inside the Left Card */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 shrink-0">
              {!isDailyMode && (
                <button
                  type="button"
                  onClick={() => navigate(backPath)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff] mb-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              
              <h1 className="text-lg font-bold tracking-tight text-[#0d2a57] dark:text-white mb-2">
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
            <div className="flex-1 overflow-y-auto p-5">
              <div className="prose prose-slate max-w-none dark:prose-invert text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
              </div>
            </div>
          </aside>

          {/* Right Panel - Divided into 2 cards (ratio 2:1, outer cards rounded, inner modules sharp) */}
          <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-4 lg:overflow-hidden">
            {/* Card 1: SQL Editor space (outer rounded-xl, inner editor sharp) */}
            <section className="h-[450px] lg:h-auto lg:flex-[2] flex flex-col overflow-hidden rounded-xl border border-[#2563eb]/15 bg-white/20 p-3 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 shrink-0 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Code Editor</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="sql">SQL (PostgreSQL)</option>
                    <option value="mysql">SQL (MySQL)</option>
                  </select>
                </div>
                
                {/* Run / Submit buttons in Top Right Corner of Editor Card */}
                <div className="flex items-center gap-2 justify-end w-full sm:w-auto z-10">
                  <button
                    type="button"
                    onClick={runQuery}
                    disabled={isRunning}
                    className="flex-1 sm:flex-initial sm:w-24 justify-center items-center inline-flex gap-1.5 rounded-lg border border-[#2563eb]/20 dark:border-white/10 bg-[#2563eb]/5 dark:bg-white/5 px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#2563eb] dark:text-gray-300 hover:bg-[#2563eb]/15 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRunning ? 'Run...' : 'Run Query'}
                  </button>

                  {isDashboardContext && (
                    <button
                      type="button"
                      onClick={markSolved}
                      disabled={isSubmitted}
                      className="flex-1 sm:flex-initial sm:w-32 justify-center items-center inline-flex gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-1.5 sm:py-1 text-xs font-semibold text-white disabled:opacity-60 transition-all duration-200 active:scale-[0.98] shadow-sm z-10"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Submit Query
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden rounded-none border border-gray-300 dark:border-gray-700">
                <Editor
                  height="100%"
                  defaultLanguage="sql"
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

            {/* Card 2: Terminal / Console Output (flex-[1], outer rounded-xl, inner terminal sharp) */}
            <section className="flex-[1] min-h-[180px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#2563eb]/15 bg-white/20 p-3 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
              <div className="font-semibold mb-2 shrink-0 text-sm text-[#0d2a57] dark:text-[#8fd9ff] border-b border-black/5 dark:border-white/5 pb-1.5">
                Terminal
              </div>
              <pre className="flex-grow overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed bg-[#f3f4f6]/50 dark:bg-black/35 p-2 rounded-none border dark:border-gray-700 text-gray-800 dark:text-emerald-400">
                {output || 'Run your query to see result output here.'}
              </pre>
            </section>
          </div>
        </div>

        {/* Bottom Action Bar */}
        {isDailyMode && (
          <footer className="relative h-11 shrink-0 mt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between select-none">
            {/* Back button fixed to the bottom-left corner */}
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2563eb]/15 dark:border-white/10 bg-[#2563eb]/5 dark:bg-white/5 px-3 py-1 text-xs font-semibold text-[#2563eb] dark:text-gray-300 hover:bg-[#2563eb]/10 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
            >
              Back
            </button>

            {/* Daily Tasks X/N centered between them */}
            <div className="absolute left-1/2 -translate-x-1/2 font-press-start text-[9px] md:text-[10px] text-[#2563eb] dark:text-[#8fd9ff] uppercase tracking-wider">
              {`SQL TASK ${currentTaskIndex + 1}/${dailySequence.length}`}
            </div>

            {/* Next/Finish button fixed to the bottom-right corner */}
            <div>
              {currentTaskIndex < dailySequence.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] px-4 py-1 text-xs font-semibold text-white shadow-sm transition-all duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-1 text-xs font-semibold text-white shadow-sm hover:brightness-105 transition-all duration-200 active:scale-[0.98]"
                >
                  Finish
                </button>
              )}
            </div>
          </footer>
        )}
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
