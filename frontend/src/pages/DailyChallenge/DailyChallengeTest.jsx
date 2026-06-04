import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Play, SendHorizontal } from "lucide-react";
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

  const autoSubmitTriggered = useRef(false);
  const editorCleanupRef = useRef(null);
  const problem = challenge?.problems?.[0];

  const announceClipboardBlocked = useCallback((actionLabel) => {
    setOutput(`${actionLabel} is disabled during the Daily Challenge.`);
  }, []);

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
        setChallenge(responseChallenge);
        setAttempt(attemptPayload);
        setTimeLeft(Math.max(0, Number(attemptPayload?.secondsRemaining || 0)));

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
            problemIndex: 0,
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
      setOutput("Please write code before submitting.");
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
            problemIndex: 0,
            language: selectedLanguage,
            submittedCode: code,
          },
        ],
      });

      const data = response?.data || {};
      if (data?.attempt) {
        setAttempt(data.attempt);
        setDailyChallengeSession(linkId, { attempt: data.attempt });
      }
      const summary = [
        data.evaluationStatus ? `Evaluation Status: ${data.evaluationStatus}` : "",
        data.feedback || "Submission completed.",
        typeof data.accuracy === "number" ? `Accuracy: ${data.accuracy}%` : "",
        typeof data.problemScore === "number" ? `Score: ${data.problemScore}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      setOutput(summary);
      setHasSubmitted(true);
    } catch (error) {
      setOutput(error.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndChallenge = async () => {
    if (!studentEmail) return;
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
      const response = await dailyChallengeAPI.autoSubmit(linkId, { studentEmail, attemptId: attempt?.id });
      moveToResult(response?.data || {});
    } catch (error) {
      setOutput(error.message || "Auto-submit failed.");
      navigate(`/daily-challenge/${linkId}/result`, { replace: true });
    }
  };

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] p-6">
        <div className="rounded-xl bg-white/80 px-6 py-5 text-sm text-gray-700 dark:bg-gray-900/70 dark:text-gray-200">
          Loading challenge problem...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      <header className="flex items-center justify-between border-b border-gray-300/60 bg-white/60 px-6 py-3 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/60">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Daily Challenge Test</h1>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Time Left: <span className={timerWarning ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-300/60 bg-white/75 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{problem.problemTitle}</h2>
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{problem.description}</p>

          <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold">Input format</h3>
              <p>{problem.inputDescription || "Refer to problem statement."}</p>
            </div>
            <div>
              <h3 className="font-semibold">Output format</h3>
              <p>{problem.outputDescription || "Return expected output."}</p>
            </div>
            <div>
              <h3 className="font-semibold">Limits</h3>
              <p>Runs left: {typeof runsLeft === "number" ? runsLeft : "5"} | Submission limit: 1</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-300/60 bg-white/75 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
          <div className="mb-3 flex items-center justify-between gap-3">
            <select
              value={selectedLanguage}
              onChange={(event) => {
                const nextLanguage = event.target.value;
                setSelectedLanguage(nextLanguage);
                setCode(LANGUAGES[nextLanguage].starter);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {Object.values(LANGUAGES).map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRun}
                disabled={running || submitting}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                <Play className="h-3.5 w-3.5" />
                {running ? "Running" : "Run"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={running || submitting || hasSubmitted}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                <SendHorizontal className="h-3.5 w-3.5" />
                {hasSubmitted ? "Submitted" : submitting ? "Submitting" : "Submit"}
              </button>
            </div>
          </div>

          <div className="h-[340px] overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            <Editor
              onMount={(editor) => {
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
              onChange={(value) => setCode(value || "")}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                contextmenu: false,
                minimap: { enabled: false },
                wordWrap: "on",
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="mt-4 rounded-lg border border-gray-300 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <p className="font-semibold">Output</p>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{output}</pre>
          </div>
        </section>
      </div>

      <footer className="border-t border-gray-300/60 bg-white/70 px-6 py-4 backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/70">
        <div className="mx-auto flex max-w-7xl justify-end">
          <button
            type="button"
            onClick={handleEndChallenge}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            End Challenge & View Result
          </button>
        </div>
      </footer>
    </div>
  );
}
