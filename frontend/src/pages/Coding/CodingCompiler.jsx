import React, { useState, useEffect } from "react";
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

  // problems state - now using passed data instead of fetching
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const PROBLEM = problems[currentProblemIndex];

  // Debug logging
  console.log("Contest Data:", contestData);
  console.log("Problems:", problems);

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
    console.log("useEffect triggered with contestData:", contestData);
    if (contestData?.problems && Array.isArray(contestData.problems)) {
      console.log("Setting problems from contestData.problems");
      setProblems(contestData.problems);
    } else {
      console.log("No valid problems found in contestData");
      console.log("Available keys in contestData:", contestData ? Object.keys(contestData) : "contestData is null/undefined");
    }
  }, [contestData]);

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleReset = () => {
    setCode(language.defaultCode);
    setOutput("");
  };

  const handleNextQuestion = () => {
    setCurrentProblemIndex((prev) => (prev + 1) % problems.length);
    setOutput("");
    setCode(LANGUAGES[selectedLang].defaultCode);
  };

  const handleSubmit = async () => {
    if (!PROBLEM) return;
    setIsRunning(true);
    setOutput("🔍 Running hidden test cases...\n");

    try {
      let passedCount = 0;

      for (let i = 0; i < PROBLEM.hiddenTestCases.length; i++) {
        const test = PROBLEM.hiddenTestCases[i];
        const result = await compilerAPI.compileCode({
          language: selectedLang,
          source_code: code,
          stdin: test.stdin,
        });

        const actualOutput = (result.stdout || "").trim();
        const expectedOutput = (test.expected || "").trim();

        if (actualOutput === expectedOutput) passedCount++;
      }

      let status = "❌ Failed";
      if (passedCount === PROBLEM.hiddenTestCases.length) status = "✅ Passed";
      else if (passedCount > 0) status = "⚠️ Partial Accepted";

      const resultsText = `${status}\n📊 Score: ${passedCount}/${PROBLEM.hiddenTestCases.length}`;
      setOutput(resultsText);

      setResults((prev) => [
        ...prev,
        {
          problem: PROBLEM.problemTitle || PROBLEM.title,
          passed: passedCount === PROBLEM.hiddenTestCases.length,
          score: passedCount,
          total: PROBLEM.hiddenTestCases.length,
        },
      ]);
    } catch (error) {
      console.error("Submission error:", error);
      setOutput(`❌ Submission failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = async () => {
    if (!PROBLEM) return;
    setIsRunning(true);

    try {
      setOutput("⏳ Running code with example input...\n");
      const result = await compilerAPI.compileCode({
        language: selectedLang,
        source_code: code,
        stdin: PROBLEM.example?.input || "",
      });

      let outputText = "";
      if (result.stdout && result.stdout.trim())
        outputText += "📤 Output:\n" + result.stdout.trim();
      if (result.stderr && result.stderr.trim())
        outputText += "\n❌ Error:\n" + result.stderr.trim();
      if (result.compile_output && result.compile_output.trim())
        outputText += "\n📝 Compilation:\n" + result.compile_output.trim();
      if (result.status?.description)
        outputText += `\n\n📊 Status: ${result.status.description}`;

     if (result.stdout && result.stdout.trim()) {
  outputText += "\n\n📋 Expected Output:\n" + (PROBLEM.example?.output || "");
  const actualOutput = result.stdout.trim();
  if (actualOutput === PROBLEM.example?.output) {
    outputText += "\n\n✅ Output matches expected result!";
  } else {
    outputText += "\n\n⚠️ Output differs from expected result.";
  }
}
      
      if (!outputText.trim())
        outputText = "✅ Code executed successfully (no output)";

      setOutput(outputText);
    } catch (error) {
      console.error("Code execution error:", error);
      setOutput(`❌ Execution failed: ${error.message || "Unknown error"}`);
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
    try {
      // Submit results with contest ID and user email - Fixed: removed undefined linkId
      await fetch(`${BASE_URL}/college-coding/${contestData?._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contestId: contestData?._id,
          email: user.email,
          results 
        }),
      });
    } catch (err) {
      console.error("Error submitting contest results", err);
    }
    setIsRoundComplete(true);
  };

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
            {results.map((res, idx) => (
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
            ))}
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
        >
          🔄 Restart Round
        </button>
      </div>
    );
  }

  if (!PROBLEM) {
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
      <div className="flex flex-1 pt-5">
        {/* LEFT PANEL */}
        <div className="w-1/2 bg-white/20 dark:bg-gray-900/40 p-6 overflow-y-auto border-r border-gray-300 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">
            {PROBLEM.problemTitle || PROBLEM.title}
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {PROBLEM.description}
          </p>

          <h2 className="font-semibold mt-3 dark:text-white">Input Format:</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
            {PROBLEM.inputFormat?.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <h2 className="font-semibold mt-3 dark:text-white">Output Format:</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
            {PROBLEM.outputFormat?.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <h2 className="font-semibold mt-3 dark:text-white">Constraints:</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
            {PROBLEM.constraints?.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <h2 className="font-semibold mt-3 dark:text-white">Example:</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Input:</strong>
              <pre className="mt-1 text-xs">
  {PROBLEM.example?.input?.replace(/\\n/g, "\n") || "No example input provided"}
</pre>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              <strong>Output:</strong>
              <pre className="mt-1 text-xs">
  {PROBLEM.example?.output?.replace(/\\n/g, "\n") || "No example output provided"}
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
                    src={language.icon}
                    alt={language.name}
                    className="w-5 h-5"
                  />
                  <ChevronDown className="w-4 h-4 dark:text-white" />
                </button>
                {showDropdown && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-800 shadow rounded-lg p-2 flex flex-col gap-2 z-50">
                    {Object.values(LANGUAGES).map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
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

              {/* Reset button with same size */}
              <button
                onClick={handleReset}
                className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-500/20 h-10 w-10"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Run button with aligned height */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 h-10 bg-blue-600 text-white rounded-xl shadow disabled:opacity-50 transition"
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
              }}
              onMount={(editor, monaco) => {
                // 1. Disable tab key (prevent tab switching / indentation)
                editor.addCommand(monaco.KeyCode.Tab, () => {
                  return; // does nothing
                });

                // 2. Prevent copy (Ctrl/Cmd + C), paste (Ctrl/Cmd + V), cut (Ctrl/Cmd + X)
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

                // 3. Disable mouse-based copy/paste (context menu)
                editor.onDidPaste(() => {
                  editor.setValue(code); // reset to current state if someone tries to paste
                });
              }}
            />
          </div>

          {/* Output */}
          <div className="flex-1 bg-white/30 dark:bg-gray-900/50 rounded-xl m-4 p-4 shadow-inner">
            <span className="font-semibold dark:text-white mb-2 block">
              Output:
            </span>
            <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap max-h-80 overflow-y-auto">
              {output || "Output will appear here..."}
            </pre>
          </div>
        </div>
      </div>
      {/* Replace End Round button with handleEndRound */}
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
        {currentProblemIndex < problems.length - 1 && (
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl shadow font-semibold hover:bg-emerald-600 transition"
          >
            Next Question &gt;&gt;
          </button>
        )}
        {currentProblemIndex === problems.length - 1 && (
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
