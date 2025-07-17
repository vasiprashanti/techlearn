import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';
import {
  ArrowLeft, BookOpen, Code, Eye, Play, Trophy,
  Clock, CheckCircle, Copy, RotateCcw, Send,
  FileText, Terminal, Settings, Folder, ChevronRight,
  ChevronDown, Circle, Square, Maximize2, Minimize2,
  MoreHorizontal, Search, GitBranch, Bug, ChevronLeft
} from 'lucide-react';
import { exerciseAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import LoadingScreen from '../../components/LoadingScreen';

const ExerciseDetail = () => {
  const { courseId, exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const codeEditorRef = useRef(null);

  const [activeTab, setActiveTab] = useState('theory');
  const [exercise, setExercise] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // IDE state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [currentFile, setCurrentFile] = useState('main.js');
  const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'light');

  // Helper function to transform backend exercise data to frontend format
  const transformExerciseData = (backendExercise) => {
    return {
      id: backendExercise._id,
      title: backendExercise.question,
      topicTitle: backendExercise.topicTitle,
      difficulty: 'Easy', // Default difficulty
      estimatedTime: '15 min', // Default time
      xp: 10, // Default XP
      description: backendExercise.question,
      realLifeApplication: backendExercise.realLifeApplication,
      theory: `# ${backendExercise.topicTitle}

${backendExercise.question}

## Real-Life Application
${backendExercise.realLifeApplication || 'This exercise helps you practice fundamental programming concepts.'}

## Instructions
Write your code to solve the given problem. Use the provided starter code as a reference.

## Expected Solution
\`\`\`java
${backendExercise.exerciseAnswers}
\`\`\``,
      starterCode: `// ${backendExercise.question}
// Real-life application: ${backendExercise.realLifeApplication || 'Practice programming concepts'}

// Write your code here

`,
      expectedOutput: '', // Will be determined by code execution
      exerciseAnswers: backendExercise.exerciseAnswers,
      testCases: []
    };
  };

  // Desktop tabs (combined compiler + preview)
  const desktopTabs = [
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'codePreview', label: 'Code & Preview', icon: Code }
  ];

  // Mobile tabs (separate tabs)
  const mobileTabs = [
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'compiler', label: 'Compiler', icon: Code },
    { id: 'preview', label: 'Live Preview', icon: Eye }
  ];

  // Navigation functions for mobile slide
  const getCurrentTabIndex = () => {
    // Handle codePreview state for mobile navigation
    const tabId = activeTab === 'codePreview' ? 'compiler' : activeTab;
    return mobileTabs.findIndex(tab => tab.id === tabId);
  };

  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : mobileTabs.length - 1;
    setActiveTab(mobileTabs[previousIndex].id);
  };

  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    const nextIndex = currentIndex < mobileTabs.length - 1 ? currentIndex + 1 : 0;
    setActiveTab(mobileTabs[nextIndex].id);
  };

  // Touch/swipe functionality for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextTab();
    } else if (isRightSwipe) {
      goToPreviousTab();
    }
  };

  // Update editor theme when app theme changes
  useEffect(() => {
    setEditorTheme(theme === 'dark' ? 'vs-dark' : 'light');
  }, [theme]);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        // Fetch exercise from backend
        const backendExercise = await exerciseAPI.getExercise(courseId, exerciseId);
        const transformedExercise = transformExerciseData(backendExercise);
        setExercise(transformedExercise);
        setUserCode(transformedExercise.starterCode);
      } catch (error) {
        console.error('Error fetching exercise:', error);
        // Fallback data
        const fallbackExercise = {
          id: exerciseId,
          title: 'Exercise Not Found',
          description: 'Unable to load exercise details.',
          theory: '# Exercise Not Found\n\nPlease try again later.',
          starterCode: '// Exercise not found\n',
          expectedOutput: '',
          difficulty: 'Easy',
          estimatedTime: '15 min',
          xp: 10
        };
        setExercise(fallbackExercise);
        setUserCode(fallbackExercise.starterCode);
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [courseId, exerciseId]);

  // Disable copy-paste in code editor
  const handleKeyDown = (e) => {
    // Disable Ctrl+C, Ctrl+V, Ctrl+A
    if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
      e.preventDefault();
      return false;
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');

    try {
      // Determine language based on exercise topic
      const language = exercise.topicTitle.toLowerCase().includes('java') ? 'java' : 'python';

      // Send code to backend for execution
      const codeData = {
        language,
        code: userCode,
        input: ''
      };

      const result = await exerciseAPI.submitCode(courseId, exerciseId, codeData);

      // Format output
      let formattedOutput = '';
      if (result.stdout) formattedOutput += result.stdout;
      if (result.stderr) formattedOutput += `Error: ${result.stderr}`;
      if (result.compile_output) formattedOutput += `Compiler output: ${result.compile_output}`;

      setOutput(formattedOutput || 'Code executed successfully');
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(`Error: ${error.message || 'Failed to execute code'}`);
    } finally {
      setTimeout(() => setIsRunning(false), 1000);
    }
  };

  const submitCode = async () => {
    setIsSubmitting(true);

    try {
      // First, test the code by running it
      const language = exercise.topicTitle.toLowerCase().includes('java') ? 'java' : 'python';

      const codeData = {
        language,
        code: userCode,
        input: ''
      };

      const runResult = await exerciseAPI.submitCode(courseId, exerciseId, codeData);

      // Check if code executed successfully
      if (runResult.stderr || runResult.compile_output) {
        alert(`Code Error: ${runResult.stderr || runResult.compile_output}\nPlease fix your code before submitting.`);
        setIsSubmitting(false);
        return;
      }

      // Submit the exercise for XP
      const submitResult = await exerciseAPI.submitExercise(courseId, exerciseId);

      // Dispatch events to update UI components
      window.dispatchEvent(new CustomEvent('exerciseCompleted', {
        detail: { courseId, exerciseId, xpEarned: submitResult.addedXP || 10 }
      }));
      window.dispatchEvent(new CustomEvent('xpUpdated'));

      // Show success message
      alert(`Exercise submitted successfully! +${submitResult.addedXP || 10} XP earned`);

      // Navigate back to exercises list
      setTimeout(() => {
        navigate(`/learn/exercises/${courseId}`);
      }, 1500);

    } catch (error) {
      console.error('Error submitting exercise:', error);
      alert(`Error: ${error.message || 'An error occurred while submitting. Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCode = () => {
    setUserCode(exercise?.starterCode || '');
    setOutput('');
  };

  if (loading) {
    return (
      <LoadingScreen
        showMessage={false}
        size={48}
        duration={800}
      />
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        /* Custom scrollbar for mobile and desktop */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }

        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 rgba(0, 0, 0, 0.1);
        }

        /* Mobile specific adjustments */
        @media (max-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
            height: 2px;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          onClick={() => navigate(`/learn/exercises/${courseId}`)}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Exercises</span>
        </motion.button>

        {/* Exercise Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/20 mb-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-poppins text-2xl md:text-3xl font-medium brand-heading-primary mb-2 tracking-wider">
                {exercise?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {exercise?.description}
              </p>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium">
                  {exercise?.difficulty}
                </span>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{exercise?.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Trophy className="w-4 h-4" />
                  <span>{exercise?.xp} XP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          {/* Desktop Tab Navigation */}
          <div className="hidden md:flex gap-2">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = (tab.id === 'theory' && activeTab === 'theory') ||
                             (tab.id === 'codePreview' && (activeTab === 'compiler' || activeTab === 'preview' || activeTab === 'codePreview'));
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id === 'codePreview' ? 'codePreview' : tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/50'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-white/20 dark:border-gray-700/20'
                  } backdrop-blur-xl`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Tab Navigation with Slide Controls */}
          <div className="md:hidden">
            {/* Current Tab Display with Navigation Arrows */}
            <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/20 p-4">
              <button
                onClick={goToPreviousTab}
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                {(() => {
                  // Handle codePreview state for mobile (fallback to compiler)
                  const tabId = activeTab === 'codePreview' ? 'compiler' : activeTab;
                  const currentTab = mobileTabs.find(tab => tab.id === tabId);
                  if (!currentTab) return null;
                  const Icon = currentTab.icon;
                  return (
                    <>
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currentTab.label}
                      </span>
                    </>
                  );
                })()}
              </div>

              <button
                onClick={goToNextTab}
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Indicator Dots */}
            <div className="flex justify-center gap-2 mt-3">
              {mobileTabs.map((tab, index) => {
                // Handle codePreview state for active indicator
                const isActive = activeTab === tab.id || (activeTab === 'codePreview' && tab.id === 'compiler');
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-blue-600 dark:bg-blue-400 w-6'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                  />
                );
              })}
            </div>

            {/* Swipe Hint */}
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Swipe left or right to navigate tabs
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Theory Tab */}
          {activeTab === 'theory' && (
            <div className="p-8 h-[700px] overflow-auto custom-scrollbar">
              <div className="markdown-content bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-blue-600 dark:prose-headings:text-blue-400 prose-code:text-emerald-600 dark:prose-code:text-emerald-400 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre: ({children}) => <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto my-4">{children}</pre>,
                      code: ({node, inline, className, children, ...props}) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({children}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">{children}</ol>,
                      li: ({children}) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
                    }}
                  >
                    {exercise?.theory}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Combined Code & Preview Tab (Desktop Only) */}
          {activeTab === 'codePreview' && (
            <div className="h-[700px] flex gap-4 p-4">
              {/* Left Side - Code Editor (50%) */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Code Editor Header */}
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="font-medium">Code Editor</span>
                  </div>
                  <button
                    onClick={resetCode}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Monaco Editor */}
                <div className="h-[calc(100%-7rem)] relative overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme={editorTheme}
                    value={userCode}
                    onChange={(value) => setUserCode(value || '')}
                    options={{
                      fontSize: 14,
                      fontFamily: 'Fira Code, Monaco, Consolas, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      overviewRulerLanes: 0,
                      hideCursorInOverviewRuler: true,
                      renderLineHighlight: 'all',
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      contextmenu: false,
                      copyWithSyntaxHighlighting: false,
                      // Enable proper scrolling
                      scrollbar: {
                        vertical: 'visible',
                        horizontal: 'visible',
                        useShadows: false,
                        verticalHasArrows: true,
                        horizontalHasArrows: true,
                        verticalScrollbarSize: 14,
                        horizontalScrollbarSize: 14,
                        alwaysConsumeMouseWheel: false
                      },
                      // Enable mouse wheel scrolling
                      mouseWheelScrollSensitivity: 1,
                      fastScrollSensitivity: 5,
                      // Disable all IntelliSense and suggestions
                      quickSuggestions: false,
                      suggestOnTriggerCharacters: false,
                      acceptSuggestionOnEnter: 'off',
                      tabCompletion: 'off',
                      wordBasedSuggestions: false,
                      parameterHints: { enabled: false },
                      autoClosingBrackets: 'never',
                      autoClosingQuotes: 'never',
                      autoSurround: 'never',
                      snippetSuggestions: 'none',
                      suggest: {
                        showKeywords: false,
                        showSnippets: false,
                        showClasses: false,
                        showFunctions: false,
                        showVariables: false,
                        showModules: false,
                        showProperties: false,
                        showEvents: false,
                        showOperators: false,
                        showUnits: false,
                        showValues: false,
                        showConstants: false,
                        showEnums: false,
                        showEnumMembers: false,
                        showColors: false,
                        showFiles: false,
                        showReferences: false,
                        showFolders: false,
                        showTypeParameters: false,
                        showIssues: false,
                        showUsers: false,
                        showWords: false
                      },
                      hover: { enabled: false },
                      lightbulb: { enabled: false },
                      find: {
                        addExtraSpaceOnTop: false,
                        autoFindInSelection: 'never',
                        seedSearchStringFromSelection: 'never'
                      }
                    }}
                    onMount={(editor, monaco) => {
                      // Disable copy-paste and other shortcuts
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {});
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {});
                      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {});

                      // Disable all language features
                      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                        noLib: true,
                        allowNonTsExtensions: true
                      });

                      // Clear all language providers
                      monaco.languages.registerCompletionItemProvider('javascript', {
                        provideCompletionItems: () => ({ suggestions: [] })
                      });
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex gap-3">
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                  <button
                    onClick={submitCode}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>

              {/* Right Side - Live Preview (50%) */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Output Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium">Output</span>
                </div>

                {/* Output Content */}
                <div className="h-[calc(100%-3.5rem)] overflow-hidden">
                  <div className="h-full p-4 overflow-auto custom-scrollbar">
                    {output ? (
                      <>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Output:
                          </h4>
                          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto">
                            {output}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Expected Output:
                          </h4>
                          <pre className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto border border-green-200 dark:border-green-700">
                            {exercise?.expectedOutput}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Eye className="w-16 h-16 text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Live Preview
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Run your code to see the output here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compiler Tab - Premium Code Editor */}
          {activeTab === 'compiler' && (
            <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Code Editor Header */}
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Code Editor</span>
                </div>
                <button
                  onClick={resetCode}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="h-[calc(100%-7rem)] relative overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme={editorTheme}
                  value={userCode}
                  onChange={(value) => setUserCode(value || '')}
                  options={{
                    fontSize: 14,
                    fontFamily: 'Fira Code, Monaco, Consolas, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: 'all',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    contextmenu: false,
                    copyWithSyntaxHighlighting: false,
                    // Enable proper scrolling
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      useShadows: false,
                      verticalHasArrows: true,
                      horizontalHasArrows: true,
                      verticalScrollbarSize: 14,
                      horizontalScrollbarSize: 14,
                      alwaysConsumeMouseWheel: false
                    },
                    // Enable mouse wheel scrolling
                    mouseWheelScrollSensitivity: 1,
                    fastScrollSensitivity: 5,
                    // Disable all IntelliSense and suggestions
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    acceptSuggestionOnEnter: 'off',
                    tabCompletion: 'off',
                    wordBasedSuggestions: false,
                    parameterHints: { enabled: false },
                    autoClosingBrackets: 'never',
                    autoClosingQuotes: 'never',
                    autoSurround: 'never',
                    snippetSuggestions: 'none',
                    suggest: {
                      showKeywords: false,
                      showSnippets: false,
                      showClasses: false,
                      showFunctions: false,
                      showVariables: false,
                      showModules: false,
                      showProperties: false,
                      showEvents: false,
                      showOperators: false,
                      showUnits: false,
                      showValues: false,
                      showConstants: false,
                      showEnums: false,
                      showEnumMembers: false,
                      showColors: false,
                      showFiles: false,
                      showReferences: false,
                      showFolders: false,
                      showTypeParameters: false,
                      showIssues: false,
                      showUsers: false,
                      showWords: false
                    },
                    hover: { enabled: false },
                    lightbulb: { enabled: false },
                    find: {
                      addExtraSpaceOnTop: false,
                      autoFindInSelection: 'never',
                      seedSearchStringFromSelection: 'never'
                    }
                  }}
                  onMount={(editor, monaco) => {
                    // Disable copy-paste and other shortcuts
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {});
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {});
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {});

                    // Disable all language features
                    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                      noLib: true,
                      allowNonTsExtensions: true
                    });

                    // Clear all language providers
                    monaco.languages.registerCompletionItemProvider('javascript', {
                      provideCompletionItems: () => ({ suggestions: [] })
                    });
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex gap-3">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={submitCode}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}

          {/* Live Preview Tab - Output Display */}
          {activeTab === 'preview' && (
            <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Output Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                <Terminal className="w-4 h-4" />
                <span className="font-medium">Output</span>
              </div>

              {/* Terminal Output */}
              <div className="h-[calc(100%-3.5rem)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm">
                <div className="p-4 h-full overflow-auto custom-scrollbar">
                  {output ? (
                    <>
                      <div className="text-green-600 dark:text-green-400 mb-2">$ node main.js</div>
                      <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {output}
                      </div>
                      {exercise?.expectedOutput && (
                        <div className="mt-4 pt-2 border-t border-gray-300 dark:border-gray-700">
                          <div className="text-gray-600 dark:text-gray-400 text-xs mb-1">Expected Output:</div>
                          <div className="text-yellow-600 dark:text-yellow-400">{exercise.expectedOutput}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Eye className="w-16 h-16 text-gray-500 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Live Preview
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Run your code in the Compiler tab to see the output here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ExerciseDetail;
