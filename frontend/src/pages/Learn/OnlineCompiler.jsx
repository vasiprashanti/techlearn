import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
  Settings,
  Download,
  Share2,
  Code,
  Eye
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import { compilerAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import ScrollProgress from '../../components/ScrollProgress';

// Language configurations
const LANGUAGES = {
  html: {
    id: 'html',
    name: 'HTML',
    icon: '/html.png',
    extension: '.html',
    defaultCode: `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to TechLearn</title>
  <style>
    body {
      background-color: #ffffff;
      color: #2573ee; /* CSS3 blue */
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 50px;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    p {
      font-size: 1.2em;
      color: #1e40af;
    }
    .subtitle {
      font-style: italic;
      color: #3b82f6;
      margin-top: 10px;
    }
  </style>
</head>
<body>

  <h1>Hey TechLearner!</h1>
  <p class="subtitle">This is a bug-free place... until you start typing</p>

</body>
</html>`,
    monacoLanguage: 'html',
    isWebLanguage: true
  },

  python: {
    id: 'python',
    name: 'Python',
    icon: '/python.png',
    extension: '.py',
    defaultCode: `# Welcome to Python Online Compiler
print("Hello, World!")

# Try some basic operations
x = 10
y = 20
result = x + y
print(f"The sum of {x} and {y} is {result}")`,
    monacoLanguage: 'python'
  },
  java: {
    id: 'java',
    name: 'Java',
    icon: '/java.png',
    extension: '.java',
    defaultCode: `// Welcome to Java Online Compiler
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // Try some basic operations
        int x = 10;
        int y = 20;
        int result = x + y;
        System.out.println("The sum of " + x + " and " + y + " is " + result);
    }
}`,
    monacoLanguage: 'java'
  },
  c: {
    id: 'c',
    name: 'C',
    icon: '/c.png',
    extension: '.c',
    defaultCode: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}`,
    monacoLanguage: 'c'
  },
  sql: {
    id: 'sql',
    name: 'SQL',
    icon: '/sql.png',
    extension: '.sql',
    defaultCode: `-- Welcome to SQL Online Compiler
SELECT 'Hello, World!' AS message;`,
    monacoLanguage: 'sql'
  }
};

const readCompilerDraft = () => {
  try {
    const raw = window.sessionStorage.getItem('techlearn:compiler-draft');
    if (!raw) return null;

    const draft = JSON.parse(raw);
    if (!LANGUAGES[draft?.language] || !String(draft?.code || '').trim()) return null;
    return { language: draft.language, code: draft.code };
  } catch {
    return null;
  }
};

const OnlineCompiler = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const initialDraftRef = useRef(readCompilerDraft());
  const preserveInitialDraftRef = useRef(Boolean(initialDraftRef.current));
  const [selectedLanguage, setSelectedLanguage] = useState(() => initialDraftRef.current?.language || 'html');
  const [previewKey, setPreviewKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('techlearn:compiler-sidebar-collapsed') === '1'; } catch { return false; }
  });
  const toggleSidebar = () => setSidebarCollapsed((collapsed) => {
    const next = !collapsed;
    try { localStorage.setItem('techlearn:compiler-sidebar-collapsed', next ? '1' : '0'); } catch { /* storage unavailable */ }
    return next;
  });
  const [codes, setCodes] = useState(() => {
    const initial = {};
    Object.values(LANGUAGES).forEach((lang) => {
      initial[lang.id] = lang.defaultCode;
    });
    if (initialDraftRef.current?.language && initialDraftRef.current?.code) {
      initial[initialDraftRef.current.language] = initialDraftRef.current.code;
    }
    return initial;
  });

  const code = codes[selectedLanguage] !== undefined ? codes[selectedLanguage] : (LANGUAGES[selectedLanguage]?.defaultCode || '');
  const setCode = (newCode) => {
    setCodes((prev) => {
      const currentVal = prev[selectedLanguage] !== undefined ? prev[selectedLanguage] : (LANGUAGES[selectedLanguage]?.defaultCode || '');
      const nextVal = typeof newCode === 'function' ? newCode(currentVal) : newCode;
      return {
        ...prev,
        [selectedLanguage]: nextVal,
      };
    });
  };
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [sessionStdin, setSessionStdin] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'light');
  const [activeView, setActiveView] = useState('editor'); // 'editor' or 'preview'

  const terminalInputRef = useRef(null);
  const terminalEndRef = useRef(null);
  const terminalScrollContainerRef = useRef(null);

  // Auto-scroll terminal container ONLY (without scrolling the window/page)
  useEffect(() => {
    if (terminalScrollContainerRef.current) {
      terminalScrollContainerRef.current.scrollTop = terminalScrollContainerRef.current.scrollHeight;
    }
  }, [terminalHistory, waitingForInput, terminalInput, isRunning]);

  // Focus terminal input when waiting for input without scrolling page
  useEffect(() => {
    if (waitingForInput && terminalInputRef.current) {
      terminalInputRef.current.focus({ preventScroll: true });
    }
  }, [waitingForInput]);

  // Allowance & Global Queue States
  const [allowanceInfo, setAllowanceInfo] = useState(null);
  const [showFiveRunsAlert, setShowFiveRunsAlert] = useState(false);
  const [exhaustionError, setExhaustionError] = useState(null);
  const [queueModal, setQueueModal] = useState({ isOpen: false, queueId: null, position: 0, estimatedSeconds: 0 });
  const queuePollingRef = useRef(null);

  // Fetch initial allowance on mount
  useEffect(() => {
    const fetchAllowance = async () => {
      try {
        const res = await compilerAPI.getStatus();
        if (res?.success) {
          setAllowanceInfo(res);
          if (res.remainingCount === 5) {
            setShowFiveRunsAlert(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch compiler allowance:", err);
      }
    };
    fetchAllowance();
  }, []);

  // Resizable split state for desktop
  const containerRef = useRef(null);
  const [splitPos, setSplitPos] = useState(50); // percentage width for editor pane
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(20, Math.min(80, pct)); // clamp between 20% and 80%
      setSplitPos(pct);
    };

    const stopResize = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', stopResize, { passive: true });
    window.addEventListener('blur', stopResize, { passive: true });
    window.addEventListener('mouseleave', stopResize, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('blur', stopResize);
      window.removeEventListener('mouseleave', stopResize);
    };
  }, [isResizing]);

  // Update editor theme when app theme changes
  useEffect(() => {
    setEditorTheme(theme === 'dark' ? 'custom-dark' : 'light');
  }, [theme]);

  // Define custom dark theme for Monaco Editor
  const defineCustomTheme = (monaco) => {
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'e2e8f0', background: '0a1238' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'operator', foreground: 'e2e8f0' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'type', foreground: '8b5cf6' },
        { token: 'function', foreground: 'fbbf24' },
      ],
      colors: {
        'editor.background': '#0a1238',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#334155',
        'editor.selectionHighlightBackground': '#475569',
        'editorCursor.foreground': '#60a5fa',
        'editor.lineHighlightBackground': '#101b47',
        'editorWhitespace.foreground': '#475569',
        'editorIndentGuide.background': '#475569',
        'editorIndentGuide.activeBackground': '#64748b',
        'editor.findMatchBackground': '#0ea5e9',
        'editor.findMatchHighlightBackground': '#0284c7',
        'scrollbarSlider.background': '#475569',
        'scrollbarSlider.hoverBackground': '#64748b',
        'scrollbarSlider.activeBackground': '#94a3b8',
      }
    });
  };

  // Clear draft ref if present on language change
  useEffect(() => {
    if (preserveInitialDraftRef.current) {
      preserveInitialDraftRef.current = false;
      window.sessionStorage.removeItem('techlearn:compiler-draft');
    }
  }, [selectedLanguage]);

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
    setTerminalHistory([]);
    setTerminalInput('');
    setSessionStdin('');
    setWaitingForInput(false);
    setLastPrompt('');
    setPreviewKey((k) => k + 1);
  };

  // Helper to detect if program output suggests it is waiting for user input
  const analyzeExecutionResult = (res, currentCode) => {
    const stdout = res.stdout || '';
    const stderr = res.stderr || '';
    const hasInputKeyword = /\b(scanf|cin|input\(|readLine|Scanner|raw_input)\b/.test(currentCode);

    // Common EOF / missing input error signatures
    const isEofError = 
      stderr.includes('EOFError') || 
      stderr.includes('NoSuchElementException') ||
      stderr.includes('end of file') ||
      stderr.includes('EOF when reading');

    // If stdout has content and doesn't end with a newline, or has input prompt indicators
    const hasUnterminatedPrompt = stdout.length > 0 && !stdout.endsWith('\n');
    const promptPattern = /([:?]\s*|\b(enter|input|value|number|name|choice)\b.*[:?]?\s*)$/i;
    const matchesPrompt = promptPattern.test(stdout.trimEnd());

    if (isEofError || (hasInputKeyword && (hasUnterminatedPrompt || matchesPrompt))) {
      // Find the last line as prompt
      const lines = stdout.split('\n');
      const lastLine = lines[lines.length - 1] || '> ';
      return {
        needsInput: true,
        prompt: lastLine,
        cleanStdout: stdout,
      };
    }

    return {
      needsInput: false,
      prompt: '',
      cleanStdout: stdout,
    };
  };

  const executeCode = async (stdinToUse, isSessionContinuation = false) => {
    const currentLang = LANGUAGES[selectedLanguage];

    if (currentLang.isWebLanguage) {
      setTerminalHistory([{ type: 'stdout', text: '✅ Code rendered successfully! Check the preview panel.' }]);
      if (window.innerWidth < 1024) {
        setActiveView('preview');
      }
      return;
    }

    setIsRunning(true);
    setWaitingForInput(false);

    if (!isSessionContinuation) {
      setTerminalHistory([{ type: 'system', text: `Compiling and running ${currentLang.name}...` }]);
    }

    try {
      const result = await compilerAPI.compileCode({
        language: selectedLanguage,
        source_code: code,
        stdin: stdinToUse,
        isSessionContinuation,
      });

      // 1. Check if request was Queued due to high global capacity
      if (result.queued) {
        setQueueModal({
          isOpen: true,
          queueId: result.queueId,
          position: result.queuePosition || 1,
          estimatedSeconds: result.estimatedWaitSeconds || 10,
        });

        if (queuePollingRef.current) clearInterval(queuePollingRef.current);
        queuePollingRef.current = setInterval(async () => {
          try {
            const qStatus = await compilerAPI.checkQueue(result.queueId);
            if (qStatus.status === 'completed') {
              clearInterval(queuePollingRef.current);
              setQueueModal((prev) => ({ ...prev, isOpen: false }));
              handleExecutionSuccess(qStatus.result || {}, stdinToUse);
            } else if (qStatus.status === 'failed' || qStatus.status === 'expired' || qStatus.status === 'rejected') {
              clearInterval(queuePollingRef.current);
              setQueueModal((prev) => ({ ...prev, isOpen: false }));
              setTerminalHistory((prev) => [
                ...prev,
                { type: 'stderr', text: `\n❌ Execution ${qStatus.status}: ${qStatus.error || qStatus.message || 'Failed'}` }
              ]);
              setIsRunning(false);
            } else if (qStatus.queuePosition) {
              setQueueModal((prev) => ({
                ...prev,
                position: qStatus.queuePosition,
                estimatedSeconds: qStatus.estimatedWaitSeconds || prev.estimatedSeconds,
              }));
            }
          } catch (pollErr) {
            console.error('Queue poll error:', pollErr);
          }
        }, 2000);

        return;
      }

      handleExecutionSuccess(result, stdinToUse);

    } catch (error) {
      console.error('Code execution error:', error);
      const errMsg = error.message || 'Unknown error occurred';

      if (errMsg.includes('daily allowance has been reached') || errMsg.includes('coding submissions')) {
        setExhaustionError(errMsg);
      }
      setTerminalHistory((prev) => [
        ...prev,
        { type: 'stderr', text: `\n❌ Execution failed: ${errMsg}` }
      ]);
      setIsRunning(false);
    }
  };

  // Helper to extract prompts defined in source code (C printf/scanf, Python input, Java Scanner, C++ cout/cin)
  const extractCodePrompts = (srcCode, lang) => {
    const prompts = [];
    if (!srcCode) return prompts;

    if (lang === 'c') {
      // Must have actual input function (scanf, getchar, fgets, gets)
      const hasInput = /\b(scanf|getchar|fgets|gets)\b/.test(srcCode);
      if (!hasInput) return prompts;

      const cRegex = /(?:printf\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)\s*;|std::cout\s*<<\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*;)[ \t\r\n]*(?:fflush\s*\([^)]*\)\s*;[ \t\r\n]*)?(?:scanf|getchar|fgets)/g;
      let match;
      while ((match = cRegex.exec(srcCode)) !== null) {
        const promptText = (match[1] !== undefined ? match[1] : match[2]) || '';
        prompts.push(promptText.replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
      }
    } else if (lang === 'python') {
      const pyRegex = /input\s*\(\s*(["'])(.*?)\1\s*\)/g;
      let match;
      while ((match = pyRegex.exec(srcCode)) !== null) {
        prompts.push(match[2] || '');
      }
    } else if (lang === 'cpp') {
      const hasInput = /\b(cin\b|getline|scanf|getchar)\b/.test(srcCode);
      if (!hasInput) return prompts;

      const cppRegex = /(?:std::cout\s*<<\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*;|printf\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)\s*;)[ \t\r\n]*(?:cin\b|getline|scanf)/g;
      let match;
      while ((match = cppRegex.exec(srcCode)) !== null) {
        const promptText = (match[1] !== undefined ? match[1] : match[2]) || '';
        prompts.push(promptText.replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
      }
    } else if (lang === 'java') {
      const hasInput = /\b(Scanner|readLine|BufferedReader)\b/.test(srcCode);
      if (!hasInput) return prompts;

      const javaRegex = /System\.out\.print(?:ln)?\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)\s*;[ \t\r\n]*(?:(?:[a-zA-Z0-9_<>[\]]+\s+)+[a-zA-Z0-9_]+\s*=\s*)?(?:(?:[a-zA-Z0-9_]+)\s*\.\s*(?:next[a-zA-Z]*|readLine))/g;
      let match;
      while ((match = javaRegex.exec(srcCode)) !== null) {
        prompts.push((match[1] || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
      }
    }
    return prompts;
  };

  const handleExecutionSuccess = (result, stdinUsed) => {
    // Handle Usage Updates & 5 runs alert
    if (result.usage) {
      setAllowanceInfo(prev => ({
        ...(prev || {}),
        ...result.usage,
      }));

      if (result.usage.remainingCount === 5) {
        setShowFiveRunsAlert(true);
      }
    }

    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const codePrompts = extractCodePrompts(code, selectedLanguage);
    const inputsProvided = (stdinUsed !== undefined && stdinUsed !== null && stdinUsed !== '') 
      ? String(stdinUsed).split('\n') 
      : [];
    const currentInputStep = inputsProvided.length;

    let displayStdout = stdout;
    let nextPrompt = '';
    let isWaiting = false;

    // Helper: fuzzy search for prompt in text (tries exact, trimmed, and unquoted)
    const findPromptIndex = (text, pText) => {
      if (!pText) return -1;
      let idx = text.indexOf(pText);
      if (idx !== -1) return idx;
      const trimmed = pText.trim();
      if (trimmed) {
        idx = text.indexOf(trimmed);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    // If there are sequential prompts in the code, slice stdout appropriately
    if (codePrompts.length > 0 && currentInputStep < codePrompts.length) {
      isWaiting = true;
      nextPrompt = codePrompts[currentInputStep];

      // Step 0: waiting for 1st input. Only display output BEFORE the 1st prompt.
      // Next prompt text will be displayed at the interactive terminal prompt line.
      if (currentInputStep === 0) {
        const p0Idx = findPromptIndex(stdout, codePrompts[0]);
        if (p0Idx !== -1) {
          displayStdout = stdout.substring(0, p0Idx);
        } else {
          displayStdout = '';
        }
      } else {
        // Step k > 0: user has provided k inputs.
        // We only want to display what was outputted before the current waiting prompt (codePrompts[currentInputStep]).
        const currPromptIdx = findPromptIndex(stdout, nextPrompt);
        if (currPromptIdx !== -1) {
          // Slice everything at and after this waiting prompt to prevent premature execution output
          displayStdout = stdout.substring(0, currPromptIdx);
        } else {
          // Fallback: If this prompt wasn't verbatim found, slice at any subsequent prompt
          let foundSubsequent = false;
          for (let s = currentInputStep + 1; s < codePrompts.length; s++) {
            const sIdx = findPromptIndex(stdout, codePrompts[s]);
            if (sIdx !== -1) {
              displayStdout = stdout.substring(0, sIdx);
              foundSubsequent = true;
              break;
            }
          }
          if (!foundSubsequent && stdout.includes(inputsProvided[0])) {
            // Cut off before any trailing output if possible
            displayStdout = '';
          }
        }
      }
    } else if (codePrompts.length === 0) {
      // Only run analyzeExecutionResult for non-prompted / dynamic codes where codePrompts wasn't found
      const analysis = analyzeExecutionResult(result, code);
      if (analysis.needsInput) {
        isWaiting = true;
        nextPrompt = analysis.prompt;
        // Trim nextPrompt off displayStdout so it doesn't print both as stdout and as the yellow prompt label
        const pIdx = displayStdout.lastIndexOf(nextPrompt);
        if (pIdx !== -1) {
          displayStdout = displayStdout.substring(0, pIdx);
        }
      }
    } else {
      // All extracted prompts have been satisfied!
      isWaiting = false;
      nextPrompt = '';
    }

    // Now reconstruct terminalHistory so previous inputs and interleaved outputs are preserved cleanly
    const historyItems = [];

    if (result.compile_output) {
      historyItems.push({ type: 'compile_output', text: result.compile_output });
    }

    if (codePrompts.length > 0 && inputsProvided.length > 0) {
      // Replay interactive transcript step by step:
      // For each completed input: [prompt] -> [stdin]
      let searchOffset = 0;
      inputsProvided.forEach((inp, idx) => {
        const pText = codePrompts[idx] || '';
        const pIdx = findPromptIndex(stdout.substring(searchOffset), pText);
        let segmentBeforePrompt = '';
        if (pIdx !== -1) {
          segmentBeforePrompt = stdout.substring(searchOffset, searchOffset + pIdx);
          searchOffset = searchOffset + pIdx + pText.length;
        }
        if (segmentBeforePrompt && segmentBeforePrompt.trim()) {
          historyItems.push({ type: 'stdout', text: segmentBeforePrompt });
        }
        historyItems.push({ type: 'stdin', prompt: pText, text: inp });
      });

      // Add remaining output for current step
      if (!isWaiting) {
        // Program finished completely! Show whatever remains after the last input
        const remainingOutput = stdout.substring(searchOffset);
        if (remainingOutput) {
          historyItems.push({ type: 'stdout', text: remainingOutput });
        }
      } else {
        // Still waiting for another prompt: if there was any stdout between last input and next prompt
        const remainingSlice = displayStdout.substring(searchOffset);
        if (remainingSlice && remainingSlice.trim()) {
          historyItems.push({ type: 'stdout', text: remainingSlice });
        }
      }
    } else {
      // First step or single non-prompt execution
      if (displayStdout) {
        historyItems.push({ type: 'stdout', text: displayStdout });
      }
    }

    if (stderr && !isWaiting) {
      historyItems.push({ type: 'stderr', text: stderr });
    }

    setTerminalHistory(historyItems);
    setWaitingForInput(isWaiting);
    setLastPrompt(nextPrompt);
    setIsRunning(false);
  };

  const handleRunCode = () => {
    setSessionStdin('');
    setTerminalInput('');
    setWaitingForInput(false);
    executeCode('', false);
  };

  const handleTerminalSubmit = (e) => {
    if (e) e.preventDefault();
    const inputLine = terminalInput;
    const newSessionStdin = sessionStdin ? `${sessionStdin}\n${inputLine}` : inputLine;

    // Echo input into history with prompt
    setTerminalHistory((prev) => [
      ...prev,
      { type: 'stdin', prompt: lastPrompt, text: inputLine }
    ]);

    setSessionStdin(newSessionStdin);
    setTerminalInput('');
    setWaitingForInput(false);

    // Re-execute with accumulated stdin
    executeCode(newSessionStdin, true);
  };

  const handleStopExecution = () => {
    setIsRunning(false);
    setWaitingForInput(false);
    setTerminalHistory((prev) => [
      ...prev,
      { type: 'system', text: '\n⚠️ Execution stopped by user' }
    ]);
  };

  // Refresh output resets the terminal session
  const handleRefreshOutput = () => {
    setPreviewKey((key) => key + 1);
    setTerminalHistory([]);
    setTerminalInput('');
    setSessionStdin('');
    setWaitingForInput(false);
    setLastPrompt('');
  };

  // Generate preview content for web languages
  const getPreviewContent = () => {
    const currentLang = LANGUAGES[selectedLanguage];

    if (selectedLanguage === 'html') {
      return code;
    } else if (selectedLanguage === 'css') {
      return currentLang.htmlTemplate.replace('{{CSS_CODE}}', code);
    }
    return '';
  };

  const currentLanguage = LANGUAGES[selectedLanguage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] online-compiler-container">
      <ScrollProgress />
      {/* Language Navigation: Topbar only for Mobiles (hidden on md and above) */}
      <div className="md:hidden fixed left-0 right-0 top-[72px] z-30 border-b border-black/5 bg-[#d8eef5]/95 backdrop-blur-md dark:border-white/10 dark:bg-[#01071e]/95">
        <nav aria-label="Languages" className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Object.values(LANGUAGES).map((language) => {
            const isSelected = selectedLanguage === language.id;
            return (
              <button
                key={language.id}
                type="button"
                onClick={() => handleLanguageSelect(language.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-normal transition-all duration-200 border ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-[#0b154a] !text-white border-[#2b3a74]/60 shadow-sm'
                      : 'bg-[#00113b] text-white border-[#00113b]/20 shadow-sm'
                    : isDarkMode
                      ? '!text-[#94a3b8] hover:!text-white hover:bg-[#121c4b]/50 border-transparent font-normal'
                      : '!text-[#00113b] hover:!text-[#2f73e0] hover:bg-white/60 border-transparent font-normal'
                }`}
              >
                <img src={language.icon} alt="" className="h-4 w-4 object-contain" />
                <span>{language.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-screen overflow-x-hidden">
        {/* Language Sidebar: Only for Desktops & Tablets (md:flex, hidden on mobile) */}
        {/* Top: 84px matches the desktop editor padding top; bottom aligns with the editor and preview bottom */}
        <aside
          className={`hidden md:flex flex-col fixed left-0 top-[72px] bottom-0 z-30 ${sidebarCollapsed ? 'w-[60px]' : 'w-40 lg:w-44'} border-r border-black/10 dark:border-[#1a234d] bg-[#daf0fa] dark:bg-[#070e38] transition-[width] duration-200`}
        >
          <div className={`px-3 pt-3 pb-1.5 border-b border-black/5 dark:border-white/5 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!sidebarCollapsed && (
              <span className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#17386c]/65 dark:text-[#8b9bb4]">
                Languages
              </span>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand languages sidebar' : 'Collapse languages sidebar'}
              className="p-1 rounded-md text-[#17386c]/70 hover:bg-black/5 dark:text-[#8b9bb4] dark:hover:bg-white/10"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          <nav
            aria-label="Languages Sidebar"
            className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: isDarkMode ? '#243266 transparent' : '#3C83F6 transparent' }}
          >
            {Object.values(LANGUAGES).map((language) => {
              const isSelected = selectedLanguage === language.id;
              return (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => handleLanguageSelect(language.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  title={language.name}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2 rounded-lg text-xs font-medium tracking-normal transition-all duration-200 text-left border ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-[#0b154a] !text-white font-semibold shadow-sm border-[#2b3a74]/60'
                        : 'bg-[#00113b] text-white font-semibold shadow-sm border-[#00113b]/20'
                      : isDarkMode
                        ? '!text-[#94a3b8] hover:!text-white hover:bg-[#121c4b]/50 font-normal border-transparent'
                        : '!text-[#00113b] hover:!text-[#2f73e0] hover:bg-white/60 font-normal border-transparent'
                  }`}
                >
                  <img src={language.icon} alt="" className="h-4 w-4 object-contain shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{language.name}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 relative min-w-0 ${sidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-40 lg:ml-44'}`}>
          <div className="relative z-10 pt-[124px] md:pt-[84px] pb-4">
            <div className="h-[calc(100vh-8.5rem)] md:h-[calc(100vh-6.25rem)] px-4 lg:px-6">

              {/* 5 Runs Remaining Alert */}
              <AnimatePresence>
                {showFiveRunsAlert && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200"
                  >
                    <div>
                      <span className="font-bold">You're doing great! </span>
                      <span>
                        You have 5 of your {allowanceInfo?.effectiveAllowance || 35} daily coding runs remaining. Make them count!
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFiveRunsAlert(false)}
                      className="ml-3 px-2 py-1 text-amber-800 dark:text-amber-300 hover:text-black dark:hover:text-white font-bold"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Exhaustion Banner / Warning */}
              <AnimatePresence>
                {exhaustionError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-900 dark:text-rose-200"
                  >
                    <div>
                      <span className="font-bold">You've used all your coding submissions for today. </span>
                      <span>
                        Your daily allowance has been reached. You can continue when your limit resets at midnight IST.
                      </span>
                    </div>
                    <button
                      onClick={() => setExhaustionError(null)}
                      className="ml-3 px-2 py-1 text-rose-800 dark:text-rose-300 hover:text-black dark:hover:text-white font-bold"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Queue Popup Modal */}
              <AnimatePresence>
                {queueModal.isOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0a1238] border border-gray-200 dark:border-[#222e55] shadow-2xl space-y-4 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center animate-pulse">
                        <Code className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        High Demand Right Now
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Our coding environment is handling a high volume of submissions. Your request is waiting in the queue, and we'll process it as capacity becomes available.
                      </p>
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#060e2c] border border-blue-100 dark:border-[#1a254d] flex justify-around text-xs">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Queue Position</div>
                          <div className="font-bold text-blue-600 dark:text-[#89c638] text-sm">#{queueModal.position}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Estimated Wait</div>
                          <div className="font-bold text-blue-600 dark:text-[#89c638] text-sm">~{queueModal.estimatedSeconds}s</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400">Your code is safe and will not be lost.</p>
                      <button
                        onClick={() => setQueueModal(prev => ({ ...prev, isOpen: false }))}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      >
                        Run in Background
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Mobile Navigation Tabs */}
              <div className="md:hidden mb-2">
                <div className="flex bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 p-1">
                  <button
                    onClick={() => setActiveView('editor')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      activeView === 'editor'
                        ? 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Input
                  </button>
                  <button
                    onClick={() => setActiveView('preview')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      activeView === 'preview'
                        ? 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {currentLanguage.isWebLanguage ? 'Preview' : 'Output'}
                  </button>
                </div>
              </div>

              {/* Editor and Output Panels */}
              <div className="h-[calc(100%-3rem)] md:h-full">
                {/* Desktop Layout - Resizable Split */}
                <div className="hidden md:block h-full" ref={containerRef}>
                  <div className="relative flex h-full w-full">
                    {isResizing && (
                      <div
                        className="absolute inset-0 z-50 cursor-col-resize"
                        onMouseUp={() => setIsResizing(false)}
                        onMouseMove={(e) => {
                          if (!containerRef.current) return;
                          const rect = containerRef.current.getBoundingClientRect();
                          let pct = ((e.clientX - rect.left) / rect.width) * 100;
                          pct = Math.max(20, Math.min(80, pct));
                          setSplitPos(pct);
                        }}
                      />
                    )}
                    {/* Code Editor Panel */}
                    <div
                      className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden flex flex-col"
                      style={{ width: `calc(${splitPos}% - 6px)` }}
                    >
                      <div className="px-4 py-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent flex items-center justify-between min-h-[3.5rem]">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                          Code Editor
                        </h3>

                        <div className="flex items-center gap-2.5">
                          {allowanceInfo && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-700 dark:text-blue-300 leading-none">
                              <span className="uppercase tracking-wider opacity-80">Daily Runs:</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {allowanceInfo.remainingCount} / {allowanceInfo.effectiveAllowance}
                              </span>
                            </div>
                          )}

                          {/* Run Button - Only show for non-web languages */}
                          {!currentLanguage.isWebLanguage && (
                            <button
                              onClick={isRunning ? handleStopExecution : handleRunCode}
                              disabled={!code.trim()}
                              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                isRunning
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300'
                                  : 'bg-[#8dd035] hover:bg-[#a2d354] text-[#04103d]'
                              } disabled:opacity-50 disabled:cursor-not-allowed shadow-xs`}
                            >
                              {isRunning ? (
                                <>
                                  <Square className="w-3.5 h-3.5" />
                                  Stop
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  Run
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-h-0">
                        <Editor
                          height="100%"
                          language={currentLanguage.monacoLanguage}
                          value={code}
                          onChange={(value) => setCode(value || '')}
                          theme={editorTheme}
                          beforeMount={defineCustomTheme}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on',
                            folding: true,
                            lineDecorationsWidth: 10,
                            lineNumbersMinChars: 3,
                            glyphMargin: false,
                            padding: { top: 16, bottom: 16 },
                            scrollbar: {
                              horizontal: 'hidden',
                              vertical: 'visible',
                              horizontalScrollbarSize: 0,
                              verticalScrollbarSize: 8
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Drag handle */}
                    <div
                      className="w-3 cursor-col-resize select-none flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                      }}
                      onMouseUp={() => setIsResizing(false)}
                      title="Drag to resize panels"
                    />

                    {/* Output Panel */}
                    <div
                      className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden flex-1 flex flex-col"
                      style={{ width: `calc(${100 - splitPos}% - 6px)` }}
                    >
                      <div className="px-4 py-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent flex items-center justify-between min-h-[3.5rem]">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                          {currentLanguage.isWebLanguage ? 'Live Preview' : 'Output'}
                        </h3>
                        <button
                          onClick={handleRefreshOutput}
                          className="p-1.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 transition-all duration-200"
                          title="Refresh output"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        {currentLanguage.isWebLanguage ? (
                          <iframe
                            key={previewKey}
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts"
                            title="Live Preview"
                          />
                        ) : (
                          <div
                            ref={terminalScrollContainerRef}
                            className="min-h-0 flex-1 p-4 overflow-auto bg-[#04081c] text-gray-100 font-mono text-sm leading-relaxed cursor-text selection:bg-blue-600/40"
                            onClick={() => terminalInputRef.current?.focus({ preventScroll: true })}
                          >
                            {terminalHistory.length === 0 && !isRunning && !waitingForInput && (
                              <div className="text-gray-500 italic select-none">
                                Click &quot;Run&quot; to execute.
                              </div>
                            )}

                            {terminalHistory.map((item, index) => {
                              if (item.type === 'stdin') {
                                return (
                                  <div key={index} className="text-green-400 font-semibold break-all">
                                    <span className="text-gray-500 mr-1 select-none">&gt;</span>
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'stderr') {
                                return (
                                  <div key={index} className="text-rose-400 whitespace-pre-wrap break-words">
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'compile_output') {
                                return (
                                  <div key={index} className="text-amber-300 whitespace-pre-wrap break-words">
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'status') {
                                return (
                                  <div key={index} className="text-gray-500 text-xs mt-2 select-none">
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'system') {
                                return (
                                  <div key={index} className="text-blue-400 text-xs my-1 select-none">
                                    {item.text}
                                  </div>
                                );
                              }
                              return (
                                <div key={index} className="whitespace-pre-wrap break-words text-gray-100">
                                  {item.text}
                                </div>
                              );
                            })}

                            {/* Active interactive prompt line */}
                            {waitingForInput && (
                              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1.5 mt-1">
                                {lastPrompt && (
                                  <span className="text-yellow-400 font-semibold select-none whitespace-pre">
                                    {lastPrompt}
                                  </span>
                                )}
                                <span className="text-emerald-400 font-bold select-none">&gt;</span>
                                <input
                                  ref={terminalInputRef}
                                  type="text"
                                  value={terminalInput}
                                  onChange={(e) => setTerminalInput(e.target.value)}
                                  className="flex-1 bg-transparent border-none outline-none text-emerald-300 font-mono text-sm p-0 m-0 focus:ring-0 focus:outline-none"
                                  placeholder="Type input and press Enter..."
                                />
                                <button type="submit" className="hidden" tabIndex={-1}>Submit</button>
                              </form>
                            )}

                            {isRunning && (
                              <div className="flex items-center gap-2 text-xs text-blue-400 my-1 animate-pulse select-none">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                                Program is executing...
                              </div>
                            )}

                            <div ref={terminalEndRef} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout - Single Panel with Tabs */}
                <div className="md:hidden h-full relative">
                  {activeView === 'editor' ? (
                    /* Code Editor Panel */
                    <div className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden h-full flex flex-col">
                      <div className="px-4 py-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent flex items-center justify-between min-h-[3.25rem]">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                          Code Editor
                        </h3>
                        {allowanceInfo && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-semibold text-blue-700 dark:text-blue-300 leading-none">
                            <span className="uppercase tracking-wider opacity-80">Daily Runs:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {allowanceInfo.remainingCount}/{allowanceInfo.effectiveAllowance}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-h-0">
                        <Editor
                          height="100%"
                          language={currentLanguage.monacoLanguage}
                          value={code}
                          onChange={(value) => setCode(value || '')}
                          theme={editorTheme}
                          beforeMount={defineCustomTheme}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on',
                            folding: true,
                            lineDecorationsWidth: 10,
                            lineNumbersMinChars: 3,
                            glyphMargin: false,
                            padding: { top: 16, bottom: 16 },
                            scrollbar: {
                              horizontal: 'hidden',
                              vertical: 'visible',
                              horizontalScrollbarSize: 0,
                              verticalScrollbarSize: 8
                            }
                          }}
                        />
                      </div>

                      {/* Run Button at bottom of editor for non-web languages */}
                      {!currentLanguage.isWebLanguage && (
                        <div className="p-3 border-t border-white/10 dark:border-gray-700/20 bg-white/5 dark:bg-gray-800/10">
                          <button
                            onClick={isRunning ? handleStopExecution : handleRunCode}
                            disabled={!code.trim()}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                              isRunning
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-[#8dd035] hover:bg-[#a2d354] text-[#04103d]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isRunning ? (
                              <>
                                <Square className="w-4 h-4" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Run Code
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Output/Preview Panel */
                    <div className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden h-full flex flex-col">
                      <div className="px-4 py-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                          {currentLanguage.isWebLanguage ? 'Live Preview' : 'Output'}
                        </h3>
                        <button
                          onClick={handleRefreshOutput}
                          className="p-1.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 transition-all duration-200"
                          title="Refresh output"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                        {currentLanguage.isWebLanguage ? (
                          <iframe
                            key={previewKey}
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts"
                            title="Live Preview"
                          />
                        ) : (
                          <div
                            className="min-h-0 flex-1 p-3 overflow-auto bg-[#04081c] text-gray-100 font-mono text-xs leading-relaxed cursor-text selection:bg-blue-600/40"
                            onClick={() => terminalInputRef.current?.focus({ preventScroll: true })}
                          >
                            {terminalHistory.length === 0 && !isRunning && !waitingForInput && (
                              <div className="text-gray-500 italic select-none">
                                Click &quot;Run&quot; to execute.
                              </div>
                            )}

                            {terminalHistory.map((item, index) => {
                              if (item.type === 'stdin') {
                                return (
                                  <div key={index} className="text-green-400 font-semibold break-all">
                                    <span className="text-gray-500 mr-1 select-none">&gt;</span>
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'stderr') {
                                return (
                                  <div key={index} className="text-rose-400 whitespace-pre-wrap break-words">
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'compile_output') {
                                return (
                                  <div key={index} className="text-amber-300 whitespace-pre-wrap break-words">
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'status') {
                                return (
                                  <div key={index} className="text-gray-500 text-[10px] mt-2 select-none">
                                    {item.text}
                                  </div>
                                );
                              }
                              if (item.type === 'system') {
                                return (
                                  <div key={index} className="text-blue-400 text-[10px] my-1 select-none">
                                    {item.text}
                                  </div>
                                );
                              }
                              return (
                                <div key={index} className="whitespace-pre-wrap break-words text-gray-100">
                                  {item.text}
                                </div>
                              );
                            })}

                            {/* Active interactive prompt line for mobile */}
                            {waitingForInput && (
                              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1 mt-1">
                                {lastPrompt && (
                                  <span className="text-yellow-400 font-semibold select-none whitespace-pre text-xs">
                                    {lastPrompt}
                                  </span>
                                )}
                                <span className="text-emerald-400 font-bold select-none text-xs">&gt;</span>
                                <input
                                  ref={terminalInputRef}
                                  type="text"
                                  value={terminalInput}
                                  onChange={(e) => setTerminalInput(e.target.value)}
                                  className="flex-1 bg-transparent border-none outline-none text-emerald-300 font-mono text-xs p-0 m-0 focus:ring-0 focus:outline-none"
                                  placeholder="Type input and tap Enter..."
                                />
                                <button type="submit" className="hidden" tabIndex={-1}>Submit</button>
                              </form>
                            )}

                            {isRunning && (
                              <div className="flex items-center gap-2 text-[10px] text-blue-400 my-1 animate-pulse select-none">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                                Program is executing...
                              </div>
                            )}

                            <div ref={terminalEndRef} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineCompiler;
