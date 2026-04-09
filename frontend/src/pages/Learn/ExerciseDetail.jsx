import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';
import {
  ArrowLeft, BookOpen, Code, Eye, Play, Trophy,
  Clock, RotateCcw, Terminal, ChevronRight, ChevronLeft,
  PanelLeftClose, PanelLeftOpen, Check
} from 'lucide-react';
import { exerciseAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import LoadingScreen from '../../components/LoadingScreen';

const ExerciseDetail = () => {
  const { courseId, exerciseId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isDarkMode = theme === 'dark';
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

  const [activeTab, setActiveTab] = useState('theory');
  const [exercise, setExercise] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // IDE state
  const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'light');
  const [isProblemPanelOpen, setIsProblemPanelOpen] = useState(true);

  // Resizer state
  const [leftWidth, setLeftWidth] = useState(550);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newLeftWidth = e.clientX - containerRect.left;
      newLeftWidth = Math.max(300, Math.min(newLeftWidth, containerRect.width - 400));
      setLeftWidth(newLeftWidth);
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
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
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const transformExerciseData = (backendExercise) => {
    const id = backendExercise._id || backendExercise.exerciseId;
    const topicTitle = backendExercise.topicTitle || 'Code Challenge';
    return {
      id,
      title: backendExercise.question,
      topicTitle,
      difficulty: 'Easy', 
      estimatedTime: '15 min', 
      xp: 10, 
      description: backendExercise.description || '',
      theory: backendExercise.description || 'No additional description provided.',
      starterCode: `// ${backendExercise.question}\n// Write your code here\n\n`,
      expectedOutput: backendExercise.expectedOutput || '',
      exerciseAnswers: backendExercise.exerciseAnswers,
      testCases: []
    };
  };

  const mobileTabs = [
    { id: 'theory', label: 'Problem', icon: BookOpen },
    { id: 'compiler', label: 'Editor', icon: Code },
    { id: 'preview', label: 'Output', icon: Terminal }
  ];

  const getCurrentTabIndex = () => {
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

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goToNextTab();
    else if (distance < -minSwipeDistance) goToPreviousTab();
  };

  useEffect(() => {
    setEditorTheme(theme === 'dark' ? 'vs-dark' : 'light');
  }, [theme]);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const backendExercise = await exerciseAPI.getExercise(courseId, exerciseId);
        const transformedExercise = transformExerciseData(backendExercise);
        setExercise(transformedExercise);
        setUserCode(transformedExercise.starterCode);
      } catch (error) {
        console.error('Error fetching exercise:', error);
        const fallbackExercise = {
          id: exerciseId,
          title: 'Exercise Not Found',
          description: 'Unable to load exercise details.',
          theory: 'Please try again later.',
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

  const detectLanguage = () => {
    const topic = exercise?.topicTitle?.toLowerCase() || '';
    const starter = exercise?.starterCode?.toLowerCase() || '';
    if (topic.includes('python') || starter.includes('python')) return 'python';
    if (topic.includes('java') || starter.includes('java')) return 'java';
    const isStandaloneC = (str) => str.split(/\W+/).some(word => word === 'c');
    if ((isStandaloneC(topic) && !topic.includes('c++')) || (isStandaloneC(starter) && !starter.includes('c++'))) return 'c';
    return 'javascript';
  };

  const runCode = async () => {
    if (!exercise?.id || exercise.id === 'undefined') {
      setOutput('Error: Invalid exercise ID.');
      return;
    }
    setIsRunning(true);
    setOutput('');
    if(window.innerWidth < 768) setActiveTab('preview'); 

    try {
      const language = detectLanguage();
      const codeData = { language, code: userCode, input: '' };
      const result = await exerciseAPI.submitCode(courseId, exercise.id, codeData);

      let formattedOutput = '';
      if (result.stdout) formattedOutput += result.stdout;
      if (result.stderr) formattedOutput += `\nError:\n${result.stderr}`;
      if (result.compile_output) formattedOutput += `\nCompiler output:\n${result.compile_output}`;

      setOutput(formattedOutput.trim() || 'Process finished with exit code 0');
    } catch (error) {
      setOutput(`Error: ${error.message || 'Failed to execute code'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!exercise?.id || exercise.id === 'undefined') return;
    setIsSubmitting(true);
    try {
      const language = detectLanguage();
      const codeData = { language, code: userCode, input: '' };
      const runResult = await exerciseAPI.submitCode(courseId, exercise.id, codeData);

      if (runResult.stderr || runResult.compile_output) {
        alert(`Compilation Error. Please fix your code before submitting.`);
        setIsSubmitting(false);
        return;
      }

      const submitResult = await exerciseAPI.submitExercise(courseId, exercise.id);
      window.dispatchEvent(new CustomEvent('exerciseCompleted', {
        detail: { courseId, exerciseId: exercise.id, xpEarned: submitResult.addedXP || 10 }
      }));
      window.dispatchEvent(new CustomEvent('xpUpdated'));

      navigate(`/learn/exercises/${courseId}`);
    } catch (error) {
      console.error('Error submitting exercise:', error);
      alert('An error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCode = () => {
    setUserCode(exercise?.starterCode || '');
    setOutput('');
  };

  if (loading) return <LoadingScreen showMessage={false} size={48} duration={800} />;

  if (!exercise?.id || exercise.id === 'undefined') {
    return (
      <div className={`flex min-h-screen items-center justify-center font-sans ${isDarkMode ? "dark bg-[#09090b]" : "bg-[#fafafa]"}`}>
        <div className="bg-white dark:bg-[#18181b] p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
          <h2 className="text-xl font-medium mb-2 text-red-500">Invalid Exercise</h2>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">This exercise could not be loaded.</p>
          <button onClick={() => navigate(`/learn/exercises/${courseId}`)} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Return to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full font-sans antialiased selection:bg-blue-500/30 ${isDarkMode ? "dark bg-[#09090b] text-zinc-100" : "bg-[#fafafa] text-zinc-900"}`}>
      
      <style jsx global>{`
        .prose ul { list-style-type: disc; padding-left: 1.5rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
        
        .resizer-bar {
          width: 12px;
          margin: 0 -4px;
          cursor: col-resize;
          position: relative;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resizer-bar::after {
          content: '';
          width: 2px;
          height: 100%;
          background-color: transparent;
          transition: background-color 0.2s;
        }
        .resizer-bar:hover::after, .resizer-bar:active::after {
          background-color: #3b82f6; 
        }
        @media (max-width: 1023px) {
          .resizer-bar { display: none !important; }
        }
      `}</style>

      {/* Main Container - Full width, no sidebar margins */}
      <main className="flex-1 flex flex-col w-full min-w-0 transition-all duration-300 ease-in-out z-10 h-screen">
        
        {/* Top Header */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800/80 z-20">
          
          <div className="flex items-center gap-4 min-w-0">
            {/* Upgraded, prominent Back Button */}
            <button 
              onClick={() => navigate(`/learn/exercises/${courseId}`)} 
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 rounded-md transition-all shrink-0 border border-transparent dark:border-zinc-700/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Exercises</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block shrink-0"></div>
            
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 shrink-0">
                {detectLanguage()}
              </span>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate hidden md:block">
                {exercise.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 mr-2">
              <button 
                onClick={runCode} 
                disabled={isRunning} 
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md transition-all disabled:opacity-50 border border-transparent dark:border-zinc-700/50"
              >
                {isRunning ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Play className="w-3 h-3" />}
                Run
              </button>
              <button 
                onClick={submitCode} 
                disabled={isSubmitting || isRunning} 
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-all disabled:opacity-50 shadow-sm"
              >
                <Check className="w-3 h-3" />
                Submit
              </button>
            </div>

            <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700 hidden sm:block"></div>

            <button onClick={toggleTheme} className="hidden sm:flex p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors rounded-md">
              {isDarkMode ? "Light" : "Dark"}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium border border-blue-700 shadow-sm"
              >
                {userInitial}
              </button>
              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{userName}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email || 'student@techlearn.com'}</div>
                      </div>
                      <div className="p-1">
                        <button onClick={() => { setProfileDropdownOpen(false); navigate('/profile'); }} className="w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">Profile settings</button>
                        <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors">Log out</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* IDE Workspace Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          
          {/* Mobile Tab Navigation */}
          <div className="md:hidden flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] shrink-0">
            {mobileTabs.map((tab) => {
              const isActive = activeTab === tab.id || (activeTab === 'codePreview' && tab.id === 'compiler');
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex-1 flex justify-center items-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${isActive ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-zinc-500 border-transparent hover:text-zinc-900 dark:hover:text-zinc-300'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop Layout (Split Pane) */}
          <div className="hidden md:flex flex-1 w-full min-w-0 overflow-hidden bg-zinc-50 dark:bg-[#0E1117]" ref={containerRef}>
            
            {/* Left Side - Problem Panel */}
            <AnimatePresence initial={false}>
              {isProblemPanelOpen && (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: leftWidth, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  className="flex-none bg-white dark:bg-[#0d1117] border-r border-zinc-200 dark:border-zinc-800/80 overflow-hidden flex flex-col z-10 shadow-sm"
                >
                  <div className="h-10 px-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-[#0d1117]">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <BookOpen className="w-3.5 h-3.5" /> Description
                    </div>
                    <button 
                      onClick={() => setIsProblemPanelOpen(false)}
                      className="p-1.5 -mr-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Collapse Panel"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 leading-tight">
                      {exercise?.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {exercise?.difficulty}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-3.5 h-3.5" /> {exercise?.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <Trophy className="w-3.5 h-3.5" /> {exercise?.xp} XP
                      </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-headings:font-medium prose-headings:text-zinc-900 dark:prose-headings:text-zinc-100 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-100 dark:prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800 prose-li:text-zinc-700 dark:prose-li:text-zinc-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {exercise?.theory}
                      </ReactMarkdown>

                      {exercise?.expectedOutput && (
                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">Expected Output</h3>
                          <div className="bg-zinc-100 dark:bg-[#161b22] rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
                            <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap m-0 bg-transparent p-0 border-0">
                              {exercise.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resizer */}
            {isProblemPanelOpen && <div className="resizer-bar shrink-0" onMouseDown={startDragging} />}
            
            {/* Right Side - Code and Output */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1117] overflow-hidden">
              
              {/* Top - Code Editor */}
              <div className="flex-[3] flex flex-col min-w-0 border-b border-zinc-200 dark:border-zinc-800/80 min-h-[300px]">
                <div className="h-10 px-4 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-[#0d1117] border-b border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-3">
                    {!isProblemPanelOpen && (
                      <button 
                        onClick={() => setIsProblemPanelOpen(true)}
                        className="p-1.5 -ml-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Expand Panel"
                      >
                        <PanelLeftOpen className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <Code className="w-3.5 h-3.5" /> 
                      main.{detectLanguage() === 'python' ? 'py' : detectLanguage() === 'java' ? 'java' : detectLanguage() === 'c' ? 'c' : 'js'}
                    </div>
                  </div>
                  <button onClick={resetCode} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="flex-1 relative min-w-0">
                  <Editor
                    height="100%"
                    defaultLanguage={detectLanguage()}
                    theme={editorTheme}
                    value={userCode}
                    onChange={(value) => setUserCode(value || '')}
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 16 },
                      lineHeight: 1.5,
                      renderLineHighlight: 'all',
                      hideCursorInOverviewRuler: true,
                      overviewRulerBorder: false,
                      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
                    }}
                  />
                </div>
              </div>

              {/* Bottom - Terminal */}
              <div className="flex-[1.5] flex flex-col min-w-0 bg-zinc-50 dark:bg-[#0E1117] min-h-[150px]">
                <div className="h-10 px-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center bg-white dark:bg-[#0d1117] shrink-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Terminal className="w-3.5 h-3.5" /> Output
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed custom-scrollbar text-zinc-800 dark:text-zinc-300">
                  {output ? (
                    <div className="whitespace-pre-wrap">{output}</div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 select-none">
                      Run your code to see results
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Mobile Layout Forms */}
          <div className="md:hidden flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-[#09090b] overflow-hidden">
            {activeTab === 'theory' && (
              <div className="flex-1 overflow-y-auto p-5 bg-white dark:bg-[#09090b]">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  {exercise?.title}
                </h2>
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{exercise?.difficulty}</span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"><Clock className="w-3.5 h-3.5" /> {exercise?.estimatedTime}</div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"><Trophy className="w-3.5 h-3.5" /> {exercise?.xp} XP</div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{exercise?.theory}</ReactMarkdown>
                </div>
              </div>
            )}

            {activeTab === 'compiler' && (
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0d1117]">
                <div className="h-10 px-4 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-[#0d1117] border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 font-mono">main.{detectLanguage() === 'python' ? 'py' : 'js'}</span>
                  <button onClick={resetCode} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"><RotateCcw className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex-1 relative py-2 min-w-0">
                  <Editor
                    height="100%"
                    defaultLanguage={detectLanguage()}
                    theme={editorTheme}
                    value={userCode}
                    onChange={(value) => setUserCode(value || '')}
                    options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-[#0E1117]">
                <div className="h-10 px-4 flex items-center shrink-0 bg-white dark:bg-[#0d1117] border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Terminal</span>
                </div>
                <div className="flex-1 p-4 font-mono text-[13px] text-zinc-800 dark:text-zinc-300 overflow-auto whitespace-pre-wrap">
                  {output || "No output yet."}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default ExerciseDetail;