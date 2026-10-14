import React, { useState, useEffect, useRef } from 'react';
import {
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
  const initialDraftRef = useRef(readCompilerDraft());
  const preserveInitialDraftRef = useRef(Boolean(initialDraftRef.current));
  const [selectedLanguage, setSelectedLanguage] = useState(() => initialDraftRef.current?.language || 'html');
  const [previewKey, setPreviewKey] = useState(0);
  const [code, setCode] = useState(() => initialDraftRef.current?.code || LANGUAGES.html.defaultCode);
  const [output, setOutput] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'light');
  const [activeView, setActiveView] = useState('editor'); // 'editor' or 'preview'

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

  // Update code when language changes
  useEffect(() => {
    if (preserveInitialDraftRef.current) {
      preserveInitialDraftRef.current = false;
      window.sessionStorage.removeItem('techlearn:compiler-draft');
      return;
    }
    setCode(LANGUAGES[selectedLanguage].defaultCode);
    setOutput('');
  }, [selectedLanguage]);

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
  };

  const handleRunCode = async () => {
    const currentLang = LANGUAGES[selectedLanguage];

    // No login required for any language

    setIsRunning(true);

    try {
      // Handle web languages (HTML/CSS) - client-side rendering
      if (currentLang.isWebLanguage) {
        setOutput('✅ Code rendered successfully! Check the preview panel.');
        // Auto-switch to preview on mobile for web languages
        if (window.innerWidth < 1024) {
          setActiveView('preview');
        }
        return;
      }

      // Handle server-side languages (Python, Java, C, and SQL)
      setOutput('Running code...\n');

      const result = await compilerAPI.compileCode({
        language: selectedLanguage,
        source_code: code,
        stdin: customInput,
      });

      // 1. Check if request was Queued due to high global capacity
      if (result.queued) {
        setQueueModal({
          isOpen: true,
          queueId: result.queueId,
          position: result.queuePosition || 1,
          estimatedSeconds: result.estimatedWaitSeconds || 10,
        });

        // Poll queue until completion
        if (queuePollingRef.current) clearInterval(queuePollingRef.current);
        queuePollingRef.current = setInterval(async () => {
          try {
            const qStatus = await compilerAPI.checkQueue(result.queueId);
            if (qStatus.status === 'completed') {
              clearInterval(queuePollingRef.current);
              setQueueModal((prev) => ({ ...prev, isOpen: false }));
              const compRes = qStatus.result || {};
              let outputText = '';
              if (compRes.stdout) outputText += compRes.stdout;
              if (compRes.stderr) outputText += '\n❌ Error:\n' + compRes.stderr;
              if (compRes.compile_output) outputText += '\n📝 Compilation Output:\n' + compRes.compile_output;
              if (compRes.status) outputText += `\n\n📊 Status: ${compRes.status.description || 'Completed'}`;
              if (!outputText.trim()) outputText = '✅ Code executed successfully (no output)';
              setOutput(outputText);
            } else if (qStatus.status === 'failed' || qStatus.status === 'expired' || qStatus.status === 'rejected') {
              clearInterval(queuePollingRef.current);
              setQueueModal((prev) => ({ ...prev, isOpen: false }));
              setOutput(`❌ Execution ${qStatus.status}: ${qStatus.error || qStatus.message || 'Failed'}`);
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

      // 2. Handle Usage Updates & 5 runs alert
      if (result.usage) {
        setAllowanceInfo(prev => ({
          ...(prev || {}),
          ...result.usage,
        }));

        if (result.usage.remainingCount === 5) {
          setShowFiveRunsAlert(true);
        }
      }

      // Format the output
      let outputText = '';

      if (result.stdout) {
        outputText += result.stdout;
      }

      if (result.stderr) {
        outputText += '\n❌ Error:\n' + result.stderr;
      }

      if (result.compile_output) {
        outputText += '\n📝 Compilation Output:\n' + result.compile_output;
      }

      if (result.status) {
        outputText += `\n\n📊 Status: ${result.status.description || 'Unknown'}`;
      }

      if (!outputText.trim()) {
        outputText = '✅ Code executed successfully (no output)';
      }

      setOutput(outputText);

    } catch (error) {
      console.error('Code execution error:', error);
      const errMsg = error.message || 'Unknown error occurred';

      if (errMsg.includes('daily allowance has been reached') || errMsg.includes('coding submissions')) {
        setExhaustionError(errMsg);
      }
      setOutput(`❌ Execution failed: ${errMsg}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopExecution = () => {
    setIsRunning(false);
    setOutput(prev => prev + '\n\n⚠️ Execution stopped by user');
  };

  // Refresh touches only the output area: the preview reloads / the terminal clears. The code stays.
  const handleRefreshOutput = () => {
    setPreviewKey((key) => key + 1);
    if (!LANGUAGES[selectedLanguage].isWebLanguage) setOutput('');
  };

  // Function to render output with styled status
  const renderOutput = (outputText) => {
    if (!outputText) return 'Click "Run" to execute your code...';

    // Split the output to find status line
    const lines = outputText.split('\n');
    const statusLineIndex = lines.findIndex(line => line.includes('📊 Status:'));

    if (statusLineIndex === -1) {
      return outputText;
    }

    const beforeStatus = lines.slice(0, statusLineIndex).join('\n');
    const statusLine = lines[statusLineIndex];
    const afterStatus = lines.slice(statusLineIndex + 1).join('\n');

    return (
      <span>
        {beforeStatus && beforeStatus}
        {beforeStatus && statusLine && '\n\n'}
        {statusLine && (
          <span className="text-gray-500 dark:text-gray-400">
            {statusLine}
          </span>
        )}
        {afterStatus && afterStatus}
      </span>
    );
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
      {/* Language navigation: horizontal, scrollable, starts directly below the global navbar */}
      <div className="fixed left-0 right-0 top-[72px] z-30 border-b border-black/5 bg-[#d8eef5] dark:border-white/10 dark:bg-[#01071e]">
        <nav aria-label="Languages" className="flex gap-2 overflow-x-auto px-4 py-2 lg:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Object.values(LANGUAGES).map((language) => (
            <button
              key={language.id}
              type="button"
              onClick={() => handleLanguageSelect(language.id)}
              aria-current={selectedLanguage === language.id ? 'true' : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedLanguage === language.id
                  ? 'border-[#8dd035] bg-[#8dd035]/20 text-[#04103d] dark:text-white'
                  : 'border-transparent text-gray-700 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10'
              }`}
            >
              <img src={language.icon} alt="" className="h-5 w-5 object-contain" />
              {language.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex min-h-screen overflow-x-hidden">
        {/* Main Content */}
        <div className="flex-1 relative min-w-0">
          <div className="relative z-10 pt-[124px] pb-2">
            <div className="h-[calc(100vh-8rem)] px-4 lg:px-6">

              {/* Header */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={currentLanguage.icon}
                        alt={`${currentLanguage.name} logo`}
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentLanguage.name} {currentLanguage.isWebLanguage ? 'Editor' : 'Compiler'}
                    </h1>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Daily Allowance Indicator */}
                  {allowanceInfo && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      <span>Daily Runs:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {allowanceInfo.remainingCount} / {allowanceInfo.effectiveAllowance}
                      </span>
                    </div>
                  )}
                </div>
              </div>

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
              <div className="lg:hidden mb-2">
                <div className="flex bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 p-1">
                  <button
                    onClick={() => setActiveView('editor')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeView === 'editor'
                        ? 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    Editor
                  </button>
                  <button
                    onClick={() => setActiveView('preview')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeView === 'preview'
                        ? 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {currentLanguage.isWebLanguage ? 'Preview' : 'Output'}
                  </button>
                </div>
              </div>

              {/* Editor and Output Panels */}
              <div className="h-[calc(100%-7rem)] lg:h-[calc(100%-3rem)]">
                {/* Desktop Layout - Resizable Split */}
                <div className="hidden lg:block h-full" ref={containerRef}>
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
                      className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden"
                      style={{ width: `calc(${splitPos}% - 8px)` }}
                    >
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent min-h-[4rem]">
                        <div className="flex items-center justify-between h-full">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Code Editor
                          </h3>
                          {/* Run Button - Only show for non-web languages */}
                          {!currentLanguage.isWebLanguage && (
                            <button
                              onClick={isRunning ? handleStopExecution : handleRunCode}
                              disabled={!code.trim()}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                isRunning
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300'
                                  : 'bg-[#8dd035] hover:bg-[#a2d354] text-[#04103d] font-semibold'
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
                                  Run
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="h-[calc(100%-4rem)]">
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
                      className="w-2 mx-2 cursor-col-resize select-none flex items-center justify-center"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                      }}
                      onMouseUp={() => setIsResizing(false)}
                    >
                      <div className="h-3/4 w-[3px] bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>

                    {/* Output Panel */}
                    <div
                      className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden flex-1"
                      style={{ width: `calc(${100 - splitPos}% - 8px)` }}
                    >
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent min-h-[4rem]">
                        <div className="flex items-center justify-between h-full">
                          <h3 className="font-medium text-gray-900 dark:text-white">
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
                      </div>
                      <div className="h-[calc(100%-4rem)] overflow-hidden flex flex-col">
                        {currentLanguage.isWebLanguage ? (
                          <iframe
                            key={previewKey}
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts"
                            title="Live Preview"
                          />
                        ) : (
                          <>
                            <div className="shrink-0 border-b border-white/10 dark:border-gray-700/20 p-3">
                              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Custom Input</label>
                              <textarea value={customInput} onChange={(event) => setCustomInput(event.target.value)} rows={4} placeholder="Enter stdin values here, one line at a time" className="w-full resize-y rounded-lg border border-gray-300/70 bg-white/70 px-3 py-2 font-mono text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-100" />
                            </div>
                            <div className="min-h-0 flex-1 p-4 overflow-auto">
                              <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{renderOutput(output)}</pre>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout - Single Panel with Tabs */}
                <div className="lg:hidden h-full relative">
                  {activeView === 'editor' ? (
                    /* Code Editor Panel */
                    <div className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden h-full">
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Code Editor
                          </h3>
                        </div>
                      </div>
                      <div className={`${!currentLanguage.isWebLanguage ? 'h-[calc(100%-7rem)]' : 'h-[calc(100%-3.5rem)]'}`}>
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
                    <div className="bg-white/50 dark:bg-[#0a1238] rounded-xl border border-black/5 dark:border-white/10 overflow-hidden h-full">
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-transparent">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">
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
                      </div>
                      <div className="h-[calc(100%-3.5rem)] overflow-hidden flex flex-col">
                        {currentLanguage.isWebLanguage ? (
                          <iframe
                            key={previewKey}
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts"
                            title="Live Preview"
                          />
                        ) : (
                          <>
                            <div className="shrink-0 border-b border-white/10 dark:border-gray-700/20 p-3">
                              <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Custom Input</label>
                              <textarea value={customInput} onChange={(event) => setCustomInput(event.target.value)} rows={3} placeholder="Enter stdin values here" className="w-full resize-y rounded-lg border border-gray-300/70 bg-white/70 px-3 py-2 font-mono text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-100" />
                            </div>
                            <div className="min-h-0 flex-1 p-4 overflow-auto">
                              <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{renderOutput(output)}</pre>
                            </div>
                          </>
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
