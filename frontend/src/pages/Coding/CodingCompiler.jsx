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
    defaultCode: `# Write your code here\nprint("hello")\n`,
    monacoLanguage: "python",
    judge0Id: 71,
  },
  java: {
    id: "java",
    name: "Java",
    icon: "/java.png",
    extension: ".java",
    defaultCode: `// Write your code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("hello");\n    }\n}\n`,
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

  // Problems state
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const PROBLEM = problems[currentProblemIndex];

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

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    if (timeLeft <= 10 * 60 && !timerWarning) {
      setTimerWarning(true);
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setIsRoundComplete(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, timerWarning]);

  // Set problems from contestData
  useEffect(() => {
    if (contestData?.problems && Array.isArray(contestData.problems)) {
      setProblems(contestData.problems);
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

  // Fixed compilation function
  const compileAndRun = async (stdin = "") => {
    try {
      const submissionData = {
        source_code: btoa(unescape(encodeURIComponent(code))), // Properly encode for unicode
        language_id: language.judge0Id,
        stdin: btoa(unescape(encodeURIComponent(stdin))),
      };

      const result = await compilerAPI.compileCode(submissionData);
      
      // Handle the response properly
      let decodedResult = {};
      
      if (result.stdout) {
        decodedResult.stdout = decodeURIComponent(escape(atob(result.stdout)));
      }
      if (result.stderr) {
        decodedResult.stderr = decodeURIComponent(escape(atob(result.stderr)));
      }
      if (result.compile_output) {
        decodedResult.compile_output = decodeURIComponent(escape(atob(result.compile_output)));
      }
      
      decodedResult.status = result.status;
      
      return decodedResult;
    } catch (error) {
      throw new Error(`Compilation failed: ${error.message}`);
    }
  };

  const handleRun = useCallback(async () => {
    if (!PROBLEM || !PROBLEM.example) {
      setOutput("❌ No example test case available");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running code with example input...\n");

    try {
      const result = await compileAndRun(PROBLEM.example.input || "");

      let outputText = "";
      
      if (result.stdout && result.stdout.trim()) {
        outputText += "📤 Output:\n" + result.stdout.trim();
      }
      if (result.stderr && result.stderr.trim()) {
        outputText += "\n❌ Error:\n" + result.stderr.trim();
      }
      if (result.compile_output && result.compile_output.trim()) {
        outputText += "\n📝 Compilation Output:\n" + result.compile_output.trim();
      }
      if (result.status?.description) {
        outputText += `\n\n📊 Status: ${result.status.description}`;
      }

      if (result.stdout && result.stdout.trim()) {
        const actualOutput = result.stdout.trim();
        const expectedOutput = (PROBLEM.example.output || "").trim();
        
        outputText += "\n\n📋 Expected Output:\n" + expectedOutput;
        
        if (actualOutput === expectedOutput) {
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
  }, [PROBLEM, code, language.judge0Id]);

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
          const result = await compileAndRun(test.stdin);

          const actualOutput = (result.stdout || "").trim();
          const expectedOutput = (test.expected || "").trim();

          if (actualOutput === expectedOutput) {
            passedCount++;
          }
        } catch (testError) {
          console.error(`Error in test case ${i}:`, testError);
          continue;
        }
      }

      let status = "❌ Failed";
      if (passedCount === testCases.length && testCases.length > 0) {
        status = "✅ All Test Cases Passed";
      } else if (passedCount > 0) {
        status = "⚠️ Partial Pass";
      }

      const resultsText = `${status}\n📊 Score: ${passedCount}/${testCases.length} test cases passed`;
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
  }, [PROBLEM, code, currentProblemIndex, language.judge0Id]);

  const handleLanguageChange = useCallback((lang) => {
    setSelectedLang(lang);
    setCode(LANGUAGES[lang].defaultCode);
    setShowDropdown(false);
  }, []);

  const handleEndRound = useCallback(async () => {
    try {
      const linkId = contestData?.linkId || contestData?._id;
      
      if (linkId && user?.email) {
        const response = await fetch(`${BASE_URL}/college-coding/${linkId}/submit`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            contestId: contestData?._id,
            email: user?.email,
            results 
          }),
        });

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Error submitting contest results:", err);
    } finally {
      setIsRoundComplete(true);
    }
  }, [contestData, user?.email, results, BASE_URL]);

  // Render round complete state
  if (isRoundComplete) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white/20 dark:bg-gray-900/40 p-6">
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
                    Score: <span className="font-bold">{res.score}</span> / {res.total}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render loading state
  if (!contestData || problems.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-white/20 dark:bg-gray-900/40">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {!contestData ? "Loading contest data..." : "Loading problems..."}
          </p>
        </div>
      </div>
    );
  }

  // Render no problems state
  if (!PROBLEM) {
    return (
      <div className="flex items-center justify-center h-screen bg-white/20 dark:bg-gray-900/40">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            No problems available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <ScrollProgress />
      
      {/* Top Navigation */}
      <nav className="w-full flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <img
            src={theme === "light" ? "/logoo.png" : "/logoo2.png"}
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-6">
          <span className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white cursor-pointer">
            Learn
          </span>
          <span className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white cursor-pointer">
            Build
          </span>
          <span className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white cursor-pointer">
            Dashboard
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            Hi, {user?.name || 'User'}
          </span>
          <button
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 bg-white dark:bg-gray-800 p-6 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2 dark:text-white">
              {PROBLEM.problemTitle || PROBLEM.title || "Problem"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                50 XP
              </span>
              <span>Beginner</span>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {PROBLEM.description || "Problem description will appear here"}
            </p>

            {PROBLEM.inputFormat && PROBLEM.inputFormat.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2 dark:text-white">Input Format:</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  {PROBLEM.inputFormat.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {PROBLEM.outputFormat && PROBLEM.outputFormat.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2 dark:text-white">Output Format:</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  {PROBLEM.outputFormat.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {PROBLEM.constraints && PROBLEM.constraints.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2 dark:text-white">Constraints:</h3>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
                  {PROBLEM.constraints.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {PROBLEM.example && (
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2 dark:text-white">Example:</h3>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="mb-3">
                    <strong className="text-gray-800 dark:text-gray-200">Input:</strong>
                    <pre className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {PROBLEM.example.input?.replace(/\\n/g, "\n") || ""}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-gray-800 dark:text-gray-200">Output:</strong>
                    <pre className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {PROBLEM.example.output?.replace(/\\n/g, "\n") || ""}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col bg-white dark:bg-gray-800">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative language-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <img src={language.icon} alt={language.name} className="w-5 h-5" />
                  <span className="text-sm dark:text-white">{language.name}</span>
                  <ChevronDown className="w-4 h-4 dark:text-white" />
                </button>
                {showDropdown && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-2 z-50 min-w-[150px] border border-gray-200 dark:border-gray-600">
                    {Object.values(LANGUAGES).map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`flex items-center gap-2 px-3 py-2 w-full rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          selectedLang === lang.id ? 'bg-gray-100 dark:bg-gray-600' : ''
                        }`}
                      >
                        <img src={lang.icon} alt={lang.name} className="w-4 h-4" />
                        <span className="text-sm dark:text-white">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Reset code"
              >
                <RotateCcw className="w-4 h-4 dark:text-white" />
              </button>
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>

          {/* Code Editor */}
          <div className="flex-1">
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
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                renderLineHighlight: "none",
                fontSize: 14,
              }}
            />
          </div>

          {/* Output Panel */}
          <div className="h-1/3 border-t border-gray-200 dark:border-gray-700 p-4">
            <h4 className="font-semibold mb-2 dark:text-white">Output:</h4>
            <div className="h-full bg-gray-50 dark:bg-gray-900 rounded-lg p-3 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {output || "Output will appear here..."}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSubmit}
          disabled={isRunning}
          className="px-6 py-2 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "Submitting..." : "Submit"}
        </button>
        
        <div className="font-mono text-lg font-bold dark:text-white">
          Time Left: <span className={timerWarning ? "text-red-500" : "text-blue-600"}>{formatTime(timeLeft)}</span>
        </div>
        
        {currentProblemIndex < problems.length - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Next Question &gt;&gt;
          </button>
        ) : (
          <button
            onClick={handleEndRound}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            End Round
          </button>
        )}
      </div>
    </div>
  );
};

export default CodingCompiler;
