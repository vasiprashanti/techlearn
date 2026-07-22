import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Play, SendHorizontal, Clock, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { dailyChallengeAPI } from "../../services/dailyChallengeApi";
import {
  getDailyChallengeSession,
  setDailyChallengeSession,
} from "../../lib/dailyChallengeSession";

const LANGUAGES = {
  python: {
    id: "python",
    name: "Python",
    monacoLanguage: "python",
    starter: "# Write your solution here\n",
  },
  java: {
    id: "java",
    name: "Java",
    monacoLanguage: "java",
    starter:
      "public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}\n",
  },
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function DailyChallengeTest() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const session = useMemo(() => getDailyChallengeSession(linkId), [linkId]);
  const [challenge, setChallenge] = useState(session?.challenge || null);
  const [studentEmail, setStudentEmail] = useState(session?.studentEmail || "");
  const [attempt, setAttempt] = useState(session?.attempt || null);
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGES.python.starter);
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runsLeft, setRunsLeft] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [timerWarning, setTimerWarning] = useState(false);

  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [solutions, setSolutions] = useState({});
  const [submittedProblems, setSubmittedProblems] = useState(new Set());
  const [visitedProblems, setVisitedProblems] = useState(new Set([0]));
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endConfirmMessage, setEndConfirmMessage] = useState("");

  const autoSubmitTriggered = useRef(false);
  const editorCleanupRef = useRef(null);
  const tabSwitchCount = useRef(
    parseInt(localStorage.getItem(`daily-challenge-switches-${linkId}`) || "0")
  );

  const [modalAlert, setModalAlert] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [runProblems, setRunProblems] = useState(() => {
    const saved = localStorage.getItem(`daily-challenge-run-${linkId}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const problem = challenge?.problems?.[activeProblemIndex];

  const announceClipboardBlocked = useCallback((actionLabel) => {
    setOutput(`${actionLabel} is disabled during the Daily Challenge.`);
  }, []);

  const isMcq = String(problem?.categoryType || problem?.type || problem?.questionType || "").toLowerCase().includes("mcq");
  const mcqOptions = problem?.content?.options || problem?.options || [];

  // Reset or load code for active problem
  useEffect(() => {
    if (problem) {
      setVisitedProblems((prev) => {
        const next = new Set(prev);
        next.add(activeProblemIndex);
        return next;
      });
      setOutput(""); // Clear terminal output when question changes
      const isChallengeMcq = problem.categoryType === "MCQ";
      const currentSolution = solutions[activeProblemIndex];
      if (currentSolution) {
        setCode(currentSolution.code);
        setSelectedLanguage(currentSolution.language);
      } else {
        if (isChallengeMcq) {
          setCode("");
        } else {
          const starter = problem?.starterCode?.[selectedLanguage]?.code || problem?.content?.starterCode?.[selectedLanguage]?.code || problem?.solutionCode || LANGUAGES[selectedLanguage]?.starter || "";
          setCode(starter);
        }
      }
    }
  }, [problem, activeProblemIndex]);

  // Keep solutions map in sync with current text editor inputs
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setSolutions((prev) => ({
      ...prev,
      [activeProblemIndex]: {
        ...prev[activeProblemIndex],
        code: newCode,
        language: selectedLanguage,
      },
    }));
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    const starter = problem?.starterCode?.[newLang]?.code || problem?.content?.starterCode?.[newLang]?.code || problem?.solutionCode || LANGUAGES[newLang]?.starter || "";
    setCode(starter);
    setSolutions((prev) => ({
      ...prev,
      [activeProblemIndex]: {
        ...prev[activeProblemIndex],
        code: starter,
        language: newLang,
      },
    }));
  };

  const handlePreviousQuestion = () => {
    if (activeProblemIndex > 0) {
      setActiveProblemIndex(activeProblemIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (challenge && activeProblemIndex < challenge.problems.length - 1) {
      setActiveProblemIndex(activeProblemIndex + 1);
    }
  };

  const renderQuestionTabs = () => {
    if (!challenge || !challenge.problems || challenge.problems.length <= 1) return null;

    return challenge.problems.map((p, idx) => {
      const isActive = idx === activeProblemIndex;
      const isSubmitted = submittedProblems.has(idx);
      const isMcqQuestion = String(p.categoryType || p.type || p.questionType || "").toLowerCase().includes("mcq");
      const hasDraftSelection = !isSubmitted && (
        isMcqQuestion 
          ? (solutions[idx] && solutions[idx].code)
          : runProblems.has(idx)
      );
      const isVisited = visitedProblems.has(idx);

      let tabClass = "";
      if (isActive) {
        tabClass = "bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-blue-500/20";
      } else if (isSubmitted) {
        tabClass = "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-500/40";
      } else if (hasDraftSelection) {
        tabClass = "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-500/40";
      } else if (isVisited) {
        tabClass = "border-slate-400 bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-600";
      } else {
        tabClass = "bg-white/30 text-gray-500 border-black/5 hover:bg-white/50 dark:bg-white/5 dark:text-gray-500 dark:border-white/5 dark:hover:bg-white/10 opacity-70";
      }

      return (
        <button
          key={idx}
          onClick={() => setActiveProblemIndex(idx)}
          className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all duration-200 ${tabClass}`}
        >
          Question {idx + 1} {isSubmitted && "✓"}
        </button>
      );
    });
  };

  useEffect(() => {
    if (!session?.isVerified || !session?.studentEmail) {
      navigate(`/daily-challenge/${linkId}`, { replace: true });
      return;
    }

    setStudentEmail(session.studentEmail);

    let cancelled = false;

    const loadChallenge = async () => {
      try {
        const response = await dailyChallengeAPI.start(linkId, session.studentEmail);
        if (cancelled) return;

        const responseChallenge = response?.data?.codingRound || null;
        const attemptPayload = response?.data?.attempt || null;
        const savedAnswers = response?.data?.savedAnswers || null;

        if (responseChallenge?.linkId && responseChallenge.linkId !== linkId) {
          setDailyChallengeSession(responseChallenge.linkId, {
            ...session,
            challenge: responseChallenge,
            attempt: attemptPayload,
          });
          navigate(`/daily-challenge/${responseChallenge.linkId}/test`, { replace: true });
          return;
        }

        setChallenge(responseChallenge);
        setAttempt(attemptPayload);
        setTimeLeft(Math.max(0, Number(attemptPayload?.secondsRemaining || 0)));

        if (responseChallenge && responseChallenge.problems) {
          const initialSolutions = {};
          const initialSubmitted = new Set();
          const savedDraftStr = localStorage.getItem(`daily-challenge-draft-${linkId}`);
          const savedDraft = savedDraftStr ? JSON.parse(savedDraftStr) : null;

          responseChallenge.problems.forEach((prob, idx) => {
            const savedCode = savedAnswers?.problemCodes?.[idx.toString()];
            const savedLang = savedAnswers?.problemLanguages?.[idx.toString()];
            const isSavedSubmitted = savedAnswers?.problemSubmitted?.[idx.toString()];
            const draft = savedDraft?.[idx];

            const defaultStarter = prob.starterCode?.python?.code || prob.content?.starterCode?.python?.code || prob.solutionCode || LANGUAGES.python.starter;
            initialSolutions[idx] = {
              code: draft?.code !== undefined ? draft.code : (savedCode !== undefined ? savedCode : (prob.categoryType === "MCQ" ? "" : defaultStarter)),
              language: draft?.language || savedLang || "python"
            };

            if (isSavedSubmitted) {
              initialSubmitted.add(idx);
            }
          });

          setSolutions(initialSolutions);
          setSubmittedProblems(initialSubmitted);
        }

        setDailyChallengeSession(linkId, {
          challenge: responseChallenge,
          attempt: attemptPayload,
        });
      } catch (error) {
        if (!cancelled) {
          setOutput(error.message || "Unable to load challenge test page.");
        }
      }
    };

    loadChallenge();

    return () => {
      cancelled = true;
    };
  }, [linkId, navigate, session?.isVerified, session?.studentEmail]);

  // Save solutions to localStorage when it changes to persist drafts
  useEffect(() => {
    if (Object.keys(solutions).length > 0) {
      localStorage.setItem(`daily-challenge-draft-${linkId}`, JSON.stringify(solutions));
    }
  }, [solutions, linkId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!autoSubmitTriggered.current) {
        autoSubmitTriggered.current = true;
        if (typeof handleAutoSubmitRef.current === "function") {
          handleAutoSubmitRef.current();
        } else {
          handleAutoSubmit();
        }
      }
      return;
    }

    if (timeLeft <= 10 * 60 && !timerWarning) {
      setTimerWarning(true);
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerWarning]);

  const handleAutoSubmitRef = useRef(null);

  useEffect(() => {
    const visibilityHandler = () => {
      if (document.hidden) {
        const nextCount = tabSwitchCount.current + 1;
        tabSwitchCount.current = nextCount;
        localStorage.setItem(`daily-challenge-switches-${linkId}`, nextCount.toString());

        if (nextCount >= 3) {
          setModalAlert({
            show: true,
            title: "Test Terminated",
            message: "Tab switch limit exceeded! The test is being immediately terminated due to an anti-cheat violation.",
            onConfirm: () => {
              setModalAlert({ show: false, title: "", message: "", onConfirm: null });
              if (typeof handleAutoSubmitRef.current === "function") {
                handleAutoSubmitRef.current(true);
              }
            }
          });
        } else {
          setModalAlert({
            show: true,
            title: "Tab Switch Warning",
            message: `Warning: Tab switch detected (${nextCount}/3). Exceeding this limit will auto-submit the test.`,
            onConfirm: () => {
              setModalAlert({ show: false, title: "", message: "", onConfirm: null });
            }
          });
        }
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler);
    return () => document.removeEventListener("visibilitychange", visibilityHandler);
  }, [linkId]);

  useEffect(() => () => {
    if (typeof editorCleanupRef.current === "function") {
      editorCleanupRef.current();
      editorCleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleClipboardEvent = (e) => {
      e.preventDefault();
      announceClipboardBlocked(e.type === "paste" ? "Paste" : e.type === "copy" ? "Copy" : "Cut");
    };

    const handleKeydown = (e) => {
      const pressedKey = String(e.key || "").toLowerCase();
      const isClipboardShortcut =
        ((e.ctrlKey || e.metaKey) && ["c", "v", "x", "insert"].includes(pressedKey)) ||
        (e.shiftKey && pressedKey === "insert");

      if (isClipboardShortcut) {
        e.preventDefault();
        announceClipboardBlocked(pressedKey === "v" || (e.shiftKey && pressedKey === "insert") ? "Paste" : pressedKey === "x" ? "Cut" : "Copy");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      announceClipboardBlocked("Right-click Context Menu");
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
  }, [announceClipboardBlocked]);

  // Lock page-level scrolling for this page
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const moveToResult = (resultPayload) => {
    localStorage.removeItem(`daily-challenge-draft-${linkId}`);
    setDailyChallengeSession(linkId, {
      result: resultPayload,
      completedAt: new Date().toISOString(),
    });
    window.dispatchEvent(new CustomEvent('xpUpdated'));
    navigate(`/daily-challenge/${linkId}/result`, { replace: true });
  };

  const handleRun = async () => {
    if (!problem || !studentEmail) return;
    if (running || submitting) return;
    if (!code.trim()) {
      setOutput("Please write code before running.");
      return;
    }

    setRunProblems(prev => {
      const next = new Set(prev);
      next.add(activeProblemIndex);
      localStorage.setItem(`daily-challenge-run-${linkId}`, JSON.stringify(Array.from(next)));
      return next;
    });

    setRunning(true);
    setOutput("Running your code...");

    try {
      const response = await dailyChallengeAPI.run(linkId, {
        studentEmail,
        attemptId: attempt?.id,
        solutions: [
          {
            problemIndex: activeProblemIndex,
            language: selectedLanguage,
            submittedCode: code,
          },
        ],
      });

      const result = response?.data?.results?.[0];
      setRunsLeft(typeof result?.runsLeft === "number" ? result.runsLeft : runsLeft);
      if (response?.data?.attempt) {
        setAttempt(response.data.attempt);
        setDailyChallengeSession(linkId, { attempt: response.data.attempt });
      }

      const outputLines = [];

      if (!result?.compileSuccess) {
        // Compilation or runtime error — show full error details
        outputLines.push("❌ " + (result?.feedback || "Execution failed."));
        if (result?.error) {
          outputLines.push(result.error);
        }
      } else {
        // Successful execution
        outputLines.push("✅ " + (result?.feedback || "Code executed successfully."));

        // Console output
        if (result?.consoleOutput) {
          outputLines.push(`\nConsole Output:\n${result.consoleOutput}`);
        } else if (typeof result?.actualOutput === "string" && result.actualOutput.length > 0) {
          // Backward compatibility — actualOutput may be the pre-formatted full string
          outputLines.push(result.actualOutput);
        }

        // Execution metrics
        if (result?.executionTime != null) {
          outputLines.push(`Execution Time: ${result.executionTime}s`);
        }
        if (result?.memory != null) {
          outputLines.push(`Memory Usage: ${result.memory} KB`);
        }

        // Visible test case results
        if (Array.isArray(result?.visibleTestResults) && result.visibleTestResults.length > 0) {
          const passedCount = result.visibleTestResults.filter(t => t.passed).length;
          const totalCount = result.visibleTestResults.length;
          outputLines.push(`\nTest Cases: ${passedCount}/${totalCount} passed`);
          result.visibleTestResults.forEach((tc, idx) => {
            outputLines.push(
              `  Test ${idx + 1}: ${tc.passed ? "✅ Passed" : "❌ Failed"}\n` +
              `    Input: ${tc.input ?? "N/A"}\n` +
              `    Expected: ${tc.expectedOutput ?? "N/A"}\n` +
              `    Actual: ${tc.actualOutput ?? "(empty)"}` +
              (tc.executionTime ? `\n    Time: ${tc.executionTime}s` : "") +
              (tc.error ? `\n    Error: ${tc.error}` : "")
            );
          });
        }
      }

      setOutput(outputLines.join("\n"));
    } catch (error) {
      setOutput(error.message || "Run failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || !studentEmail) return;
    if (!code.trim()) {
      setOutput(isMcq ? "Please select an option before submitting." : "Please write code before submitting.");
      return;
    }

    if (submitting) return;

    const currentIdx = activeProblemIndex;
    const currentLang = selectedLanguage;
    const currentCode = code;

    // Immediately mark as submitted locally
    const nextSubmitted = new Set(submittedProblems);
    nextSubmitted.add(currentIdx);
    setSubmittedProblems(nextSubmitted);

    // Save to solutions map and localStorage
    const nextSolutions = {
      ...solutions,
      [currentIdx]: { code: currentCode, language: currentLang }
    };
    setSolutions(nextSolutions);
    localStorage.setItem(`daily-challenge-draft-${linkId}`, JSON.stringify(nextSolutions));

    if (isMcq) {
      // Async submit in background (instant transition for MCQ UX!)
      if (challenge) {
        let nextIdx = -1;
        for (let i = currentIdx + 1; i < challenge.problems.length; i++) {
          if (!nextSubmitted.has(i)) {
            nextIdx = i;
            break;
          }
        }
        if (nextIdx === -1) {
          for (let i = 0; i < currentIdx; i++) {
            if (!nextSubmitted.has(i)) {
              nextIdx = i;
              break;
            }
          }
        }
        if (nextIdx !== -1) {
          setActiveProblemIndex(nextIdx);
        }
      }

      dailyChallengeAPI.submit(linkId, {
        studentEmail,
        attemptId: attempt?.id,
        solutions: [
          {
            problemIndex: currentIdx,
            language: currentLang,
            submittedCode: currentCode,
          },
        ],
      }).then(response => {
        const data = response?.data || {};
        if (data?.attempt) {
          setAttempt(data.attempt);
          setDailyChallengeSession(linkId, { attempt: data.attempt });
        }
      }).catch(err => {
        console.error("Background MCQ submit failed:", err);
      });

    } else {
      // Synchronous submit for coding
      setSubmitting(true);
      setOutput("Submitting your solution...");

      try {
        const response = await dailyChallengeAPI.submit(linkId, {
          studentEmail,
          attemptId: attempt?.id,
          solutions: [
            {
              problemIndex: currentIdx,
              language: currentLang,
              submittedCode: currentCode,
            },
          ],
        });

        const data = response?.data || {};
        const finalAttempt = data.attempt || attempt;
        if (data?.attempt) {
          setAttempt(data.attempt);
          setDailyChallengeSession(linkId, { attempt: data.attempt });
        }

        if (challenge && nextSubmitted.size === challenge.problems.length) {
          const finalSolutions = Object.entries(nextSolutions).map(([idx, val]) => ({
            problemIndex: parseInt(idx),
            language: val.language,
            submittedCode: val.code
          }));
          const endResponse = await dailyChallengeAPI.end(linkId, {
            studentEmail,
            attemptId: finalAttempt?.id,
            solutions: finalSolutions
          });
          moveToResult(endResponse?.data || {});
        } else {
          const nextIdx = challenge.problems.findIndex((_, idx) => !nextSubmitted.has(idx));
          if (nextIdx !== -1) {
            setActiveProblemIndex(nextIdx);
          }
        }
      } catch (error) {
        setOutput(error.message || "Submission failed.");
      } finally {
        setSubmitting(false);
      }
    }
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
  const handleEndChallenge = () => {
    if (!studentEmail) return;

    const totalProblems = challenge?.problems?.length || 0;
    const submittedCount = submittedProblems.size;

    if (submittedCount < totalProblems) {
      setEndConfirmMessage(
        `You have only submitted ${submittedCount} out of ${totalProblems} questions. Are you sure you want to end the Daily Challenge?`
      );
    } else {
      setEndConfirmMessage("Are you sure you want to submit your Daily Challenge and end the session?");
    }
    setShowEndConfirm(true);
  };

  const executeEndChallenge = async () => {
    setShowEndConfirm(false);
    if (!challenge) return; // Guard: challenge not loaded yet
    setSubmitting(true);

    try {
      const finalSolutions = [];
      challenge.problems.forEach((prob, idx) => {
        const sol = solutions[idx] || {};
        finalSolutions.push({
          problemIndex: idx,
          language: sol.language || "python",
          submittedCode: idx === activeProblemIndex ? code : (sol.code || ""),
        });
      });

      const response = await dailyChallengeAPI.end(linkId, {
        studentEmail,
        attemptId: attempt?.id,
        solutions: finalSolutions,
      });
      moveToResult(response?.data || {});
    } catch (error) {
      setOutput(error.message || "Unable to end challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async (isTerminated = false) => {
    if (!studentEmail || !challenge) return; // Guard: challenge not loaded yet

    try {
      const finalSolutions = [];
      challenge.problems.forEach((prob, idx) => {
        const sol = solutions[idx] || {};
        finalSolutions.push({
          problemIndex: idx,
          language: sol.language || "python",
          submittedCode: idx === activeProblemIndex ? code : (sol.code || ""),
        });
      });

      const response = await dailyChallengeAPI.autoSubmit(linkId, {
        studentEmail,
        attemptId: attempt?.id,
        solutions: finalSolutions,
        terminationReason: isTerminated ? "Tab-switch limit exceeded" : undefined,
      });

      if (isTerminated) {
        localStorage.removeItem(`daily-challenge-draft-${linkId}`);
        setDailyChallengeSession(linkId, {
          result: response?.data || {},
          completedAt: new Date().toISOString(),
          terminated: true,
          terminationReason: "Tab-switch limit exceeded"
        });
        window.dispatchEvent(new CustomEvent('xpUpdated'));
        navigate(`/daily-challenge/${linkId}/result`, { replace: true });
      } else {
        moveToResult(response?.data || {});
      }
    } catch (error) {
      console.error("Auto-submit failed:", error);
      navigate(`/daily-challenge/${linkId}/result`, { replace: true });
    }
  };
  handleAutoSubmitRef.current = handleAutoSubmit;

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f8ff] via-[#e6efff] to-[#dbebff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <div className="rounded-xl border border-[#2563eb]/15 bg-white/20 shadow-[0_20px_50px_rgba(12,52,171,0.06)] px-6 py-5 text-sm text-gray-700 dark:bg-gray-900/70 dark:text-gray-200">
          Loading challenge problem...
        </div>
      </div>
    );
  }

  const isDone = submittedProblems.has(activeProblemIndex);

  return (
    <div className="flex min-h-screen lg:h-screen flex-col lg:overflow-hidden bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/5 dark:border-white/10 bg-white/40 dark:bg-gray-900/60 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {theme === "dark" ? (
            <img
              src="/logoo2-small.webp"
              alt="TLS"
              className="h-10 w-auto object-contain shrink-0"
            />
          ) : (
            <img
              src="/logoo-small.webp"
              alt="TLS"
              className="h-10 w-auto object-contain shrink-0"
            />
          )}
        </div>
        <div className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2563eb] dark:text-[#8fd9ff]" />
          Time Left: <span className={timerWarning ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
        </div>
      </header>

      {isMcq ? (
        <div className="flex-grow flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl border border-[#2563eb]/15 dark:border-[#15366f]/45 bg-white/20 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] shadow-[0_20px_50px_rgba(12,52,171,0.06)] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] backdrop-blur-xl p-5 md:p-6 rounded-xl flex flex-col items-center space-y-4 my-auto">
            {/* Question tabs if multiple questions */}
            {challenge?.problems?.length > 1 && (
              <div className="flex border-b border-black/5 dark:border-white/5 pb-2 w-full gap-2 overflow-x-auto select-none">
                {renderQuestionTabs()}
              </div>
            )}

            {/* Header row with type and difficulty tags in opposite corners */}
            <div className="relative flex items-center justify-between w-full pb-3 border-b border-slate-100 dark:border-slate-800 select-none">
              <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-200">
                Multiple Choice
              </span>
              {problem.difficulty && (
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  problem.difficulty === 'Easy'
                    ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : problem.difficulty === 'Medium'
                    ? 'border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-rose-500/15 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}>
                  {problem.difficulty}
                </span>
              )}
            </div>

            {/* Question prompt / description card styled like the practice details question view */}
            <div className="relative w-full border border-[#2563eb]/20 dark:border-white/10 bg-[#e5f3ff]/45 dark:bg-[#091b40]/75 rounded-xl p-4 md:p-5 shadow-md shadow-[#2563eb]/5 text-center">
              <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-relaxed select-none">
                {problem.problemTitle}
              </h2>
              {problem.description && (
                <p className="mt-3 text-xs md:text-sm text-gray-600 dark:text-gray-300 select-none whitespace-pre-line text-center border-t border-black/5 dark:border-white/5 pt-3 leading-relaxed font-medium">
                  {problem.description}
                </p>
              )}
            </div>

            {/* MCQ Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
              {mcqOptions.map((opt, index) => {
                const optLabel = opt.label || opt.optionLabel || String(index);
                const optText = opt.text || opt.optionText || opt;
                const isSelected = code === optLabel;
                const optionClass = isSelected
                  ? 'border-[#2563eb] bg-[#2563eb]/10 dark:border-[#8fd9ff] dark:bg-[#8fd9ff]/15 text-[#2563eb] dark:text-[#a0baff]'
                  : 'border-[#2563eb]/20 dark:border-gray-600/70 bg-[#e5f3ff]/35 dark:bg-[#091b40]/50 text-gray-800 dark:text-gray-200 hover:border-[#2563eb] dark:hover:border-blue-400 hover:bg-[#e5f3ff]/60 dark:hover:bg-[#091b40]/75';

                return (
                  <button
                    key={optLabel + index}
                    type="button"
                    onClick={() => handleCodeChange(optLabel)}
                    disabled={submitting}
                    className={`relative w-full rounded-xl border-2 p-3.5 text-center font-semibold text-sm transition min-h-[50px] flex items-center justify-center ${optionClass} ${
                      submitting ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                    }`}
                  >
                    <span className="leading-tight px-6">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Actions: Previous, Submit & Next, Next Buttons */}
            <div className="flex items-center justify-between w-full pt-4 border-t border-black/5 dark:border-white/5 gap-3">
              <button
                type="button"
                onClick={handlePreviousQuestion}
                disabled={activeProblemIndex === 0 || submitting}
                className="inline-flex w-28 justify-center items-center rounded-xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none px-3 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 transition"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDone || !code || submitting}
                className="inline-flex w-44 justify-center items-center rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isDone ? "Submitted" : submitting ? "Submitting..." : "Submit & Next"}
              </button>

              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={activeProblemIndex === (challenge?.problems?.length - 1) || submitting}
                className="inline-flex w-28 justify-center items-center rounded-xl border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none px-3 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden overflow-y-auto p-4 gap-3">
          {/* Left Panel - Contains active problem description and list tabs if multiple questions exist */}
          <aside 
            className="w-full lg:w-[35%] xl:w-[40%] h-[420px] lg:h-full flex flex-col shrink-0 overflow-y-auto minimal-scrollbar scroll-pb-10 rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3 pb-10 gap-3"
          >
            {challenge?.problems?.length > 1 && (
              <div className="flex border-b border-white/5 pb-2 mb-1 gap-2 overflow-x-auto select-none shrink-0 no-scrollbar">
                {renderQuestionTabs()}
              </div>
            )}

            {/* Header Card (Top 15%) */}
            <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/45 dark:bg-[#001233]/60 p-3 rounded-xl shrink-0 lg:h-[15%] lg:min-h-0 flex flex-col justify-center items-start text-left gap-1.5">
              <h1 className="text-sm font-extrabold mb-1.5 text-[#0d2a57] dark:text-white tracking-tight leading-tight pl-2">
                {problem.problemTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] pl-2 font-semibold">
                {(() => {
                  const tags = (problem.tags || problem.content?.tags || []).filter(t => t && String(t).trim());
                  return tags.length > 0 ? (
                    tags.map((tag, idx) => (
                      <span key={idx} className="rounded-full border border-white/5 bg-[#0043A1]/20 text-[#93c5fd] border-[#0043A1]/40 px-2 py-0.5 font-semibold">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-white/5 bg-[#0043A1]/20 text-[#93c5fd] border-[#0043A1]/40 px-2 py-0.5 font-semibold">
                      {problem.categoryTitle || problem.content?.categoryTitle || problem.trackType || 'Coding'}
                    </span>
                  );
                })()}
                <span className="rounded-full border border-black/5 dark:border-white/10 bg-[#14532d] text-[#86efac] border-[#166534] px-2 py-0.5 font-semibold">
                  {problem.difficulty || 'Easy'}
                </span>
              </div>
            </div>

            {/* Problem Statement Card (Middle 30%) */}
            <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors h-[150px] lg:h-[30%] lg:min-h-[130px] overflow-hidden shrink-0 text-left flex flex-col">
              <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2 shrink-0">
                Problem Statement
              </h2>
              <div className="prose prose-slate max-w-none dark:prose-invert text-xs leading-normal flex-1 overflow-y-auto minimal-scrollbar pr-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                  {problem.description || `**${problem.problemTitle || "Problem"}**\n\nProblem statement will be added here.`}
                </ReactMarkdown>
              </div>
            </div>

            {/* Input & Output Format (Bottom 55% split) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full shrink-0 h-[180px] lg:h-[30%] lg:min-h-[140px] overflow-hidden">
              <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-left flex flex-col min-h-0 h-full overflow-hidden">
                <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2 shrink-0">
                  Input Format
                </h2>
                <div className="prose prose-slate max-w-none dark:prose-invert text-xs leading-normal flex-1 overflow-y-auto minimal-scrollbar pr-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {problem.inputDescription || "Refer to problem statement."}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors text-left flex flex-col min-h-0 h-full overflow-hidden">
                <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2 shrink-0">
                  Output Format
                </h2>
                <div className="prose prose-slate max-w-none dark:prose-invert text-xs leading-normal flex-1 overflow-y-auto minimal-scrollbar pr-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                    {problem.outputDescription || "Return expected output."}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Visible Test Cases Card */}
            <div className="bg-white/50 border border-black/5 dark:border-[#15366f]/35 dark:bg-[#001233]/45 rounded-xl p-3 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors shrink-0 text-left">
              <h2 className="text-[10px] font-bold text-[#0d2a57] dark:text-white uppercase tracking-wider pl-1 mb-2">
                Visible Test Cases
              </h2>
              {problem.visibleTestCases?.length ? (
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1 minimal-scrollbar">
                  {problem.visibleTestCases.map((tc, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 mb-1">Test Case #{index + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/60 dark:bg-[#111827] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                          <div className="px-3 py-1.5 bg-gray-100 dark:bg-[#1f2937] border-b border-gray-300 dark:border-gray-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            <span>Input</span>
                          </div>
                          <pre className="p-2.5 text-[11px] font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#0b0f19] overflow-x-auto whitespace-pre-wrap no-scrollbar">
                            {tc.input || ""}
                          </pre>
                        </div>

                        <div className="bg-white/60 dark:bg-[#111827] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
                          <div className="px-3 py-1.5 bg-gray-100 dark:bg-[#1f2937] border-b border-gray-300 dark:border-gray-700 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            <span>Output</span>
                          </div>
                          <pre className="p-2.5 text-[11px] font-mono text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#0b0f19] overflow-x-auto whitespace-pre-wrap no-scrollbar">
                            {tc.expectedOutput || tc.output || "Not provided"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">No visible test cases were provided for this question.</p>
              )}
            </div>

          </aside>

          <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-3 lg:overflow-hidden">
            {/* Card 1: Coding Space */}
            <section className="h-[450px] lg:h-auto lg:flex-[2] flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3">
              <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Code Editor</span>
                  
                  <div className="relative inline-block">
                    <select
                      value={selectedLanguage}
                      onChange={(event) => handleLanguageChange(event.target.value)}
                      disabled={isDone || running || submitting}
                      className="appearance-none rounded-lg border border-gray-300 pl-2.5 pr-8 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white min-w-[100px] outline-none cursor-pointer"
                    >
                      {Object.values(LANGUAGES).map((language) => (
                        <option key={language.id} value={language.id}>
                          {language.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>

                {/* Run / Submit buttons */}
                <div className="flex items-center gap-2 justify-end w-full sm:w-auto z-10">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isDone || running || submitting}
                    className="flex-1 sm:flex-initial sm:w-20 justify-center items-center inline-flex gap-1.5 rounded-lg border border-[#0043A1]/20 dark:border-[#0043A1]/40 bg-[#0043A1]/5 dark:bg-[#0043A1]/15 px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#3b82f6] dark:text-[#93c5fd] hover:bg-[#0043A1]/15 dark:hover:bg-[#0043A1]/35 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {running ? "Run..." : "Run"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isDone || running || submitting}
                    className="flex-1 sm:flex-initial sm:w-32 justify-center items-center inline-flex rounded-lg bg-[#0043A1] hover:bg-[#003680] px-3 py-1.5 sm:py-1 text-xs font-semibold text-white disabled:opacity-60 transition-all duration-200 active:scale-[0.98] shadow-sm"
                  >
                    {isDone ? "Submitted" : submitting ? "Submitting..." : "Submit & Next"}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden rounded-none border border-gray-300 dark:border-gray-700">
                <Editor
                  onMount={(editor, monaco) => {
                    monaco.editor.defineTheme('custom-light', {
                      base: 'vs',
                      inherit: true,
                      rules: [
                        { token: '', foreground: '1e293b', background: 'ffffff' },
                      ],
                      colors: {
                        'editor.background': '#ffffff',
                        'editor.foreground': '#1e293b',
                        'editorLineNumber.foreground': '#94a3b8',
                        'editorLineNumber.activeForeground': '#475569',
                      }
                    });

                    if (typeof editorCleanupRef.current === "function") {
                      editorCleanupRef.current();
                    }

                    const editorNode = editor.getDomNode();
                    if (!editorNode) return;

                    const blockClipboardEvent = (event) => {
                      event.preventDefault();

                      if (event.type === "paste") {
                        announceClipboardBlocked("Paste");
                      } else if (event.type === "copy") {
                        announceClipboardBlocked("Copy");
                      } else if (event.type === "cut") {
                        announceClipboardBlocked("Cut");
                      }
                    };

                    const blockShortcut = (event) => {
                      const pressedKey = String(event.key || "").toLowerCase();
                      const isClipboardShortcut =
                        ((event.ctrlKey || event.metaKey) &&
                          ["c", "v", "x", "insert"].includes(pressedKey)) ||
                        (event.shiftKey && pressedKey === "insert");

                      if (!isClipboardShortcut) return;

                      event.preventDefault();

                      if (pressedKey === "v" || (event.shiftKey && pressedKey === "insert")) {
                        announceClipboardBlocked("Paste");
                      } else if (pressedKey === "x") {
                        announceClipboardBlocked("Cut");
                      } else {
                        announceClipboardBlocked("Copy");
                      }
                    };

                    editorNode.addEventListener("copy", blockClipboardEvent, true);
                    editorNode.addEventListener("cut", blockClipboardEvent, true);
                    editorNode.addEventListener("paste", blockClipboardEvent, true);
                    editorNode.addEventListener("keydown", blockShortcut, true);

                    editorCleanupRef.current = () => {
                      editorNode.removeEventListener("copy", blockClipboardEvent, true);
                      editorNode.removeEventListener("cut", blockClipboardEvent, true);
                      editorNode.removeEventListener("paste", blockClipboardEvent, true);
                      editorNode.removeEventListener("keydown", blockShortcut, true);
                    };
                  }}
                  language={LANGUAGES[selectedLanguage].monacoLanguage}
                  value={code}
                  onChange={handleCodeChange}
                  theme={theme === "dark" ? "vs-dark" : "custom-light"}
                  options={{
                    readOnly: isDone,
                    contextmenu: false,
                    minimap: { enabled: false },
                    wordWrap: "on",
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                  }}
                />
              </div>
            </section>

            {/* Card 2: Terminal Output */}
            <section className="flex-[1] min-h-[90px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3">
              <div className="font-semibold mb-2 shrink-0 text-sm text-[#0d2a57] dark:text-[#8fd9ff]">
                Terminal
              </div>
              <pre className="flex-grow overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed bg-white/60 dark:bg-black/35 p-2 rounded-none border border-black/5 dark:border-gray-700 text-gray-800 dark:text-emerald-400">
                {output || 'Run your code to see result output here.'}
              </pre>
            </section>
          </div>
        </div>
      )}

      {/* Fixed Footer Action Bar */}
      <footer className="relative h-9 sm:h-10 shrink-0 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-gray-900/70 px-4 sm:px-6 backdrop-blur-xl flex items-center justify-between gap-2 select-none">
        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 select-none whitespace-nowrap min-w-[80px] sm:min-w-[120px]">
          {!isMcq ? "Runs: Unlimited" : ""}
        </div>
        
        <div className="font-press-start text-[7.5px] sm:text-[10px] md:text-xs text-[#0043A1] dark:text-[#8fd9ff] uppercase tracking-wider select-none text-center whitespace-nowrap flex-grow flex justify-center">
          DAILY CHALLENGE
        </div>

        <div className="flex items-center z-10 min-w-[80px] sm:min-w-[120px] justify-end">
          <button
            type="button"
            onClick={handleEndChallenge}
            disabled={submitting}
            className="rounded-lg sm:rounded-xl border border-red-200/50 bg-red-500 hover:bg-red-600 px-2.5 py-0.5 sm:px-4 sm:py-1 text-[10px] sm:text-xs font-semibold text-white disabled:opacity-60 active:scale-[0.98] transition-all duration-200 shadow-sm whitespace-nowrap"
          >
            End Challenge
          </button>
        </div>
      </footer>

      {showEndConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-[#edf3f9] dark:bg-[#0f274f] p-6 shadow-2xl backdrop-blur-xl text-center z-[210]">
            <h3 className="text-sm font-bold text-[#0d2a57] dark:text-[#8fd9ff] uppercase tracking-wider font-press-start text-[10px]">
              End Challenge
            </h3>
            <p className="mt-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-semibold">
              {endConfirmMessage}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-[#edf1f6] dark:bg-[#18365f] text-[#1a2335] dark:text-white text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeEndChallenge}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
              >
                Yes, End Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAlert.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-[#edf3f9] dark:bg-[#0f274f] p-6 shadow-2xl backdrop-blur-xl text-center z-[210]">
            <h3 className="text-sm font-bold text-[#0d2a57] dark:text-[#8fd9ff] uppercase tracking-wider font-press-start text-[10px]">
              {modalAlert.title}
            </h3>
            <p className="mt-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-semibold">
              {modalAlert.message}
            </p>
            <div className="mt-6 flex items-center justify-center">
              <button
                type="button"
                onClick={modalAlert.onConfirm || (() => setModalAlert({ show: false, title: "", message: "", onConfirm: null }))}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0d2a57] border border-black/10 dark:border-white/10 font-press-start text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer font-bold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
