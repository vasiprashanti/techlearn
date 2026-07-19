import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CheckCircle, Play } from 'lucide-react';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { interviewQuestionsCatalog } from '../../data/adminQuestionBankData';
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
  java: { id: "java", name: "Java", monacoLanguage: "java", starter: "public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}\n" },
  sql: { id: "sql", name: "SQL", monacoLanguage: "sql", starter: "-- Write your SQL query here\nSELECT * FROM users;\n" }
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
      ? dsaSourcePath
        ? decodeURIComponent(dsaSourcePath)
        : '/dashboard/practice'
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
    setOutput('Running against saved test cases...');

    try {
      const res = await practiceAPI.recordSubmission({
        questionId: question.id,
        track: 'DSA',
        isCorrect: false,
        code,
        language: selectedLanguage,
        finalize: false,
      });
      const passed = Number(res?.passedTestCases || 0);
      const total = Number(res?.totalTestCases || 0);
      const accuracy = Number(res?.accuracy || 0);
      const detail = total > 0 ? `${passed}/${total} test cases passed (${accuracy}% accuracy).` : 'Code submitted for evaluation.';
      setOutput(detail);
      setIsLastSubmissionCorrect(Boolean(res?.isCorrect));
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
      const passed = Number(res?.passedTestCases || 0);
      const total = Number(res?.totalTestCases || 0);
      const accuracy = Number(res?.accuracy || 0);
      if (res?.isCorrect) {
        setOutput(`Submission successful! ${passed}/${total} test cases passed.`);
        setIsLastSubmissionCorrect(true);
      } else if (passed > 0) {
        setOutput(`Partial submission saved. ${passed}/${total} test cases passed (${accuracy}% accuracy).`);
        setIsLastSubmissionCorrect(false);
      } else {
        setOutput(total > 0 ? `Submission saved. 0/${total} test cases passed.` : 'Submission saved for evaluation.');
        setIsLastSubmissionCorrect(false);
      }
      window.dispatchEvent(new CustomEvent('xpUpdated'));
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
      window.dispatchEvent(new CustomEvent('xpUpdated'));
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
      window.dispatchEvent(new CustomEvent('xpUpdated'));
    } catch (err) {
      console.error("Failed to finalize task:", err);
    }
    navigate('/dashboard');
  };

  const MarkdownComponents = {
    h2: ({ node, ...props }) => (
      <h2 
        className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-[#0043A1] pl-3 mb-4 mt-6" 
        {...props} 
      />
    ),
    h3: ({ node, ...props }) => (
      <h3 
        className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider border-l-4 border-[#0043A1] pl-3 mb-4 mt-6" 
        {...props} 
      />
    ),
    p: ({ node, ...props }) => (
      <p 
        className="leading-relaxed text-gray-700 dark:text-gray-300 text-[14.5px] mb-4" 
        {...props} 
      />
    ),
    ul: ({ node, ...props }) => (
      <ul 
        className="list-none pl-0 flex flex-col gap-2 mb-4" 
        {...props} 
      />
    ),
    li: ({ node, children, ...props }) => (
      <li 
        className="flex items-center gap-3 text-[14px] text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-[#111827] p-2.5 px-3.5 rounded-lg border border-gray-200 dark:border-gray-800" 
        {...props}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0043A1] shrink-0"></span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    pre: ({ node, children, ...props }) => (
      <div className="bg-[#111827] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col my-4">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-100 dark:bg-[#1f2937] border-b border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
          <span>Code Block / Example</span>
        </div>
        <pre className="p-3.5 text-[13px] font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#0b0f19] overflow-x-auto whitespace-pre-wrap m-0 border-0" {...props}>
          {children}
        </pre>
      </div>
    ),
    code: ({ node, inline, className, children, ...props }) => {
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-[#0043A1] dark:text-[#93c5fd] font-mono text-xs rounded border border-gray-200 dark:border-gray-700 font-semibold" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="text-xs font-mono" {...props}>
          {children}
        </code>
      );
    }
  };

  return (
    <UserSidebarLayout maxWidthClass="max-w-[1400px]">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .thin-scrollbar::-webkit-scrollbar {
          width: 4px !important;
          height: 4px !important;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5) !important;
          border-radius: 2px !important;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8) !important;
        }
        .thin-scrollbar {
          -ms-overflow-style: auto !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent !important;
        }
      `}</style>
      {!isDailyMode && (
        <div className="w-full text-left mb-3">
          <button
            type="button"
            onClick={() => navigate(dsaListPath)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d7fe8] hover:text-[#236ccd] dark:text-[#8fd9ff] dark:hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </button>
        </div>
      )}
      <div className="min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)] flex flex-col lg:overflow-hidden w-full">
        {/* Workspace Body split */}
        <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden gap-4">
          {/* Left Panel - Contains ALL content inside the card */}
          <aside 
            className="w-full lg:w-[35%] xl:w-[40%] h-[300px] lg:h-auto flex flex-col shrink-0 overflow-y-auto rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3 gap-3 no-scrollbar"
          >
            {/* Header Card (Top 15%) */}
            <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/45 dark:bg-[#001233]/60 p-3 rounded-xl shrink-0 lg:h-[15%] lg:min-h-[15%] flex flex-col justify-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-[#0d2a57] dark:text-white leading-tight">
                {question.title}
              </h1>

              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded-full border border-white/5 bg-[#0043A1]/20 text-[#93c5fd] border-[#0043A1]/40 px-2 py-0.5 font-semibold">
                  {question.subtitle}
                </span>
                <span className="rounded-full border border-white/5 bg-[#14532d] text-[#86efac] border-[#166534] px-2 py-0.5 font-semibold">
                  {question.difficulty}
                </span>
              </div>
            </div>

            {/* Problem Statement Card (Middle 30%) */}
            <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors lg:h-[30%] lg:min-h-[30%] overflow-y-auto shrink-0 text-left flex flex-col thin-scrollbar">
              <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2 shrink-0">
                Problem Statement
              </h2>
              <div className="prose prose-slate max-w-none dark:prose-invert text-xs leading-normal flex-1 overflow-y-auto thin-scrollbar">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {question.description || `**${question.title}** (Topic: ${question.subtitle})\n\nProblem statement will be added here.`}
                </ReactMarkdown>
              </div>
            </div>

            {/* Input & Output Format (Bottom 55% split) */}
            {(question.inputFormat || question.outputFormat) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full lg:h-[50%] lg:min-h-[50%] shrink-0 min-h-0 overflow-y-auto thin-scrollbar">
                {question.inputFormat && (
                  <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-left flex flex-col min-h-0 thin-scrollbar">
                    <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2 shrink-0">
                      Input Format
                    </h2>
                    <div className="prose prose-slate max-w-none dark:prose-invert text-xs leading-normal flex-1 overflow-y-auto thin-scrollbar">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {question.inputFormat}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {question.outputFormat && (
                  <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-left flex flex-col min-h-0 thin-scrollbar">
                    <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2 shrink-0">
                      Output Format
                    </h2>
                    <div className="prose prose-slate max-w-none dark:prose-invert text-xs leading-normal flex-1 overflow-y-auto thin-scrollbar">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {question.outputFormat}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample Testcases (Rest under this as separate cards) */}
            {question.visibleTestCases && question.visibleTestCases.length > 0 && (
              <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors shrink-0">
                <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2">
                  Sample Testcase
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 dark:bg-[#111827] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center px-3 py-1.5 bg-gray-100 dark:bg-[#1f2937] border-b border-gray-300 dark:border-gray-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Input</span>
                      <button 
                        onClick={() => {
                          const text = question.visibleTestCases[0]?.input || "";
                          navigator.clipboard.writeText(text);
                        }}
                        className="bg-[#0043A1] text-white border-none px-2 py-0.5 rounded text-[9px] font-semibold hover:bg-[#003680] transition active:scale-95"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-2.5 text-[11px] font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#0b0f19] overflow-x-auto whitespace-pre-wrap no-scrollbar">
                      {question.visibleTestCases[0]?.input || ""}
                    </pre>
                  </div>

                  <div className="bg-white/60 dark:bg-[#111827] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center px-3 py-1.5 bg-gray-100 dark:bg-[#1f2937] border-b border-gray-300 dark:border-gray-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <span>Output</span>
                      <button 
                        onClick={() => {
                          const text = question.visibleTestCases[0]?.output || question.visibleTestCases[0]?.expectedOutput || "";
                          navigator.clipboard.writeText(text);
                        }}
                        className="bg-[#0043A1] text-white border-none px-2 py-0.5 rounded text-[9px] font-semibold hover:bg-[#003680] transition active:scale-95"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-2.5 text-[11px] font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#0b0f19] overflow-x-auto whitespace-pre-wrap no-scrollbar">
                      {question.visibleTestCases[0]?.output || question.visibleTestCases[0]?.expectedOutput || ""}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Right Panel - Divided into 2 cards (ratio 2:1, outer cards rounded, inner modules sharp) */}
          <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-4 lg:overflow-hidden">
            {/* Card 1: Coding Space (outer rounded-xl, inner editor sharp) */}
            <section className="h-[450px] lg:h-auto lg:flex-[2] flex flex-col overflow-hidden rounded-xl border border-[#2563eb]/15 bg-white/20 p-3 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 shrink-0 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Code Editor</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => {
                      const nextLang = e.target.value;
                      setSelectedLanguage(nextLang);
                      setCode(LANGUAGES[nextLang].starter);
                    }}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    {Object.values(LANGUAGES).map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Run / Submit buttons in Top Right Corner of Editor Card */}
                <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex-1 sm:flex-initial sm:w-20 justify-center items-center inline-flex gap-1.5 rounded-lg border border-[#0043A1]/20 dark:border-[#0043A1]/40 bg-[#0043A1]/5 dark:bg-[#0043A1]/15 px-2.5 py-1.5 text-xs font-semibold text-[#2563eb] dark:text-[#93c5fd] hover:bg-[#0043A1]/15 dark:hover:bg-[#0043A1]/35 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isRunning ? 'Run...' : 'Run'}
                  </button>

                  {isDashboardContext && (
                    <button
                      type="button"
                      onClick={markSolved}
                      disabled={isSubmitted}
                      className="flex-1 sm:flex-initial sm:w-32 justify-center items-center inline-flex gap-1.5 rounded-lg bg-[#0043A1] hover:bg-[#003680] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 transition-all duration-200 active:scale-[0.98] shadow-sm z-10"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Submit Code
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden rounded-none border border-gray-300 dark:border-gray-700">
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

            {/* Card 2: Terminal / Output Console (flex-[1], outer rounded-xl, inner terminal sharp) */}
            <section className="flex-[1] min-h-[90px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#0043A1]/15 bg-white/20 p-3 shadow-[0_20px_50px_rgba(12,52,171,0.06)] backdrop-blur-xl dark:border-[#0043A1]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
              <div className="font-semibold mb-2 shrink-0 text-sm text-[#0d2a57] dark:text-[#8fd9ff] border-b border-black/5 dark:border-white/5 pb-1.5">
                Terminal
              </div>
              <pre className="flex-grow overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed bg-[#f3f4f6]/50 dark:bg-black/35 p-2 rounded-none border dark:border-gray-700 text-gray-800 dark:text-emerald-400">
                {output || 'Run your code to see result output here.'}
              </pre>
            </section>
          </div>
        </div>

        {/* Bottom Action Bar */}
        {isDailyMode && (
          <footer className="relative py-1 shrink-0 mt-4 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between select-none">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0043A1]/15 dark:border-white/10 bg-[#0043A1]/5 dark:bg-white/5 px-4 py-1.5 text-xs font-semibold text-[#0043A1] dark:text-gray-300 hover:bg-[#0043A1]/10 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
            >
              Back
            </button>

            {/* Daily Tasks X/N centered between them */}
            <div className="absolute left-1/2 -translate-x-1/2 font-press-start text-[9px] md:text-[10px] text-[#0043A1] dark:text-[#8fd9ff] uppercase tracking-wider">
              {`CODING TASK ${currentTaskIndex + 1}/${dailySequence.length}`}
            </div>

            {/* Next/Finish button fixed to the bottom-right corner */}
            <div>
              {currentTaskIndex < dailySequence.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0043A1] hover:bg-[#003680] active:scale-[0.98] px-5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-105 transition-all duration-200 active:scale-[0.98]"
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
