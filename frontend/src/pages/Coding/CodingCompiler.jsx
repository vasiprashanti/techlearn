import React, { useState, useEffect, useCallback } from "react";
import { Play, RotateCcw, Sun, Moon, ChevronDown } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../context/ThemeContext";
import ScrollProgress from "../../components/ScrollProgress";
import { compilerAPI } from "../../services/api";

// --- FIXED LANGUAGES CONFIG ---
const LANGUAGES = {
  javascript: {
    id: "javascript",
    name: "JavaScript",
    icon: "/javascript.png",
    extension: ".js",
    defaultCode: `// Write your code here\n`,
    monacoLanguage: "javascript",
    judge0Id: 63,
  },
  python: {
    id: "python",
    name: "Python",
    icon: "/python.png",
    extension: ".py",
    defaultCode: `# Write your code here\n`,
    monacoLanguage: "python",
    judge0Id: 71,
  },
  java: {
    id: "java",
    name: "Java",
    icon: "/java.png",
    extension: ".java",
    defaultCode: `// Write your code here\npublic class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}\n`,
    monacoLanguage: "java",
    judge0Id: 62,
  },
};

const CodingCompiler = ({ user, contestData }) => {
  const { theme, toggleTheme } = useTheme();
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
  
  const language = LANGUAGES[selectedLang];
  const BASE_URL = import.meta.env.VITE_API_URL;

  // Problems state - now using passed data instead of fetching
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const PROBLEM = problems[currentProblemIndex];

  // Debug logging
  console.log("Contest Data:", contestData);
  console.log("Problems:", problems);

  // Timer - using duration from contestData with proper default
  const [timeLeft, setTimeLeft] = useState(() => {
    const duration = contestData?.duration || 120;
    return duration * 60;
  });
  const [timerWarning, setTimerWarning] = useState(false);

  // Update editor theme when app theme changes
  useEffect(() => {
    setEditorTheme(theme === "dark" ? "vs-dark" : "light");
  }, [theme]);

  // Timer effect with proper cleanup and dependency management
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    if (timeLeft <= 10 * 60 && !timerWarning) {
      setTimerWarning(true);
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Auto-end round when time runs out
          setIsRoundComplete(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, timerWarning]);

  // Set problems from contestData on component mount
  useEffect(() => {
    console.log("useEffect triggered with contestData:", contestData);
    if (contestData?.problems && Array.isArray(contestData.problems)) {
      console.log("Setting problems from contestData.problems");
      setProblems(contestData.problems);
    } else {
      console.log("No valid problems found in contestData");
      console.log("Available keys in contestData:", contestData ? Object.keys(contestData) : "contestData is null/undefined");
    }
  }, [contestData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.language-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleReset = useCallback(() => {
    setCode(language.defaultCode);
    setOutput("");
  }, [language.defaultCode]);

  const handleNextQuestion = useCallback(() => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex((prev) => prev + 1);
      setOutput("");
      setCode(LANGUAGES[selectedLang].defaultCode);
    }
  }, [currentProblemIndex, problems.length, selectedLang]);

  const handleSubmit = useCallback(async () => {
    if (!PROBLEM) {
      setOutput("❌ No problem available");
      return;
    }

    setIsRunning(true);
    setOutput("🔍 Running hidden test cases...\n");

    try {
      let passedCount = 0;
      const testCases = PROBLEM.hiddenTestCases || [];
      
      if (testCases.length === 0) {
        setOutput("❌ No test cases available for this problem");
        setIsRunning(false);
        return;
      }
      
      for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        
        if (!test || typeof test.stdin === 'undefined' || typeof test.expected === 'undefined') {
          console.warn(`Invalid test case at index ${i}:`, test);
          continue;
        }

        try {
          const submissionData = {
            source_code: btoa(code), // Base64 encode the source code
            language_id: language.judge0Id,
            stdin: btoa(test.stdin || ""), // Base64 encode stdin
          };

          const result = await compilerAPI.compileCode(submissionData);

          // Decode base64 outputs if they exist
          const actualOutput = result.stdout ? atob(result.stdout).trim() : "";
          const expectedOutput = (test.expected || "").trim();

          if (actualOutput === expectedOutput) passedCount++;
        } catch (testError) {
          console.error(`Error in test case ${i}:`, testError);
          continue;
        }
      }

      let status = "❌ Failed";
      if (passedCount === testCases.length && testCases.length > 0) {
        status = "✅ Passed";
      } else if (passedCount > 0) {
        status = "⚠️ Partial Accepted";
      }

      const resultsText = `${status}\n📊 Score: ${passedCount}/${testCases.length}`;
      setOutput(resultsText);

      setResults((prev) => {
        const newResult = {
          problem: PROBLEM.problemTitle || PROBLEM.title || `Problem ${currentProblemIndex + 1}`,
          passed: passedCount === testCases.length && testCases.length > 0,
          score: passedCount,
          total: testCases.length,
        };
        
        const existingIndex = prev.findIndex(r => r.problem === newResult.problem);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newResult;
          return updated;
        } else {
          return [...prev, newResult];
        }
      });
    } catch (error) {
      console.error("Submission error:", error);
      setOutput(`❌ Submission failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  }, [PROBLEM, selectedLang, code, currentProblemIndex, language.judge0Id]);

  const handleRun = useCallback(async () => {
    if (!PROBLEM || !PROBLEM.example) {
      setOutput("❌ No example test case available");
      return;
    }

    setIsRunning(true);

    try {
      setOutput("⏳ Running code with example input...\n");
      
      const submissionData = {
        source_code: btoa(code), // Base64 encode the source code
        language_id: language.judge0Id,
        stdin: btoa(PROBLEM.example.input || ""), // Base64 encode stdin
      };

      const result = await compilerAPI.compileCode(submissionData);

      let outputText = "";
      
      // Decode base64 outputs if they exist
      const stdout = result.stdout ? atob(result.stdout).trim() : "";
      const stderr = result.stderr ? atob(result.stderr).trim() : "";
      const compile_output = result.compile_output ? atob(result.compile_output).trim() : "";
      
      if (stdout) {
        outputText += "📤 Output:\n" + stdout;
      }
      if (stderr) {
        outputText += "\n❌ Error:\n" + stderr;
      }
      if (compile_output) {
        outputText += "\n📝 Compilation:\n" + compile_output;
      }
      if (result.status?.description) {
        outputText += `\n\n📊 Status: ${result.status.description}`;
      }

      if (stdout) {
        outputText += "\n\n📋 Expected Output:\n" + (PROBLEM.example.output || "");
        const expectedOutput = (PROBLEM.example.output || "").trim();
        
        if (stdout === expectedOutput) {
          outputText += "\n\n✅ Output matches expected result!";
        } else {
          outputText += "\n\n⚠️ Output differs from expected result.";
        }
      }

      if (!outputText.trim()) {
        outputText = "✅ Code executed successfully (no output)";
      }

      setOutput(outputText);
    } catch (error) {
      console.error("Code execution error:", error);
      setOutput(`❌ Execution failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  }, [PROBLEM, selectedLang, code, language.judge0Id]);

  const handleLanguageChange = useCallback((lang) => {
    setSelectedLang(lang);
    setCode(LANGUAGES[lang].defaultCode);
    setShowDropdown(false);
  }, []);

  const handleEndRound = useCallback(async () => {
    try {
      // Get linkId from somewhere - this seems to be missing from the original code
      // You might need to pass this as a prop or get it from context
      const linkId = contestData?.linkId || contestData?._id;
      
      if (!linkId) {
        console.error("No linkId found for contest submission");
        setIsRoundComplete(true);
        return;
      }

      const response = await fetch(`${BASE_URL}/college-coding/${linkId}/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Add any required authentication headers here
        },
        body: JSON.stringify({ 
          contestId: contestData?._id,
          email: user?.email,
          results 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Contest results submitted successfully:", data);
    } catch (err) {
      console.error("Error submitting contest results:", err);
      // Still complete the round even if submission fails
    } finally {
      setIsRoundComplete(true);
    }
  }, [contestData, user?.email, results, BASE_URL]);

  // Render loading state
  if (!contestData) {
    return (
      <div className="flex items-center justify-center h-screen bg-white/20 dark:bg-gray-900/40">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Loading contest data...
          </p>
        </div>
      </div>
    );
  }

  // Render round complete state
  if (isRoundComplete) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white/20 dark:bg-gray-900/40 p-6 border-t border-gray-300 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">
          🎉 Round Complete!
        </h1>
        <div className="w-full max-w-3xl bg-white/20 dark:bg-gray-900/40 p-6 rounded-2xl shadow-md border border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            Results Summary
          </h2>
          <div className="grid gap-4">
            {results.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">
                No problems attempted.
              </p>
            ) : (
              results.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold dark:text-white">{res.problem}</p>
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-lg ${
                        res.passed
                          ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300"
                      }`}
                    >
                      {res.passed ? "✅ Passed" : "❌ Failed"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    Score: <span className="font-bold">{res.score}</span> /{" "}
                    {res.total}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    );
  }

  // Render no problems state
  if (!PROBLEM || problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white/20 dark:bg-gray-900/40">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            {problems.length === 0 ? "Loading problems..." : "No problems available"}
          </p>
          {contestData && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Debug Info:</p>
              <p>Contest Data Keys: {Object.keys(contestData).join(", ")}</p>
              <p>Problems Array Length: {problems.length}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ScrollProgress />
      
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-3 bg-white/20 dark:bg-gray-900/40 border-b border-gray-300 dark:border-gray-700">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src={theme === "light" ? "/logoo.png" : "/logoo2.png"}
            alt="Logo"
            className="h-8 w-auto object-contain"
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

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className={`transition-colors relative ${
              theme === "dark"
                ? "text-[#e0e6f5] hover:text-white"
                : "text-[#00184f]"
            }`}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 pt-5">
        {/* LEFT PANEL */}
        <div className="w-1/2 bg-white/20 dark:bg-gray-900/40 p-6 overflow-y-auto border-r border-gray-300 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">
            {PROBLEM.problemTitle || PROBLEM.title || `Problem ${currentProblemIndex + 1}`}
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {PROBLEM.description || "No description available."}
          </p>

          {PROBLEM.inputFormat && PROBLEM.inputFormat.length > 0 && (
            <>
              <h2 className="font-semibold mt-3 dark:text-white">Input Format:</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                {PROBLEM.inputFormat.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}

          {PROBLEM.outputFormat && PROBLEM.outputFormat.length > 0 && (
            <>
              <h2 className="font-semibold mt-3 dark:text-white">Output Format:</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                {PROBLEM.outputFormat.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}

          {PROBLEM.constraints && PROBLEM.constraints.length > 0 && (
            <>
              <h2 className="font-semibold mt-3 dark:text-white">Constraints:</h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                {PROBLEM.constraints.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </>
          )}

          {PROBLEM.example && (
            <>
              <h2 className="font-semibold mt-3 dark:text-white">Example:</h2>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Input:</strong>
                  <pre className="mt-1 text-xs whitespace-pre-wrap">
                    {PROBLEM.example.input?.replace(/\\n/g, "\n") || ""}
                  </pre>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  <strong>Output:</strong>
                  <pre className="mt-1 text-xs whitespace-pre-wrap">
                    {PROBLEM.example.output?.replace(/\\n/g, "\n") || ""}
                  </pre>
                </p>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-1/2 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-700">
            {/* Language Dropdown + Reset */}
            <div className="flex items-center gap-3 relative">
              <div className="relative language-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/20 h-10"
                  aria-label="Select programming language"
                >
                  <img
                    src={language.icon}
                    alt={language.name}
                    className="w-5 h-5"
                  />
                  <ChevronDown className="w-4 h-4 dark:text-white" />
                </button>
                {showDropdown && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex flex-col gap-2 z-50 min-w-[150px]">
                    {Object.values(LANGUAGES).map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                          selectedLang === lang.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                        }`}
                      >
                        <img
                          src={lang.icon}
                          alt={lang.name}
                          className="w-5 h-5"
                        />
                        <span className="text-sm dark:text-white">
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset button */}
              <button
                onClick={handleReset}
                className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-500/20 h-10 w-10"
                aria-label="Reset code"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 h-10 bg-blue-600 text-white rounded-xl shadow disabled:opacity-50 transition hover:bg-blue-700"
            >
              <Play className="w-4 h-4" /> {isRunning ? "Running..." : "Run"}
            </button>
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-white/20 dark:bg-gray-900/40 rounded-lg m-3 overflow-hidden">
            <Editor
              height="100%"
              language={language.monacoLanguage}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme={editorTheme}
              options={{
                minimap: { enabled: false },
                wordWrap: "on",
                tabSize: 2,
                insertSpaces: true,
                automaticLayout: true,
              }}
              onMount={(editor, monaco) => {
                // Disable tab key navigation (but allow indentation)
                editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Tab, () => {
                  return; // Block Alt+Tab for window switching
                });

                // Prevent copy/paste/cut shortcuts
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

                // Prevent paste events
                editor.onDidPaste((e) => {
                  // Reset to current state if someone tries to paste
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
      <div className="flex items-center justify-between p-4 border-t border-gray-300 dark:border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl shadow font-semibold hover:bg-blue-800 transition disabled:opacity-50"
        >
          {isRunning ? "Submitting..." : "Submit"}
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
