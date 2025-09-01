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

  // Resizer state (for desktop split)
  const [leftWidth, setLeftWidth] = useState(380);
  const resizerRef = useRef(null);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newLeftWidth = e.clientX - containerRect.left;
      // Clamp min/max width
      newLeftWidth = Math.max(220, Math.min(newLeftWidth, containerRect.width - 320));
      setLeftWidth(newLeftWidth);
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startDragging = (e) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  // Helper function to transform backend exercise data to frontend format
  const transformExerciseData = (backendExercise) => {
    const id = backendExercise._id || backendExercise.exerciseId;
    const topicTitle = backendExercise.topicTitle || 'Exercise';
  return {
      id,
      title: backendExercise.question,
      topicTitle,
      difficulty: 'Easy', // Default difficulty
      estimatedTime: '15 min', // Default time
      xp: 10, // Default XP
      description: backendExercise.question,
      theory: `# ${topicTitle}\n\n${backendExercise.question}`,
      starterCode: `// ${backendExercise.question}\n// Write your code here\n\n`,
      expectedOutput: backendExercise.expectedOutput || '',
      exerciseAnswers: backendExercise.exerciseAnswers,
      testCases: []
    };
    return {
      id,
      title: backendExercise.question,
      topicTitle,
      difficulty: 'Easy', // Default difficulty
      estimatedTime: '15 min', // Default time
      xp: 10, // Default XP
      description: backendExercise.question,
      theory: `# ${topicTitle}\n\n${backendExercise.question}`,
      starterCode: `// ${backendExercise.question}\n// Write your code here\n\n`,
      expectedOutput: backendExercise.expectedOutput || '',
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

  const detectLanguage = () => {
    // Only allow 'python', 'java', or 'c' (Judge0/backend supported)
    const topic = exercise?.topicTitle?.toLowerCase() || '';
    const starter = exercise?.starterCode?.toLowerCase() || '';
    if (topic.includes('python') || starter.includes('python')) return 'python';
    if (topic.includes('java') || starter.includes('java')) return 'java';
    // Only match 'c' if it is a standalone word (not part of 'python', etc.)
    const isStandaloneC = (str) => {
      return str.split(/\W+/).some(word => word === 'c');
    };
    if ((isStandaloneC(topic) && !topic.includes('c++')) || (isStandaloneC(starter) && !starter.includes('c++'))) return 'c';
    // Fallback to python if nothing matches
    return 'python';
  };

  const runCode = async () => {
    if (!exercise?.id || exercise.id === 'undefined') {
      setOutput('Error: Invalid exercise ID. Please refresh the page or return to the exercise list.');
      return;
    }
    setIsRunning(true);
    setOutput('');

    try {
      // Determine language based on topicTitle and starterCode
      const language = detectLanguage();

      // Send code to backend for execution
      const codeData = {
        language,
        code: userCode,
        input: ''
      };

      // Always use exercise.id for API call
      const result = await exerciseAPI.submitCode(courseId, exercise.id, codeData);

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
    if (!exercise?.id || exercise.id === 'undefined') {
      alert('Error: Invalid exercise ID. Please refresh the page or return to the exercise list.');
      return;
    }
    setIsSubmitting(true);

    try {
      // First, test the code by running it
      const language = detectLanguage();

      const codeData = {
        language,
        code: userCode,
        input: ''
      };

      // Always use exercise.id for API call
      const runResult = await exerciseAPI.submitCode(courseId, exercise.id, codeData);

      // Check if code executed successfully
      if (runResult.stderr || runResult.compile_output) {
        alert(`Code Error: ${runResult.stderr || runResult.compile_output}\nPlease fix your code before submitting.`);
        setIsSubmitting(false);
        return;
      }

      // Submit the exercise for XP
      const submitResult = await exerciseAPI.submitExercise(courseId, exercise.id);

      // Dispatch events to update UI components
      window.dispatchEvent(new CustomEvent('exerciseCompleted', {
        detail: { courseId, exerciseId: exercise.id, xpEarned: submitResult.addedXP || 10 }
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

  // Show error if exercise id is missing or invalid
  if (!exercise?.id || exercise.id === 'undefined') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid Exercise</h2>
          <p className="mb-4">This exercise could not be loaded or has an invalid ID.<br/>Please return to the exercise list and try again.</p>
          <button
            onClick={() => navigate(`/learn/exercises/${courseId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Exercises
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128]">
      {/* Custom Scrollbar Styles and Resizer Styles */}
      <style jsx>{`
        /* ...existing code... */
        .resizer-bar {
          width: 8px;
          cursor: col-resize;
          background: linear-gradient(to bottom, #e0e7ef 60%, #bceaff 100%);
          border-radius: 4px;
          transition: background 0.2s;
          z-index: 10;
        }
        .resizer-bar:hover, .resizer-bar.active {
          background: #3b82f6;
        }
        @media (max-width: 1023px) {
          .desktop-split {
            flex-direction: column !important;
          }
          .resizer-bar {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full px-4">
        {/* Breadcrumbs */}
                <motion.nav
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-center gap-2 mb-6 ml-4 text-sm text-gray-600 dark:text-gray-400"
                >
                  <button
                    onClick={() => navigate('/learn')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    Learn
                  </button>
                  <span>/</span>
                  <button
                    onClick={() => navigate('/learn/exercises')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                  >
                    Exercises
                  </button>
                  <span>/</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {exercise.title || 'Course'}
                  </span>
                </motion.nav>

        {/* Tab Navigation - for Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
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
          className="w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >

          {/* Desktop Layout */}
          <div className="hidden md:block">
            <div className="max-h-[1500px] flex gap-2 p-2">
              
              {/* Left Side - Theory area */}
              <div className="flex-none w-[50%] h-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <h1 className="font-poppins text-2xl md:text-2xl font-medium brand-heading-primary p-4 mb-2 tracking-wider">
                {exercise?.title}
              </h1>
              {/* <p className="text-gray-600 dark:text-gray-400 mb-4">
                {exercise?.description}
              </p> */}
              <div className="flex items-center gap-4 mt-2 mb-6 px-4">
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
                
                {/* Theory Content */}
                <div className="h-[calc(100%-3.5rem)] overflow-auto p-4">
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
                    {/* Show expected solution if present */}
                    {exercise?.expectedOutput && (
                      <div className="mt-6">
                        <h2 className="text-blue-600 dark:text-blue-400 text-xl font-bold mb-2">Expected Solution</h2>
                        <div className="bg-white/50 dark:bg-[#232b39] rounded-xl overflow-hidden shadow-lg border border-gray-700">
                          <pre className="p-5 text-sm font-mono text-black/50 dark:text-gray-100 whitespace-pre-wrap overflow-auto" style={{background: 'none'}}>
                            {exercise.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Side - Compiler and Preview */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Top Right - Code Editor */}
                <div className="flex-none h-[50%] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Code Editor Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      <span className="font-small">Code Editor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                      >
                        {isRunning ? 'Running...' : 'Run Code'}
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="h-[calc(100%-3.5rem)] relative overflow-hidden">
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
                </div>

                {/* Bottom Right - Live Preview (30% height) */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Output Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <span className="font-medium">Output</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetCode}
                        className="flex items-center gap-2 px-3 py-1.5 text-white hover:text-gray-200 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Output Content */}
                  <div className="h-[calc(100%-3.5rem)] overflow-hidden">
                    <div className="h-full p-4 overflow-auto custom-scrollbar">
                      {output ? (
                        <>
                          <div className="mb-4">
                            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto">
                              {output}
                            </pre>
                          </div>
                          <div>
                            <pre className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-auto border border-green-200 dark:border-green-700">
                              {exercise?.expectedOutput}
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Output
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
            </div>
          </div>

          {/* Mobile Layout - Show different tabs based on activeTab */}
          <div className="md:hidden">
            {/* Theory Tab */}
            {activeTab === 'theory' && (
              <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <h1 className="font-poppins text-2xl md:text-2xl font-medium brand-heading-primary p-4 mb-2 tracking-wider">
                  {exercise?.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 mb-6 px-4">
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
                
                <div className="h-[calc(100%-3.5rem)] overflow-auto p-4">
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
                    {exercise?.expectedOutput && (
                      <div className="mt-6">
                        <h2 className="text-blue-600 dark:text-blue-400 text-xl font-bold mb-2">Expected Solution</h2>
                        <div className="bg-white/50 dark:bg-[#232b39] rounded-xl overflow-hidden shadow-lg border border-gray-700">
                          <pre className="p-5 text-sm font-mono text-black/50 dark:text-gray-100 whitespace-pre-wrap overflow-auto" style={{background: 'none'}}>
                            {exercise.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Compiler Tab - Premium Code Editor */}
            {activeTab === 'compiler' && (
              <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Code Editor Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="font-medium">Code Editor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={runCode}
                      disabled={isRunning}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      {isRunning ? 'Running...' : 'Run Code'}
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
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

                {/* Action Buttons - Removed Submit and Run Code buttons */}
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex gap-3">
                  {/* Run Code button moved to header, Submit button removed as backend is not connected */}
                </div>
              </div>
            )}

            {/* Live Preview Tab - Output Display */}
            {activeTab === 'preview' && (
              <div className="h-[700px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Output Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <span className="font-medium">Output</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetCode}
                      className="flex items-center gap-2 px-3 py-1.5 text-white hover:text-gray-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Terminal Output */}
                <div className="h-[calc(100%-3.5rem)] bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm">
                  <div className="p-4 h-full overflow-auto custom-scrollbar">
                    {output ? (
                      <>
                        <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                          {output}
                        </div>
                        {exercise?.expectedOutput && (
                          <div className="mt-4 pt-2 border-t border-gray-300 dark:border-gray-700">
                            <div className="text-yellow-600 dark:text-yellow-400">{exercise.expectedOutput}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Output
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Run your code to see the output here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExerciseDetail;
