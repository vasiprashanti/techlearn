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
  Menu,
  Code,
  Eye
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import { compilerAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
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
  }
};

const OnlineCompiler = () => {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('html');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [code, setCode] = useState(LANGUAGES.html.defaultCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'light');
  const [activeView, setActiveView] = useState('editor'); // 'editor' or 'preview'

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
        { token: '', foreground: 'e2e8f0', background: '1e293b' },
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
        'editor.background': '#1e293b',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#334155',
        'editor.selectionHighlightBackground': '#475569',
        'editorCursor.foreground': '#60a5fa',
        'editor.lineHighlightBackground': '#334155',
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
    setCode(LANGUAGES[selectedLanguage].defaultCode);
    setOutput('');
  }, [selectedLanguage]);

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
    setMobileMenuOpen(false);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
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

      // Handle server-side languages (Python/Java)
      setOutput('Running code...\n');

      const result = await compilerAPI.compileCode({
        language: selectedLanguage,
        source_code: code,
        stdin: ''
      });

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
      setOutput(`❌ Execution failed: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStopExecution = () => {
    setIsRunning(false);
    setOutput(prev => prev + '\n\n⚠️ Execution stopped by user');
  };

  const handleResetCode = () => {
    setCode(LANGUAGES[selectedLanguage].defaultCode);
    setOutput('');
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
      <Navbar />
      
      <div className="flex min-h-screen overflow-x-hidden">
        {/* Desktop Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: sidebarCollapsed ? "60px" : "160px",
            transition: { duration: 0.3, ease: "easeInOut" }
          }}
          className="hidden lg:flex flex-col bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 relative z-40 overflow-x-hidden"
        >
          {/* Sidebar Header */}
          <div className="p-2 border-b border-white/10 dark:border-gray-700/20 pt-24 relative z-50">
            <div className="flex items-center justify-end relative z-50">
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="p-1.5 rounded-lg bg-blue-500/20 dark:bg-blue-600/20 hover:bg-blue-500/30 dark:hover:bg-blue-600/30 transition-all duration-200 border border-blue-500/50 dark:border-blue-400/50 flex-shrink-0 cursor-pointer z-[60] relative shadow-lg active:scale-95"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-blue-700 dark:text-blue-300" />
                ) : (
                  <ChevronLeft className="w-3 h-3 text-blue-700 dark:text-blue-300" />
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            <div className="space-y-2">
              {Object.values(LANGUAGES).map((language) => (
                <motion.button
                  key={language.id}
                  onClick={() => handleLanguageSelect(language.id)}
                  whileHover={{ scale: sidebarCollapsed ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`sidebar-button group relative w-full text-left rounded-lg transition-all duration-300 ${
                    selectedLanguage === language.id
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-lg'
                      : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:shadow-md'
                  } ${sidebarCollapsed ? 'p-2 mx-1' : 'p-3'}`}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className={`${sidebarCollapsed ? 'w-10 h-10' : 'w-9 h-9'} flex items-center justify-center`}>
                      <img
                        src={language.icon}
                        alt={`${language.name} logo`}
                        className={`${sidebarCollapsed ? 'w-8 h-8' : 'w-7 h-7'} object-contain`}
                      />
                    </div>

                    <AnimatePresence mode="wait">
                      {!sidebarCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 min-w-0"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {language.name}
                          </h4>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {language.name}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>



        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/20 z-50 overflow-y-auto"
              >
                <div className="p-4 pt-24">
                  <h3 className="font-poppins font-semibold text-gray-900 dark:text-white text-lg mb-4">
                    Select Language
                  </h3>
                  <div className="space-y-3">
                    {Object.values(LANGUAGES).map((language) => (
                      <button
                        key={language.id}
                        onClick={() => handleLanguageSelect(language.id)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                          selectedLanguage === language.id
                            ? 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-700 dark:text-blue-300'
                            : 'bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-600/50 hover:bg-white/60 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center">
                            <img
                              src={language.icon}
                              alt={`${language.name} logo`}
                              className="w-8 h-8 object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {language.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {language.extension}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 relative min-w-0">
          <div className="relative z-10 pt-20 pb-2">
            <div className={`h-[calc(100vh-5.5rem)] transition-all duration-300 ${
              sidebarCollapsed ? 'px-4' : 'px-4 lg:px-6'
            }`}>

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
                <div className="flex items-center gap-2">
                  {/* Mobile Menu Button - moved here from fixed position */}
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="lg:hidden p-2 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 transition-all duration-200"
                    title="Language Menu"
                  >
                    <Menu className="w-4 h-4" />
                  </button>



                  {/* Removed Run button from header - moved to code editor section */}
                </div>
              </div>



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
                      className="bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
                      style={{ width: `calc(${splitPos}% - 8px)` }}
                    >
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-white/10 dark:bg-gray-800/20 min-h-[4rem]">
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
                                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-300'
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
                      className="bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden flex-1"
                      style={{ width: `calc(${100 - splitPos}% - 8px)` }}
                    >
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-white/10 dark:bg-gray-800/20 min-h-[4rem]">
                        <div className="flex items-center justify-between h-full">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {currentLanguage.isWebLanguage ? 'Live Preview' : 'Output'}
                          </h3>
                          <button
                            onClick={handleResetCode}
                            className="p-1.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 transition-all duration-200"
                            title="Reset Code"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="h-[calc(100%-4rem)] overflow-hidden">
                        {currentLanguage.isWebLanguage ? (
                          <iframe
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts"
                            title="Live Preview"
                          />
                        ) : (
                          <div className="h-full p-4 overflow-auto">
                            <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                              {renderOutput(output)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout - Single Panel with Tabs */}
                <div className="lg:hidden h-full relative">
                  {activeView === 'editor' ? (
                    /* Code Editor Panel */
                    <div className="bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden h-full">
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-white/10 dark:bg-gray-800/20">
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
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
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
                    <div className="bg-white/20 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 overflow-hidden h-full">
                      <div className="p-3 border-b border-white/10 dark:border-gray-700/20 bg-white/10 dark:bg-gray-800/20">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {currentLanguage.isWebLanguage ? 'Live Preview' : 'Output'}
                          </h3>
                          <button
                            onClick={handleResetCode}
                            className="p-1.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-300 transition-all duration-200"
                            title="Reset Code"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="h-[calc(100%-3.5rem)] overflow-hidden">
                        {currentLanguage.isWebLanguage ? (
                          <iframe
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts"
                            title="Live Preview"
                          />
                        ) : (
                          <div className="h-full p-4 overflow-auto">
                            <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                              {renderOutput(output)}
                            </pre>
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