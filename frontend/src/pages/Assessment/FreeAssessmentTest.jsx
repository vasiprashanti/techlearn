import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowLeft,
  ArrowRight,
  SendHorizontal,
  Sparkles,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Code,
  FileText,
  RotateCcw,
  ChevronDown,
  ExternalLink,
  Terminal,
  Square,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { programLearningAPI } from '../../services/programLearningApi';
import { compilerAPI } from '../../services/api';
import pixelStarImg from '../../assets/pixel-star.png';

const LANGUAGES = {
  java: {
    id: 'java',
    name: 'Java',
    monacoLanguage: 'java',
    starter: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
  },
  python: {
    id: 'python',
    name: 'Python',
    monacoLanguage: 'python',
    starter: '# Write your solution here\n',
  },
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function FreeAssessmentTest() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignment, setAssignment] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [codeSolutions, setCodeSolutions] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('java');
  const [code, setCode] = useState(LANGUAGES.java.starter);
  const [output, setOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [showQuestionDetails, setShowQuestionDetails] = useState(false);

  // Run Limits for Judge0 compiler protection (5 runs per question)
  const MAX_RUNS_PER_QUESTION = 5;
  const runStorageKey = useMemo(() => `free_assessment_runs_${programId || 'default'}`, [programId]);
  const [runCounts, setRunCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(`free_assessment_runs_${programId || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [customInput, setCustomInput] = useState('');
  const [activeTerminalTab, setActiveTerminalTab] = useState('output'); // 'output' | 'input'
  const [executionResult, setExecutionResult] = useState(null);

  // 30-Minute Countdown Timer (1800 seconds)
  const timerStorageKey = useMemo(() => `free_assessment_timer_${programId || 'default'}`, [programId]);
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const saved = localStorage.getItem(timerStorageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) || parsed <= 0 ? 30 * 60 : parsed;
      }
    } catch (e) {
      console.warn('Could not read timer from localStorage:', e);
    }
    return 30 * 60; // 30 minutes
  });

  const currentRunsUsed = runCounts[activeQuestionIndex] || 0;
  const currentRunsLeft = Math.max(0, MAX_RUNS_PER_QUESTION - currentRunsUsed);

  // Load assignment data
  useEffect(() => {
    let isMounted = true;
    const loadAssessment = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await programLearningAPI.getAssignment(programId);
        if (!isMounted) return;

        if (response?.success && response?.assignment) {
          const ass = response.assignment;
          setAssignment(ass);

          // Populate already attempted questions
          const submittedSet = new Set();
          const savedAnswers = {};
          const savedCode = {};

          (ass.questions || []).forEach((q, idx) => {
            if (q.attempted) {
              submittedSet.add(idx);
              if (q.correctAnswer || q.score !== null) {
                savedAnswers[idx] = q.selectedAnswer || 'A';
              }
            }
          });

          setSubmittedQuestions(submittedSet);
          setSelectedAnswers(savedAnswers);

          if (ass.status === 'Completed') {
            setIsCompleted(true);
            try {
              localStorage.removeItem(timerStorageKey);
            } catch (e) {}
            setFinalResult({
              score: ass.score ?? ass.accuracy ?? 0,
              accuracy: ass.accuracy ?? 0,
              totalQuestions: ass.questions?.length || 0,
              answeredQuestions: submittedSet.size,
              categoryBreakdown: ass.categoryBreakdown || [],
            });
          }
        } else {
          throw new Error(response?.message || 'Failed to load free assessment assignment.');
        }
      } catch (err) {
        console.error('Error loading free assessment:', err);
        if (isMounted) setError(err.message || 'Unable to load your assessment.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAssessment();
    return () => {
      isMounted = false;
    };
  }, [programId, timerStorageKey]);

  // 30-Minute Countdown Timer ticking effect with auto-submit
  useEffect(() => {
    if (loading || isCompleted || showEndModal) return;

    if (timeLeft <= 0) {
      handleFinishAssessment();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        try {
          if (next > 0) {
            localStorage.setItem(timerStorageKey, String(next));
          } else {
            localStorage.removeItem(timerStorageKey);
          }
        } catch (e) {}

        if (next <= 0) {
          clearInterval(interval);
          handleFinishAssessment();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isCompleted, showEndModal, timeLeft, timerStorageKey]);

  const questions = useMemo(() => assignment?.questions || [], [assignment]);
  const currentItem = questions[activeQuestionIndex];
  const questionDetails = currentItem?.question || {};

  const isMcq = useMemo(() => {
    const type = String(
      currentItem?.categoryType || questionDetails?.categoryType || 'mcq'
    ).toLowerCase();
    return type.includes('mcq') || type.includes('quiz') || type === 'aptitude';
  }, [currentItem, questionDetails]);

  const categoryBreakdown = useMemo(() => {
    const questionsList = assignment?.questions || [];
    const breakdown = {};
    questionsList.forEach((q) => {
      const cat = q.category || q.subject || 'Core Concepts';
      if (!breakdown[cat]) {
        breakdown[cat] = { total: 0, attempted: 0, correct: 0 };
      }
      breakdown[cat].total += 1;
      if (q.attempted) {
        breakdown[cat].attempted += 1;
        if (q.correct === true) {
          breakdown[cat].correct += 1;
        }
      }
    });

    return Object.entries(breakdown).map(([name, data]) => {
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      let status = 'Needs Focus';
      let statusColor = 'text-rose-600 bg-rose-500/10 border-rose-500/20';
      if (accuracy >= 75) {
        status = 'Strong';
        statusColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
      } else if (accuracy >= 40) {
        status = 'Moderate';
        statusColor = 'text-amber-600 bg-amber-500/10 border-amber-500/20';
      }
      return { name, ...data, accuracy, status, statusColor };
    });
  }, [assignment]);

  // Update editor / option when active question changes
  useEffect(() => {
    if (!currentItem) return;
    setOutput('');
    setExecutionResult(null);
    setCustomInput('');
    setActiveTerminalTab('output');

    if (!isMcq) {
      const existing = codeSolutions[activeQuestionIndex];
      if (existing) {
        setCode(existing.code);
        setSelectedLanguage(existing.language);
      } else {
        const starter =
          questionDetails?.starterCode?.[selectedLanguage]?.code ||
          LANGUAGES[selectedLanguage]?.starter ||
          '';
        setCode(starter);
      }
    }
  }, [activeQuestionIndex, currentItem, isMcq]);

  const handleSelectOption = (optionLabel) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [activeQuestionIndex]: optionLabel,
    }));
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    const starter =
      questionDetails?.starterCode?.[lang]?.code ||
      LANGUAGES[lang]?.starter ||
      '';
    setCode(starter);
  };

  const handleRunCode = async () => {
    if (running || submitting || !currentItem) return;

    if (!code.trim()) {
      setOutput('Please write code before running.');
      return;
    }

    if (currentRunsLeft <= 0) {
      setOutput(`Run limit reached for this question (${MAX_RUNS_PER_QUESTION}/${MAX_RUNS_PER_QUESTION} runs used). You can still submit your final solution.`);
      return;
    }

    setRunning(true);
    setOutput('Running your code...');

    try {
      // Record run count usage
      const nextCounts = {
        ...runCounts,
        [activeQuestionIndex]: (runCounts[activeQuestionIndex] || 0) + 1,
      };
      setRunCounts(nextCounts);
      try {
        localStorage.setItem(runStorageKey, JSON.stringify(nextCounts));
      } catch (e) {}

      const inputPayload = (questionDetails?.visibleTestCases?.[0]?.input || '');

      const response = await compilerAPI.compileCode({
        language: selectedLanguage,
        source_code: code,
        stdin: inputPayload,
      });

      const outputLines = [];

      if (response?.compile_output) {
        outputLines.push('❌ Execution failed.');
        if (response.compile_output) {
          outputLines.push(response.compile_output);
        }
      } else if (response?.stderr) {
        outputLines.push('❌ Execution failed.');
        if (response.stderr) {
          outputLines.push(response.stderr);
        }
      } else {
        outputLines.push('✅ Code executed successfully.');

        if (response?.stdout) {
          outputLines.push(`\nConsole Output:\n${response.stdout}`);
        }

        if (response?.time != null) {
          outputLines.push(`Execution Time: ${response.time}s`);
        }
        if (response?.memory != null) {
          outputLines.push(`Memory Usage: ${response.memory} KB`);
        }

        // Visible test cases if available
        if (Array.isArray(questionDetails?.visibleTestCases) && questionDetails.visibleTestCases.length > 0) {
          outputLines.push(`\nSample Test Cases:`);
          questionDetails.visibleTestCases.forEach((tc, idx) => {
            const actual = (response?.stdout || '').trim();
            const expected = (tc.output || '').trim();
            const passed = actual === expected;
            outputLines.push(
              `  Test ${idx + 1}: ${passed ? '✅ Passed' : '❌ Failed'}\n` +
              `    Input: ${tc.input ?? 'N/A'}\n` +
              `    Expected: ${tc.output ?? 'N/A'}\n` +
              `    Actual: ${actual || '(empty)'}`
            );
          });
        }
      }

      setOutput(outputLines.join('\n'));
    } catch (err) {
      console.error('Run error:', err);
      setOutput(err.message || 'Run failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCurrent = async () => {
    if (!currentItem || submitting) return;

    setSubmitting(true);
    try {
      const qId = currentItem.questionId || currentItem.id;
      let answerPayload = { questionId: qId };

      if (isMcq) {
        const selected = selectedAnswers[activeQuestionIndex];
        if (!selected) {
          throw new Error('Please select an option before submitting.');
        }
        answerPayload.selectedAnswer = selected;
      } else {
        if (!code.trim()) {
          throw new Error('Please write your code solution before submitting.');
        }
        answerPayload.code = code;
        answerPayload.language = selectedLanguage;
      }

      const response = await programLearningAPI.submitAssignmentAnswer(
        programId,
        assignment.id || assignment._id,
        answerPayload
      );

      if (response?.success) {
        setSubmittedQuestions((prev) => new Set(prev).add(activeQuestionIndex));
        if (!isMcq) {
          setCodeSolutions((prev) => ({
            ...prev,
            [activeQuestionIndex]: { code, language: selectedLanguage },
          }));
          setOutput('Solution submitted successfully!');
        }

        // Auto move to next unsubmitted question
        if (activeQuestionIndex < questions.length - 1) {
          setActiveQuestionIndex(activeQuestionIndex + 1);
        }
      } else {
        throw new Error(response?.message || 'Failed to submit answer.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setOutput(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishAssessment = async () => {
    setShowEndModal(false);
    setSubmitting(true);
    try {
      localStorage.removeItem(timerStorageKey);
      localStorage.removeItem(runStorageKey);
    } catch (e) {}

    try {
      // Fetch latest assignment status / report
      const response = await programLearningAPI.getAssignment(programId);
      if (response?.assignment) {
        const ass = response.assignment;
        const total = ass.questions?.length || 0;
        const correct = (ass.questions || []).filter((q) => q.correct === true).length;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;

        setIsCompleted(true);
        setFinalResult({
          score: ass.score ?? ass.accuracy ?? score,
          accuracy: ass.accuracy ?? score,
          totalQuestions: total,
          answeredQuestions: (ass.questions || []).filter((q) => q.attempted).length,
          correctAnswers: correct,
        });
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Finish assessment error:', err);
      setIsCompleted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // 1. LOADING & ERROR STATES
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-black/5 bg-white/40 p-8 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Setting up your Free Assessment...
          </p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-white/80 dark:bg-[#071330] p-6 shadow-2xl text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assessment Error</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{error || 'Assignment not found.'}</p>
          <button
            onClick={() => navigate('/learn')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. COMPLETED ASSESSMENT RESULTS VIEW (Website UI & Detailed Breakdown)
  // -------------------------------------------------------------
  if (isCompleted && finalResult) {
    const totalQuestions = finalResult.totalQuestions || questions.length;
    const answeredCount = finalResult.answeredQuestions ?? (assignment?.questions || []).filter((q) => q.attempted).length;
    const correctCount = finalResult.correctAnswers ?? (assignment?.questions || []).filter((q) => q.correct === true).length;
    const accuracy = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : (finalResult.accuracy ?? finalResult.score ?? 0);
    const score = accuracy;
    const targetRole = assignment?.targetRole || user?.targetRole || 'Backend Developer';
    const targetCompany = assignment?.targetCompanies?.[0] || 'TCS';

    return (
      <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-3 sm:p-6 font-sans text-slate-900 dark:text-slate-100">
        <style>{`
          .thin-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .thin-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(60, 131, 246, 0.25);
            border-radius: 9999px;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(60, 131, 246, 0.45);
          }
          .dark .thin-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }
          .dark .thin-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.35);
          }
          .thin-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(60, 131, 246, 0.25) transparent;
          }
          .dark .thin-scrollbar {
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          }
        `}</style>

        <header className="absolute left-5 top-5 md:left-6 md:top-6 z-20 flex items-center gap-3">
          <img
            src={theme === 'dark' ? '/logoo2-small.webp' : '/logoo-small.webp'}
            alt="TLS"
            className="h-10 w-auto object-contain md:h-12"
          />
          <span className="hidden h-7 w-px bg-black/10 dark:bg-white/10 sm:block" />
          <span className="hidden font-press-start text-[10px] uppercase tracking-wider text-[#00113b]/70 dark:text-[#8fd9ff] sm:block md:text-xs">
            Free Assessment
          </span>
        </header>

        <div className="relative w-full max-w-3xl max-h-[84vh] overflow-y-auto thin-scrollbar rounded-2xl border border-black/5 bg-white/40 p-5 sm:p-6 text-center shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] z-10">
          {/* Header Row: Pixel Star, Title & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 bg-white/80 p-2 shadow-sm dark:border-[#15366f]/45 dark:bg-[#06183d]">
                <img
                  src={pixelStarImg}
                  alt="Assessment Result"
                  className="h-7 w-7 object-contain pixel-icon select-none"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="text-left">
                <h3 className="font-press-start text-[10px] sm:text-xs tracking-wider text-[#00113b] dark:text-[#8fd9ff] uppercase">
                  FREE ASSESSMENT RESULT
                </h3>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {score >= 75
                    ? 'Placement Readiness: High'
                    : score >= 40
                    ? 'Placement Readiness: Moderate'
                    : 'Placement Readiness: Developing'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Target Alignment Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/30 dark:border-white/5 dark:bg-black/30 px-3 py-1 text-xs text-slate-700 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-bold text-[#00113b] dark:text-white">{targetRole}</span>
                <span>·</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{targetCompany}</span>
              </div>
            </div>
          </div>

          {/* 2-Column Main Content Body */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {/* Left Column: Score Metrics & Actions */}
            <div className="flex flex-col justify-between space-y-3">
              {/* Score Highlight Box */}
              <div className="rounded-xl border border-black/5 bg-white/30 p-4 text-center dark:border-white/5 dark:bg-black/20 shadow-xs">
                <span className="block font-press-start text-[8px] uppercase leading-relaxed text-[#00113b]/60 dark:text-[#81bde6]">
                  OVERALL PERFORMANCE SCORE
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-[#00113b] dark:text-white">
                    {score}%
                  </span>
                </div>
              </div>

              {/* Supporting Metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  ['Correct Answers', `${correctCount} / ${totalQuestions}`],
                  ['Questions Attempted', `${answeredCount} / ${totalQuestions}`],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-black/5 bg-white/25 px-3 py-2.5 text-left dark:border-white/5 dark:bg-black/20 shadow-sm"
                  >
                    <span className="block font-press-start text-[7.5px] uppercase leading-relaxed text-[#00113b]/60 dark:text-[#81bde6]">
                      {label}
                    </span>
                    <span className="mt-1 block text-sm sm:text-base font-extrabold text-[#00113b] dark:text-white">
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center rounded-xl bg-[#a3e635] hover:bg-[#86efac] px-4 py-2.5 font-press-start text-[8.5px] font-bold text-[#0a1128] shadow-md shadow-[#a3e635]/25 transition hover:-translate-y-0.5 cursor-pointer"
                >
                  GO TO DASHBOARD →
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/learn')}
                  className="w-full flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 font-press-start text-[8.5px] font-bold text-[#00113b] dark:text-[#8fd9ff] shadow-sm transition hover:-translate-y-0.5 cursor-pointer"
                >
                  EXPLORE PROGRAMS
                </button>
              </div>
            </div>

            {/* Right Column: Topic Breakdown */}
            <div className="flex flex-col space-y-3">
              {/* Detailed Category Breakdown */}
              {categoryBreakdown.length > 0 && (
                <div className="rounded-xl border border-black/5 bg-white/20 p-3 dark:border-white/5 dark:bg-black/20 h-full flex flex-col justify-between">
                  <span className="block font-press-start text-[8px] uppercase tracking-wider text-[#00113b]/70 dark:text-[#8fd9ff] mb-2.5">
                    TOPIC BREAKDOWN
                  </span>

                  <div className="space-y-2 max-h-52 overflow-y-auto thin-scrollbar pr-1">
                    {categoryBreakdown.map((cat) => (
                      <div
                        key={cat.name}
                        className="rounded-lg border border-black/5 bg-white/30 p-2.5 dark:border-white/5 dark:bg-black/30 shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-[#00113b] dark:text-white uppercase tracking-wide truncate max-w-[140px]">
                            {cat.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase ${cat.statusColor}`}
                            >
                              {cat.status}
                            </span>
                            <span className="text-[11px] font-bold text-[#00113b] dark:text-white">
                              {cat.correct}/{cat.total} Correct
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cat.accuracy >= 75
                                ? 'bg-emerald-500'
                                : cat.accuracy >= 40
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(5, cat.accuracy)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-Width Question-by-Question Analysis Bottom Section */}
          <div className="mt-3.5 border-t border-black/5 dark:border-white/5 pt-3 text-left">
            <button
              type="button"
              onClick={() => setShowQuestionDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none"
            >
              <span>{showQuestionDetails ? 'Hide' : 'View'} Question-by-Question Analysis</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showQuestionDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showQuestionDetails && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto thin-scrollbar pr-1">
                {questions.map((q, idx) => {
                  const isCorrect = q.correct === true;
                  const isAttempted = q.attempted;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-white/35 p-2.5 dark:border-white/5 dark:bg-black/25 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/5 dark:bg-white/10 font-bold text-[9px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                          {q.question?.title || q.category || `Question ${idx + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] text-slate-500 uppercase font-medium">
                          {q.difficulty || 'Easy'}
                        </span>
                        {isAttempted ? (
                          isCorrect ? (
                            <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-bold text-[8.5px]">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 font-bold text-[8.5px]">
                              ✕ Incorrect
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-slate-500/15 text-slate-500 px-2 py-0.5 font-bold text-[8.5px]">
                            Skipped
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. LIVE FULL-SCREEN TEST VIEW (Daily Challenge UI Style)
  // -------------------------------------------------------------
  const options = questionDetails.options || [];
  const selectedOption = selectedAnswers[activeQuestionIndex];
  const isQuestionSubmitted = submittedQuestions.has(activeQuestionIndex);
  const candidateRole = assignment?.targetRole || user?.targetRole || 'Software Developer';
  const candidateCompany = assignment?.targetCompanies?.[0] || 'Tech Corp';

  return (
    <div className="flex min-h-screen lg:h-screen flex-col lg:overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] font-sans">
      {/* Top Bar Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-gray-900/60 px-4 sm:px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img
            src={theme === 'dark' ? '/logoo2-small.webp' : '/logoo-small.webp'}
            alt="TechLearn"
            className="h-9 w-auto object-contain"
          />
          <span className="hidden h-5 w-px bg-black/10 dark:bg-white/10 sm:block" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff]">
            30-Minute Interview
          </span>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/5">
            <span>{candidateRole}</span>
            <span className="text-slate-400">·</span>
            <span className="text-blue-600 dark:text-blue-400">{candidateCompany}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 30-Minute Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-colors ${
              timeLeft < 300
                ? 'border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400 animate-pulse'
                : 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300'
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${timeLeft < 300 ? 'text-red-500' : 'text-blue-500'}`} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-black/30 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-full">
            <span>Question {activeQuestionIndex + 1} of {questions.length}</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-600 dark:text-emerald-400">{submittedQuestions.size} Answered</span>
          </div>

          <button
            type="button"
            onClick={() => setShowEndModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20 transition cursor-pointer"
          >
            Finish Test
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {isMcq ? (
        <div className="flex-grow flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center">
          {/* Uniform Fixed-Size Container for all MCQ questions */}
          <div className="w-full max-w-3xl min-h-[580px] h-[580px] md:h-[600px] border border-[#2563eb]/15 dark:border-[#15366f]/45 bg-white/40 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] shadow-[0_20px_50px_rgba(12,52,171,0.06)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-5 md:p-6 rounded-2xl flex flex-col justify-between my-auto select-none">
            
            {/* Top: Palette & Tag Row */}
            <div className="w-full space-y-3 shrink-0">
              {/* Question Navigation Palette */}
              <div className="flex border-b border-black/5 dark:border-white/5 pb-2.5 w-full gap-2 overflow-x-auto select-none thin-scrollbar">
                {questions.map((q, idx) => {
                  const isActive = idx === activeQuestionIndex;
                  const isAnswered = submittedQuestions.has(idx);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`h-8 w-8 shrink-0 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                          : isAnswered
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Header row with tags */}
              <div className="flex items-center justify-between w-full pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-200">
                  {currentItem.category || 'Multiple Choice'}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Question {activeQuestionIndex + 1} of {questions.length}
                </span>
              </div>
            </div>

            {/* Middle: Question Title & Description Card (Fixed Height) */}
            <div className="relative w-full h-[140px] md:h-[155px] overflow-y-auto thin-scrollbar border border-[#2563eb]/20 dark:border-white/10 bg-[#e5f3ff]/45 dark:bg-[#091b40]/75 rounded-xl p-4 shadow-sm text-center flex flex-col justify-center shrink-0">
              <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-relaxed select-none whitespace-pre-line">
                {questionDetails.title || currentItem.title || 'Question Prompt'}
              </h2>
              {questionDetails.description && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 select-none whitespace-pre-line text-center border-t border-black/5 dark:border-white/5 pt-2 leading-relaxed font-medium">
                  {questionDetails.description}
                </p>
              )}
            </div>

            {/* MCQ Options Grid (Fixed Uniform Height) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full h-[140px] shrink-0">
              {(options.length > 0
                ? options
                : [
                    { label: 'A', text: 'Option A' },
                    { label: 'B', text: 'Option B' },
                    { label: 'C', text: 'Option C' },
                    { label: 'D', text: 'Option D' },
                  ]
              ).map((opt, idx) => {
                const optLabel = opt.label || ['A', 'B', 'C', 'D'][idx] || String(idx);
                const optText = opt.text || opt.optionText || opt;
                const isSelected = selectedOption === optLabel;

                return (
                  <button
                    key={optLabel + idx}
                    type="button"
                    onClick={() => handleSelectOption(optLabel)}
                    disabled={submitting}
                    className={`relative w-full h-[60px] rounded-xl border-2 p-3 text-center font-semibold text-xs md:text-sm transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-500/10 text-blue-700 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-200 shadow-sm'
                        : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span className="absolute left-3 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 dark:bg-white/10 text-xs font-bold">
                      {optLabel}
                    </span>
                    <span className="leading-tight px-7 truncate max-w-[90%]">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom: Navigation & Submit Row (Fixed at bottom) */}
            <div className="flex items-center justify-between w-full pt-3 border-t border-black/5 dark:border-white/5 gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
                disabled={activeQuestionIndex === 0 || submitting}
                className="inline-flex w-28 justify-center items-center rounded-xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleSubmitCurrent}
                disabled={!selectedOption || submitting}
                className="inline-flex w-44 justify-center items-center rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 px-4 py-2.5 text-xs font-bold text-white shadow-md transition cursor-pointer"
              >
                {submitting ? 'Submitting...' : isQuestionSubmitted ? 'Saved (Submit)' : 'Submit & Next'}
              </button>

              <button
                type="button"
                onClick={() => setActiveQuestionIndex(Math.min(questions.length - 1, activeQuestionIndex + 1))}
                disabled={activeQuestionIndex === questions.length - 1 || submitting}
                className="inline-flex w-28 justify-center items-center rounded-xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Coding / Code Editor View */
        <div className="flex flex-col flex-1 lg:overflow-hidden overflow-y-auto p-4 gap-3">
          {/* Coding Navigation Palette (Always accessible) */}
          <div className="flex border-b border-black/5 dark:border-white/10 pb-2 w-full gap-2 overflow-x-auto select-none shrink-0 thin-scrollbar px-1">
            {questions.map((q, idx) => {
              const isActive = idx === activeQuestionIndex;
              const isAnswered = submittedQuestions.has(idx);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`h-7 w-7 shrink-0 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                      : isAnswered
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden gap-3">
            {/* Left Problem Panel */}
            <div className="flex flex-col w-full lg:w-1/2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-[#071330] p-5 shadow-sm overflow-y-auto justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {currentItem.category || 'Coding Question'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">
                  {questionDetails.title || currentItem.title}
                </h2>

                <div className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-3">
                  <p>{questionDetails.description}</p>
                </div>

                {questionDetails.visibleTestCases?.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Sample Test Cases
                    </h4>
                    {questionDetails.visibleTestCases.map((tc, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-black/5 bg-slate-50 dark:bg-black/20 p-3 text-xs font-mono space-y-1"
                      >
                        <div><span className="text-slate-400">Input:</span> {tc.input}</div>
                        <div><span className="text-slate-400">Output:</span> {tc.output}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Problem Panel Navigation */}
              <div className="mt-6 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
                  disabled={activeQuestionIndex === 0 || submitting}
                  className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 px-3.5 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer"
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestionIndex(Math.min(questions.length - 1, activeQuestionIndex + 1))}
                  disabled={activeQuestionIndex === questions.length - 1 || submitting}
                  className="inline-flex items-center rounded-xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 px-3.5 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Right Editor & Terminal Panel */}
            <div className="flex flex-col w-full lg:w-1/2 gap-2.5 flex-1 lg:overflow-hidden">
              {/* Card 1: Code Editor Card */}
              <section className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3 shrink-0">
                {/* Editor Header Toolbar */}
                <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/5 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">
                      Code Editor
                    </span>
                    <div className="flex gap-1">
                      {['java', 'python'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleLanguageChange(lang)}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase transition cursor-pointer ${
                            selectedLanguage === lang
                              ? 'bg-[#0043A1] text-white shadow-xs'
                              : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/5 hover:border-blue-400'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunCode}
                      disabled={running || submitting || currentRunsLeft <= 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#0043A1]/20 dark:border-[#0043A1]/40 bg-[#0043A1]/5 dark:bg-[#0043A1]/15 px-2.5 py-1 text-xs font-semibold text-[#0043A1] dark:text-[#93c5fd] hover:bg-[#0043A1]/15 dark:hover:bg-[#0043A1]/35 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                    >
                      {running ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Run ({currentRunsLeft})</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmitCurrent}
                      disabled={submitting || running}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0043A1] hover:bg-[#003680] px-3 py-1 text-xs font-semibold text-white transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      <SendHorizontal className="h-3.5 w-3.5" />
                      <span>{submitting ? 'Submitting...' : 'Submit & Next'}</span>
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Container */}
                <div className="h-[240px] sm:h-[270px] overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg">
                  <Editor
                    height="100%"
                    language={LANGUAGES[selectedLanguage]?.monacoLanguage || 'java'}
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              </section>

              {/* Card 2: Terminal Output Card */}
              <section className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3 flex-1 min-h-[140px]">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="font-semibold text-sm text-[#0d2a57] dark:text-[#8fd9ff]">
                    Terminal
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Runs left: {currentRunsLeft}/{MAX_RUNS_PER_QUESTION}
                    </span>
                    {output && (
                      <button
                        type="button"
                        onClick={() => setOutput('')}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-[11px] underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <pre className="flex-grow overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed bg-white/60 dark:bg-black/35 p-2.5 rounded-none border border-black/5 dark:border-gray-700 text-gray-800 dark:text-emerald-400">
                  {output || 'Run your code to see result output here.'}
                </pre>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation End Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#071330] text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              End Assessment?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              You have submitted {submittedQuestions.size} out of {questions.length} questions.
              Are you sure you want to finish and calculate your final score?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinishAssessment}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Yes, Finish Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
