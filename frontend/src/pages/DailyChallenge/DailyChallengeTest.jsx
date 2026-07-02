import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Play, SendHorizontal, Clock } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { dailyChallengeAPI } from "../../services/dailyChallengeApi";
import {
  getDailyChallengeSession,
  setDailyChallengeSession,
} from "../../lib/dailyChallengeSession";

const LANGUAGES = {
  javascript: {
    id: "javascript",
    name: "JavaScript",
    monacoLanguage: "javascript",
    starter: "// Write your solution here\n",
  },
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
  const [output, setOutput] = useState("Output will appear here...");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runsLeft, setRunsLeft] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [timerWarning, setTimerWarning] = useState(false);

  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [solutions, setSolutions] = useState({});
  const [submittedProblems, setSubmittedProblems] = useState(new Set());

  const autoSubmitTriggered = useRef(false);
  const editorCleanupRef = useRef(null);

  const problem = challenge?.problems?.[activeProblemIndex];

  const announceClipboardBlocked = useCallback((actionLabel) => {
    setOutput(`${actionLabel} is disabled during the Daily Challenge.`);
  }, []);

  const isMcq = problem?.categoryType === "MCQ";
  const mcqOptions = problem?.content?.options || problem?.options || [];

  // Reset or load code for active problem
  useEffect(() => {
    if (problem) {
      const isChallengeMcq = problem.categoryType === "MCQ";
      const currentSolution = solutions[activeProblemIndex];
      if (currentSolution) {
        setCode(currentSolution.code);
        setSelectedLanguage(currentSolution.language);
      } else {
        if (isChallengeMcq) {
          setCode("");
        } else {
          setCode(LANGUAGES[selectedLanguage]?.starter || "");
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
    const starter = LANGUAGES[newLang]?.starter || "";
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

            initialSolutions[idx] = {
              code: draft?.code !== undefined ? draft.code : (savedCode !== undefined ? savedCode : (prob.categoryType === "MCQ" ? "" : LANGUAGES.python.starter)),
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
        handleAutoSubmit();
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

  useEffect(() => {
    const visibilityHandler = () => {
      if (document.hidden) {
        alert("Tab switch detected. Please stay on the Daily Challenge test page.");
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler);
    return () => document.removeEventListener("visibilitychange", visibilityHandler);
  }, []);

  useEffect(() => () => {
    if (typeof editorCleanupRef.current === "function") {
      editorCleanupRef.current();
      editorCleanupRef.current = null;
    }
  }, []);

  const moveToResult = (resultPayload) => {
    localStorage.removeItem(`daily-challenge-draft-${linkId}`);
    setDailyChallengeSession(linkId, {
      result: resultPayload,
      completedAt: new Date().toISOString(),
    });
    navigate(`/daily-challenge/${linkId}/result`, { replace: true });
  };

  const handleRun = async () => {
    if (!problem || !studentEmail) return;
    if (!code.trim()) {
      setOutput("Please write code before running.");
      return;
    }

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

      const outputLines = [
        result?.compileSuccess ? "✅ Code executed successfully." : "❌ Execution failed.",
        result?.feedback || "",
      ].filter(Boolean);

      if (typeof result?.actualOutput === "string" && result.actualOutput.length > 0) {
        outputLines.push(`Output: ${result.actualOutput}`);
      }

      if (result?.error) {
        outputLines.push(`Error: ${result.error}`);
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
      setOutput("Please write code or select an option before submitting.");
      return;
    }

    setSubmitting(true);
    setOutput("Submitting your solution...");

    try {
      const response = await dailyChallengeAPI.submit(linkId, {
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

      const data = response?.data || {};
      const finalAttempt = data.attempt || attempt;
      if (data?.attempt) {
        setAttempt(data.attempt);
        setDailyChallengeSession(linkId, { attempt: data.attempt });
      }

      const nextSubmitted = new Set(submittedProblems);
      nextSubmitted.add(activeProblemIndex);
      setSubmittedProblems(nextSubmitted);

      setOutput(`✅ Question ${activeProblemIndex + 1} Submitted Successfully!\nScore: ${data.problemScore || 0}`);

      // If all questions are submitted, end challenge and redirect
      if (challenge && nextSubmitted.size === challenge.problems.length) {
        const endResponse = await dailyChallengeAPI.end(linkId, { studentEmail, attemptId: finalAttempt?.id });
        moveToResult(endResponse?.data || {});
      } else {
        // Automatically switch to the next uncompleted problem
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
  };

  const handleEndChallenge = async () => {
    if (!studentEmail) return;

    const totalProblems = challenge?.problems?.length || 0;
    const submittedCount = submittedProblems.size;

    if (submittedCount < totalProblems) {
      const confirmEnd = window.confirm(
        `You have only submitted ${submittedCount} out of ${totalProblems} questions. Are you sure you want to end the Daily Challenge?`
      );
      if (!confirmEnd) return;
    } else {
      const confirmEnd = window.confirm("Are you sure you want to submit your Daily Challenge and end the session?");
      if (!confirmEnd) return;
    }

    setSubmitting(true);

    try {
      const response = await dailyChallengeAPI.end(linkId, { studentEmail, attemptId: attempt?.id });
      moveToResult(response?.data || {});
    } catch (error) {
      setOutput(error.message || "Unable to end challenge.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!studentEmail) return;

    try {
      // Gather all unsubmitted solutions or current state
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
      });
      moveToResult(response?.data || {});
    } catch (error) {
      setOutput(error.message || "Auto-submit failed.");
      navigate(`/daily-challenge/${linkId}/result`, { replace: true });
    }
  };

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

      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden overflow-y-auto p-4 gap-3">
        {/* Left Panel - Contains active problem description and list tabs if multiple questions exist */}
        <section className="w-full lg:w-[35%] xl:w-[40%] h-[250px] lg:h-auto flex flex-col shrink-0 overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
          <div className="p-4 border-b border-black/5 dark:border-white/5 shrink-0">
            {challenge?.problems?.length > 1 && (
              <div className="flex border-b border-black/5 dark:border-white/5 pb-2 mb-2 gap-2 overflow-x-auto select-none">
                {challenge.problems.map((p, idx) => {
                  const isActive = idx === activeProblemIndex;
                  const isSubmitted = submittedProblems.has(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveProblemIndex(idx)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md border transition-all duration-200 ${
                        isActive
                          ? "bg-[#2563eb] text-white border-[#2563eb]"
                          : "bg-white/30 text-gray-700 border-black/5 hover:bg-white/50 dark:bg-white/5 dark:text-gray-300 dark:border-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      Question {idx + 1} {isSubmitted && "✓"}
                    </button>
                  );
                })}
              </div>
            )}

            <h2 className="text-lg font-bold text-[#0d2a57] dark:text-white mb-2">{problem.problemTitle}</h2>
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                {isMcq ? "Multiple Choice" : "Coding Round"}
              </span>
              {!isMcq && (
                <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/30 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-gray-700 dark:text-gray-300">
                  Runs left: {typeof runsLeft === "number" ? runsLeft : "5"}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{problem.description}</p>

            {!isMcq && (
              <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 border-t border-gray-300/30 dark:border-gray-700/30 pt-3">
                <div>
                  <h3 className="font-semibold text-gray-950 dark:text-white">Input Format</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-0.5">{problem.inputDescription || "Refer to problem statement."}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-950 dark:text-white">Output Format</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-0.5">{problem.outputDescription || "Return expected output."}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel - MCQ Choices or Monaco Code Space */}
        {isMcq ? (
          <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-3 lg:overflow-hidden">
            <section className="flex-grow flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-5">
              <div className="mb-4 flex items-center justify-between shrink-0 border-b border-black/5 dark:border-white/5 pb-3">
                <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Select the Correct Option</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!code || submitting || isDone}
                  className="justify-center items-center inline-flex gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 transition-all duration-200 active:scale-[0.98] shadow-sm z-10"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                  {isDone ? "Submitted" : submitting ? "Submitting..." : "Submit Answer"}
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 space-y-3">
                {mcqOptions.map((opt, index) => {
                  const optLabel = opt.label || opt.optionLabel || String(index);
                  const optText = opt.text || opt.optionText || opt;
                  const isSelected = code === optLabel;
                  return (
                    <button
                      key={optLabel + index}
                      type="button"
                      onClick={() => handleCodeChange(optLabel)}
                      disabled={isDone || submitting}
                      className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-[#2563eb] bg-[#2563eb]/10 dark:border-[#8fd9ff] dark:bg-[#8fd9ff]/15"
                          : "border-black/5 bg-white/30 hover:bg-white/50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isSelected
                          ? "bg-[#2563eb] text-white dark:bg-[#8fd9ff] dark:text-[#020b23]"
                          : "bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-300"
                      }`}>
                        {optLabel}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {optText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-grow flex-1 w-full lg:w-[65%] xl:w-[60%] flex flex-col gap-3 lg:overflow-hidden">
            {/* Card 1: Coding Space */}
            <section className="h-[450px] lg:h-auto lg:flex-[2] flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3">
              <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border-b border-black/5 dark:border-white/5 pb-2">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-sm font-semibold text-[#0d2a57] dark:text-[#8fd9ff]">Code Editor</span>
                  
                  <select
                    value={selectedLanguage}
                    onChange={(event) => handleLanguageChange(event.target.value)}
                    disabled={isDone || running || submitting}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    {Object.values(LANGUAGES).map((language) => (
                      <option key={language.id} value={language.id}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Run / Submit buttons */}
                <div className="flex items-center gap-2 justify-end w-full sm:w-auto z-10">
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={isDone || running || submitting}
                    className="flex-1 sm:flex-initial sm:w-20 justify-center items-center inline-flex gap-1.5 rounded-lg border border-[#2563eb]/20 dark:border-white/10 bg-[#2563eb]/5 dark:bg-white/5 px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-[#2563eb] dark:text-gray-300 hover:bg-[#2563eb]/15 dark:hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {running ? "Run..." : "Run"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isDone || running || submitting}
                    className="flex-1 sm:flex-initial sm:w-32 justify-center items-center inline-flex gap-1.5 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-3 py-1.5 sm:py-1 text-xs font-semibold text-white disabled:opacity-60 transition-all duration-200 active:scale-[0.98] shadow-sm"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    {isDone ? "Submitted" : submitting ? "Submit" : "Submit"}
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
            <section className="flex-[1] min-h-[180px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white/40 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] p-3">
              <div className="font-semibold mb-2 shrink-0 text-sm text-[#0d2a57] dark:text-[#8fd9ff]">
                Terminal
              </div>
              <pre className="flex-grow overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed bg-white/60 dark:bg-black/35 p-2 rounded-none border border-black/5 dark:border-gray-700 text-gray-800 dark:text-emerald-400">
                {output}
              </pre>
            </section>
          </div>
        )}
      </div>

      {/* Fixed Footer Action Bar */}
      <footer className="relative h-14 sm:h-16 shrink-0 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-gray-900/70 px-4 sm:px-6 backdrop-blur-xl flex items-center justify-between gap-2 select-none">
        <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 select-none whitespace-nowrap min-w-[80px] sm:min-w-[120px]">
          {!isMcq ? `Runs left: ${typeof runsLeft === "number" ? runsLeft : "5"}` : ""}
        </div>
        
        <div className="font-press-start text-[7.5px] sm:text-[10px] md:text-xs text-[#2563eb] dark:text-[#8fd9ff] uppercase tracking-wider select-none text-center whitespace-nowrap flex-grow flex justify-center">
          DAILY CHALLENGE
        </div>

        <div className="flex items-center z-10 min-w-[80px] sm:min-w-[120px] justify-end">
          <button
            type="button"
            onClick={handleEndChallenge}
            disabled={submitting}
            className="rounded-lg sm:rounded-xl border border-red-200/50 bg-red-500 hover:bg-red-600 px-2.5 py-1 sm:px-5 sm:py-2 text-[10px] sm:text-sm font-semibold text-white disabled:opacity-60 active:scale-[0.98] transition-all duration-200 shadow-sm whitespace-nowrap"
          >
            End Challenge
          </button>
        </div>
      </footer>
    </div>
  );
}
