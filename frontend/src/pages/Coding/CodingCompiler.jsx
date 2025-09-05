import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Sun, Moon, ChevronDown } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext";
import ScrollProgress from "../../components/ScrollProgress";
import { compilerAPI } from "../../services/api";
import axios from "axios";
import { useParams } from "react-router-dom";

// --- FIXED LANGUAGES CONFIG ---
const LANGUAGES = {
  javascript: {
    id: "javascript",
    name: "JavaScript",
    icon: "/javascript.png",
    extension: ".js",
    defaultCode: `// Write your code here\n`,
    monacoLanguage: "javascript",
  },
  python: {
    id: "python",
    name: "Python",
    icon: "/python.png",
    extension: ".py",
    defaultCode: `# Write your code here\n`,
    monacoLanguage: "python",
  },
  java: {
    id: "java",
    name: "Java",
    icon: "/java.png",
    extension: ".java",
    defaultCode: `// Write your code here\npublic class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}\n`,
    monacoLanguage: "java",
  },
};

const CodingCompiler = ({ user, contestData }) => {
  const { theme, toggleTheme } = useTheme();
  const { linkId } = useParams();
  const [selectedLang, setSelectedLang] = useState("python");
  const [code, setCode] = useState(LANGUAGES.python.defaultCode);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [editorTheme, setEditorTheme] = useState(
    theme === "dark" ? "vs-dark" : "light"
  );
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [submittedProblems, setSubmittedProblems] = useState(new Set());

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Fallback URL

  // problems state - now using passed data instead of fetching
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const PROBLEM = problems[currentProblemIndex];

  

  // Timer - using duration from contestData
  const [timeLeft, setTimeLeft] = useState((contestData?.duration || 120) * 60);
  const [timerWarning, setTimerWarning] = useState(false);

  useEffect(() => {
    setEditorTheme(theme === "dark" ? "vs-dark" : "light");
  }, [theme]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    if (timeLeft <= 10 * 60 && !timerWarning) setTimerWarning(true);
    const t = setInterval(() => setTimeLeft((sec) => sec - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, timerWarning]);

  // Set problems from contestData on component mount
  useEffect(() => {
    if (contestData?.problems && Array.isArray(contestData.problems)) {

      setProblems(contestData.problems);
    } else {
   
      console.log(
        "Available keys in contestData:",
        contestData ? Object.keys(contestData) : "contestData is null/undefined"
      );
    }
  }, [contestData]);

  //Auto Fullscreen
  useEffect(() => {
    if (contestData?.problems?.length > 0) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request failed:", err);
      });
    }
  }, [contestData]);


  const handleAutoSubmit = async () => {
  if (!linkId) {
    console.error("Link ID not available");
    setIsRoundComplete(true);
    return;
  }

  if (!user?.email) {
    console.error("User email not available");
    setIsRoundComplete(true);
    return;
  }

  try {
    console.log("Auto-submitting round with link ID:", linkId);

    const response = await fetch(`${BASE_URL}/college-coding/${linkId}/auto-submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentEmail: user.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Auto-submit failed:", data);
    } else {
      console.log("Auto-submitted successfully:", data);

      if (data?.data) {
        const summaryResults = [
          {
            label: "Final Score",
            value: `${data.data.totalScore || 0}`,
          },
          {
            label: "Correct Solutions",
            value: `${data.data.correctSolutions || 0} / ${data.data.totalProblems || 0}`,
          },
          {
            label: "Round Ended At",
            value: new Date(data.data.endedAt).toLocaleString(),
          },
        ];

        setResults(summaryResults);
      }
    }
  } catch (err) {
    console.error("Error auto-submitting contest round:", err);
  }

  setIsRoundComplete(true);
};


  //Auto Submit
  useEffect(() => {
  if (timeLeft <= 0) {
    handleAutoSubmit();
  }
}, [timeLeft]);


  // Detect tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert("⚠️ Tab switching detected! Please return to the test window.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleReset = () => {
    setCode(LANGUAGES[selectedLang].defaultCode);
    setOutput("");
  };

  const handleNextQuestion = () => {
    setCurrentProblemIndex((prev) => (prev + 1) % problems.length);
    setOutput("");
    setCode(LANGUAGES[selectedLang].defaultCode);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      setOutput("⚠️ Please write some code before running.");
      return;
    }

    if (!linkId) {
      setOutput("⚠️ Error: Missing contest link ID.");
      return;
    }

    if (!BASE_URL) {
      setOutput("⚠️ Error: API URL not configured.");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running test cases...");

    try {
      const payload = {
        studentEmail: user.email,
        solutions: [
          {
            problemIndex: currentProblemIndex,
            submittedCode: code,
            language: selectedLang,
          },
        ],
      };

      console.log("Run payload:", payload);
      console.log("API URL:", `${BASE_URL}/college-coding/${linkId}/run`);

      const response = await axios.post(
        `${BASE_URL}/college-coding/${linkId}/run`,
        payload,
        {
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;
      console.log("Full API response:", data);

      const resultsArray = data?.data?.results || [];

      if (Array.isArray(resultsArray) && resultsArray.length > 0) {
        let allFormatted = "";

        resultsArray.forEach((result, problemIdx) => {
          const testResults = result?.visibleTestResults || [];
          const feedback = result?.feedback || "";

          if (testResults.length > 0) {
            const passedCount = testResults.filter((t) => t.passed).length;
            const totalCount = testResults.length;

            const formatted = testResults
              .map((t, idx) => {
                const passed = t.passed === true;
                const input = t.input || "N/A";
                const expected = t.expectedOutput || "N/A";

                let actual;
                if (t.actualOutput === null) actual = "null";
                else if (t.actualOutput === undefined) actual = "undefined";
                else if (t.actualOutput === "") actual = "(empty output)";
                else actual = String(t.actualOutput);

                return (
                  `   Test ${idx + 1}: ${
                    passed ? "✅ Passed" : "❌ Failed"
                  }\n` +
                  `   Input: ${input}\n` +
                  `   Expected: ${expected}\n` +
                  `   Actual: ${actual}\n` +
                  (t.executionTime
                    ? `   Execution Time: ${t.executionTime}\n`
                    : "") +
                  (t.error ? `   Error: ${t.error}\n` : "")
                );
              })
              .join("\n");

            allFormatted +=
              `\n=== Problem ${problemIdx} (Language: ${result.language}) ===\n` +
              formatted +
              `\nSummary: ${passedCount} / ${totalCount} test cases passed.\n` +
              (feedback ? `${feedback}\n` : "");
          } else {
            allFormatted += `\n=== Problem ${problemIdx} ===\n⚠️ No test results available\n`;
          }
        });

        setOutput(allFormatted.trim());
      } else if (data?.success === false) {
        setOutput("⚠️ " + (data.message || "Test execution failed"));
      } else {
        setOutput(
          "⚠️ Unexpected response format.\n\n" + JSON.stringify(data, null, 2)
        );
      }
    } catch (err) {
      console.error("Run error:", err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || err.response.statusText;

        if (status === 404) {
          setOutput(
            `⚠️ Error 404: Contest not found. Invalid contest link '${linkId}'.`
          );
        } else if (status === 400) {
          setOutput(`⚠️ Error 400: Bad request. ${message}`);
        } else if (status === 500) {
          setOutput("⚠️ Error 500: Server error. Please try again later.");
        } else {
          setOutput(`⚠️ Server error ${status}: ${message}`);
        }
      } else if (err.code === "ECONNABORTED") {
        setOutput(
          "⚠️ Request timeout. The server is taking too long to respond."
        );
      } else if (err.request) {
        setOutput("⚠️ Network error: Unable to connect to server.");
      } else {
        setOutput("⚠️ Error running test cases: " + err.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // --- Submit (Hidden Test Cases) ---
  const handleSubmit = async () => {
    setIsRunning(true);
    setOutput("");

    try {
      const payload = {
        studentEmail: user.email,
        solutions: [
          {
            problemIndex: currentProblemIndex,
            language: selectedLang,
            submittedCode: code,
          },
        ],
      };

      const response = await axios.post(
        `${BASE_URL}/college-coding/${linkId}/submit`,
        payload,
        {
          timeout: 30000, // Same as handleRun
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data; // No need for .json()

      if (data.success) {
        let feedback = data.data?.feedback || "Submission successful.";

        if (
          typeof data.data?.failedTestCases === "number" &&
          typeof data.data?.totalTestCases === "number"
        ) {
          feedback += ` Number of hidden test cases failed is (${data.data.failedTestCases} out of ${data.data.totalTestCases}) `;
        }

        setOutput(feedback);

        setSubmittedProblems((prev) =>
          new Set(prev).add(PROBLEM.problemTitle || PROBLEM.title)
        );
      } else {
        setOutput(
          "⚠️ Submission failed: " + (data.message || JSON.stringify(data))
        );
      }
    } catch (err) {
      console.error("Submit error:", err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || err.response.statusText;
        setOutput(`⚠️ Server error ${status}: ${message}`);
      } else if (err.request) {
        setOutput("⚠️ Network error: Unable to connect to server.");
      } else {
        setOutput("⚠️ Error submitting code: " + err.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    setCode(LANGUAGES[lang].defaultCode);
    setShowDropdown(false);
  };

  const handleEndRound = async () => {
  if (!linkId) {
    console.error("Link ID not available");
    setIsRoundComplete(true);
    return;
  }

  if (!user?.email) {
    console.error("User email not available");
    setIsRoundComplete(true);
    return;
  }

  try {
    console.log("Ending round manually with link ID:", linkId);

    const response = await fetch(`${BASE_URL}/college-coding/${linkId}/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentEmail: user.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("End round failed:", data);
    } else {
      console.log("Round ended successfully:", data);

      if (data?.data) {
        const summaryResults = [
          {
            label: "Final Score",
            value: `${data.data.totalScore || 0} / ${data.data.maxPossibleScore || 0}`,
          },
          {
            label: "Problems Attempted",
            value: `${data.data.attempted || 0} / ${data.data.totalProblems || 0}`,
          },
          {
            label: "Correct Solutions",
            value: `${data.data.correctSolutions || 0}`,
          },
          {
            label: "Round Ended At",
            value: new Date(data.data.roundEndedAt).toLocaleString(),
          },
        ];

        setResults(summaryResults);
      }
    }
  } catch (err) {
    console.error("Error ending contest round:", err);
  }

  setIsRoundComplete(true);
};
  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(".relative")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // ✅ If round is complete → show results page
  if (isRoundComplete) {
    return (
      <div
        className="flex items-center justify-center h-screen 
      bg-gradient-to-br from-sky-200 via-sky-100 to-blue-200"
      >
        <div
          className="max-w-lg w-full bg-white/30 backdrop-blur-md 
        p-8 rounded-2xl shadow-2xl border border-white/40"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
            🎉 Round Completed!
          </h2>

          {results.length === 0 ? (
            <p className="text-center text-slate-600">No results available.</p>
          ) : (
            <ul className="space-y-4">
              {results.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center border-b 
                  border-slate-300/50 pb-2 last:border-b-0"
                >
                  <span className="font-medium text-slate-700">
                    {item.label}
                  </span>
                  <span className="text-slate-600">{item.value}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl 
              shadow-lg hover:bg-blue-600 transition-all duration-200 
              hover:shadow-xl font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!PROBLEM) {
    return (
      <div className="flex items-center justify-center h-screen bg-white/20 dark:bg-gray-900/40">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            {problems.length === 0
              ? "Loading problems..."
              : "No problems available"}
          </p>
          {contestData && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Debug Info:</p>
              <p>Contest Data Keys: {Object.keys(contestData).join(", ")}</p>
              <p>Problems Array Length: {problems.length}</p>
              <p>Link ID: {linkId || "Not available"}</p>
              <p>Base URL: {BASE_URL}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-h-screen overflow-hidden">
      <ScrollProgress />
      {/* Navbar */}
      <nav
        className="w-full flex items-center justify-between px-6 py-3 
      bg-white/20 dark:bg-gray-900/40 
      border-b border-gray-300 dark:border-gray-700"
      >
        {/* Logo */}
        <div className="flex items-center">
          <img
            src={theme === "light" ? "/logoo.png" : "/logoo2.png"}
            alt="Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              console.warn("Logo failed to load:", e.target.src);
              e.target.style.display = "none";
            }}
          />
        </div>

        {/* Right Side: Help + Dark Mode Toggle */}
        <div className="flex items-center gap-8 text-[15px] font-light">
          {/* Help (styled as link) */}
          <span
            className={`cursor-pointer relative transition-all duration-300 ease-in-out 
          hover:after:w-full after:content-[''] after:absolute after:left-0 
          after:bottom-[-2px] after:h-px after:bg-current 
          after:transition-all after:duration-300 after:ease-in-out
          ${
            theme === "dark"
              ? "text-[#e0e6f5] hover:text-white"
              : "text-[#00184f]"
          }`}
          >
            Help
          </span>

          {/* Dark mode toggle (icon only, like a nav item) */}
          <button
            onClick={toggleTheme}
            className={`transition-colors relative ${
              theme === "dark"
                ? "text-[#e0e6f5] hover:text-white"
                : "text-[#00184f]"
            }`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 pt-5 overflow-auto">
        {/* LEFT PANEL */}
        <div className="w-1/2 bg-white/20 dark:bg-gray-900/40 p-6 overflow-y-auto border-r border-gray-300 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">
            {PROBLEM.problemTitle || PROBLEM.title || "Problem"}
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {PROBLEM.description || "No description available"}
          </p>

          <h2 className="font-semibold mt-3 dark:text-white">Input Format:</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
            {(Array.isArray(PROBLEM.inputFormat)
              ? PROBLEM.inputFormat
              : PROBLEM.inputDescription
              ? PROBLEM.inputDescription.split("\n")
              : ["No input format specified"]
            ).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <h2 className="font-semibold mt-3 dark:text-white">Output Format:</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
            {(Array.isArray(PROBLEM.outputFormat)
              ? PROBLEM.outputFormat
              : PROBLEM.outputDescription
              ? PROBLEM.outputDescription.split("\n")
              : ["No output format specified"]
            ).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          {/* Example Section */}
          <h2 className="font-semibold mt-3 dark:text-white">Example:</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Input:</strong>
              <pre className="mt-1 text-xs">
                {PROBLEM.example?.input?.replace(/\\n/g, "\n") ||
                  PROBLEM.visibleTestCases?.[0]?.input ||
                  "No example input provided"}
              </pre>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              <strong>Output:</strong>
              <pre className="mt-1 text-xs">
                {PROBLEM.example?.output?.replace(/\\n/g, "\n") ||
                  PROBLEM.visibleTestCases?.[0]?.expectedOutput ||
                  "No example output provided"}
              </pre>
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-1/2 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-700">
            {/* Language Dropdown + Reset */}
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/20 h-10"
                >
                  <img
                    src={LANGUAGES[selectedLang].icon}
                    alt={LANGUAGES[selectedLang].name}
                    className="w-5 h-5"
                    onError={(e) => {
                      console.warn(
                        "Language icon failed to load:",
                        e.target.src
                      );
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="text-sm dark:text-white">
                    {LANGUAGES[selectedLang].name}
                  </span>
                  <ChevronDown className="w-4 h-4 dark:text-white" />
                </button>
                {showDropdown && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 shadow rounded-lg p-2 flex flex-col gap-2 z-50 min-w-[150px]">
                    {Object.values(LANGUAGES).map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                          selectedLang === lang.id
                            ? "bg-gray-200 dark:bg-gray-700"
                            : ""
                        }`}
                      >
                        <img
                          src={lang.icon}
                          alt={lang.name}
                          className="w-5 h-5"
                          onError={(e) => {
                            console.warn(
                              "Language icon failed to load:",
                              e.target.src
                            );
                            e.target.style.display = "none";
                          }}
                        />
                        <span className="text-sm dark:text-white">
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset button with same size */}
              <button
                onClick={handleReset}
                className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-500/20 h-10 w-10"
                title="Reset code"
              >
                <RotateCcw className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            {/* Run button with aligned height */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 h-10 bg-blue-600 text-white rounded-xl shadow disabled:opacity-50 transition hover:bg-blue-700"
            >
              <Play className="w-4 h-4" /> {isRunning ? "Testing..." : "Run"}
            </button>
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-white/20 dark:bg-gray-900/40 rounded-lg m-3 overflow-hidden">
            <Editor
              height="100%"
              language={LANGUAGES[selectedLang].monacoLanguage}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                wordWrap: "on",
                tabSize: 2,
                insertSpaces: true,
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
              }}
              onMount={(editor, monaco) => {
                // disable Tab key for navigation
                editor.addCommand(monaco.KeyCode.Tab, () => {});

                // prevent copy, paste, cut
                editor.onKeyDown((e) => {
                  if (
                    (e.ctrlKey || e.metaKey) &&
                    (e.keyCode === monaco.KeyCode.KeyC ||
                      e.keyCode === monaco.KeyCode.KeyV ||
                      e.keyCode === monaco.KeyCode.KeyX)
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                });

                // prevent paste
                editor.onDidPaste(() => {
                  editor.setValue(code);
                });
              }}
            />
          </div>

          {/* Output */}
          <div className="flex-1 bg-white/30 dark:bg-gray-900/50 rounded-xl m-4 p-4 shadow-inner">
            <span className="font-semibold dark:text-white mb-2 block">
              Output:
            </span>
            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto">
              {output || "Output will appear here..."}
            </pre>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between p-4 border-t border-gray-300 dark:border-gray-700 sticky bottom-0 bg-white/80 dark:bg-gray-900/80 z-10 backdrop-blur-md">
        <button
          onClick={handleSubmit}
          disabled={
            isRunning ||
            submittedProblems.has(PROBLEM.problemTitle || PROBLEM.title)
          }
          className="px-4 py-2 bg-blue-900 text-white rounded-xl shadow font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submittedProblems.has(PROBLEM.problemTitle || PROBLEM.title)
            ? "Already Submitted"
            : isRunning
            ? "Submitting..."
            : "Submit"}
        </button>

        <div className="text-center font-mono text-lg font-bold tracking-wide dark:text-white">
          Time Left:{" "}
          <span className={timerWarning ? "text-red-500" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {currentProblemIndex < problems.length - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl shadow font-semibold hover:bg-emerald-600 transition"
          >
            Next Question &gt;&gt;
          </button>
        ) : (
          <button
            onClick={handleEndRound}
            className="px-4 py-2 bg-red-600 text-white rounded-xl shadow font-semibold hover:bg-red-700 transition"
          >
            End Round
          </button>
        )}
      </div>
    </div>
  );
};

export default CodingCompiler;
