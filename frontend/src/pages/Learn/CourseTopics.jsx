import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, AlertCircle } from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';

const CourseTopics = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [courseSidebarCollapsed, setCourseSidebarCollapsed] = useState(false);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState(0);
  
  // Ref for the scrollable container
  const scrollContainerRef = useRef(null);

  const [backendCourse, setBackendCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getCourse(courseId);
        const courseData = response.course || response;
        setBackendCourse(courseData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setBackendCourse(null);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId]);

  const currentCourse = (() => {
    if (backendCourse && backendCourse.topics) {
      return {
        title: backendCourse.title,
        description: `Master ${backendCourse.title} fundamentals.`,
        topics: backendCourse.topics.map((topic, index) => {
          const topicId = topic._id || topic.topicId || topic.id || `topic_${index}`;
          const cleanTitle = (topic.title || '').replace(/^CORE\s+(\w+)\s+NOTES\s*[-–]\s*\d+$/i, '$1').replace(/^\d+\.\s*/, '').replace(/\s*[-–]\s*\d+$/, '');

          return {
            id: topicId,
            title: cleanTitle,
            description: `Learn about ${cleanTitle} chapter concepts and applications.`,
            completed: false,
            hasNotes: !!topic.notesId,
            notesContent: topic.notes,
            content: { theory: topic.notes || `Theory content for ${cleanTitle}.` }
          };
        })
      };
    }
    return null;
  })();

  const currentTopic = currentCourse?.topics[selectedTopic];
  const totalTopics = currentCourse?.topics?.length || 0;
  const isFirstTopic = selectedTopic === 0;
  const isLastTopic = selectedTopic === totalTopics - 1;
  const courseSidebarWidthClass = courseSidebarCollapsed ? "md:w-20" : "md:w-72";

  // Auto-scroll instantly to the top when navigating between topics
  useEffect(() => { 
    if (scrollContainerRef.current) {
      // Direct DOM manipulation ensures it snaps instantly without weird transition glitches
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedTopic]);

  if (loading) return <><ScrollProgress /><LoadingScreen showMessage={false} size={48} duration={800} /></>;

  if (error || !currentCourse) {
    return (
      <div className={`flex min-h-full w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-12 rounded-3xl shadow-sm">
            <h1 className="text-xl font-medium tracking-tight text-black dark:text-white mb-4">{error ? 'Error Loading' : 'Course Not Found'}</h1>
            <button onClick={() => navigate('/learn')} className="text-[10px] uppercase tracking-widest font-semibold text-[#3C83F6] hover:underline">
              Back to Learn
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cleanHeadingText = (children) => {
    if (typeof children === 'string') return children.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '');
    if (Array.isArray(children)) return children.map(child => typeof child === 'string' ? child.replace(/^\d+\.\s*/, '').replace(/\s*-\s*\d+$/, '').replace(/\s*–\s*\d+$/, '') : child);
    return children;
  };

  // Re-mapped Markdown Hierarchy: Markdown H1s and H2s are gracefully styled so they don't fight the Page Title
  const markdownComponents = {
    h1: ({children}) => <h2 className="text-2xl md:text-3xl font-medium text-black dark:text-white mt-12 mb-6 tracking-tight">{cleanHeadingText(children)}</h2>,
    h2: ({children}) => <h3 className="text-xl md:text-2xl font-medium text-black dark:text-white mt-10 mb-4 tracking-tight">{cleanHeadingText(children)}</h3>,
    h3: ({children}) => <h4 className="text-lg font-medium text-black/90 dark:text-white/90 mt-8 mb-4">{cleanHeadingText(children)}</h4>,
    h4: ({children}) => <h5 className="text-[13px] font-bold text-black/60 dark:text-white/60 mt-6 mb-3 uppercase tracking-widest">{cleanHeadingText(children)}</h5>,
    p: ({children}) => <p className="text-black/75 dark:text-white/75 leading-[1.8] text-base md:text-lg mb-6 font-light">{children}</p>,
    strong: ({children}) => <strong className="font-medium text-black dark:text-white">{children}</strong>,
    a: ({children, href}) => <a href={href} className="text-[#3C83F6] hover:underline decoration-2 underline-offset-4 transition-all">{children}</a>,
    blockquote: ({children}) => (
      <blockquote className="my-8 pl-6 py-2 border-l-4 border-[#3C83F6] bg-gradient-to-r from-[#3C83F6]/5 to-transparent rounded-r-2xl">
        <div className="text-black/60 dark:text-white/60 italic text-lg">{children}</div>
      </blockquote>
    ),
    ul: ({children}) => <ul className="flex flex-col gap-3 my-8">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal list-outside ml-6 flex flex-col gap-3 my-8 text-black/75 dark:text-white/75 text-base md:text-lg font-light">{children}</ol>,
    li: ({children}) => (
      <li className="flex items-start gap-4 text-base md:text-lg text-black/75 dark:text-white/75 font-light">
        <div className="w-1.5 h-1.5 rounded-full bg-[#3C83F6] dark:bg-white/50 mt-[0.6rem] shrink-0 shadow-sm" />
        <span className="flex-1">{children}</span>
      </li>
    ),
    code: ({inline, className, children, ...props}) => {
      if (inline) return <code className="bg-[#3C83F6]/10 dark:bg-white/10 text-[#3C83F6] dark:text-blue-200 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-[#3C83F6]/20 dark:border-white/10" {...props}>{children}</code>;
      return <code className={className} {...props}>{children}</code>;
    },
    pre: ({children}) => (
      <div className="my-10 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#3C83F6]/20 to-[#2563eb]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
        <pre className="relative bg-[#0a1128] dark:bg-black/80 border border-black/10 dark:border-white/10 rounded-2xl p-6 md:p-8 overflow-x-auto text-[13px] leading-relaxed font-mono text-slate-300 shadow-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </pre>
      </div>
    ),
  };

  return (
    <div className={`flex min-h-full w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      <main className="flex-1 flex flex-col transition-all duration-700 ease-in-out z-10 h-screen overflow-hidden pt-20 md:pt-24">
        
        {/* Top Header */}
        <header className="flex-shrink-0 flex items-center justify-between pt-4 pb-4 px-6 md:px-12">
          <div className="flex flex-col items-start gap-3">
            <button 
                onClick={() => navigate('/learn')} 
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-[#4d6f9c] hover:text-[#2d7fe8] dark:text-[#7fb9e6] dark:hover:text-[#96ddff] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Learn</span>
            </button>
            <div>
              <h1 className="brand-heading-primary font-poppins text-2xl md:text-3xl font-medium tracking-tight leading-none">
                Course Player.
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-[#4d6f9c] dark:text-[#7fb9e6] mt-1 line-clamp-1 font-semibold">
                {currentCourse.title} Chapters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 relative z-50">
            <button 
              onClick={() => setIsSyllabusOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#3C83F6] dark:text-white" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-black/70 dark:text-white/70 font-semibold">Chapters</span>
            </button>
          </div>
        </header>

        <aside
          className={`hidden md:flex fixed z-30 left-0 top-[112px] h-[calc(100vh-112px)] flex-col border-r border-black/5 dark:border-white/5 bg-white/30 dark:bg-black/25 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all duration-500 ease-out ${courseSidebarWidthClass}`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-black/5 dark:border-white/5">
            <div className={`${courseSidebarCollapsed ? "hidden" : "block"} min-w-0`}>
              <span className="block text-sm uppercase tracking-[0.18em] font-semibold text-black/55 dark:text-white/80">
                Chapters
              </span>
              <span className="block mt-1 text-xs font-medium text-black/55 dark:text-white/60">
                {totalTopics} chapters
              </span>
            </div>
            <button
              onClick={() => setCourseSidebarCollapsed((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 text-black/55 dark:text-white/70 transition-all hover:bg-white hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
              aria-label={courseSidebarCollapsed ? "Expand course topics sidebar" : "Collapse course topics sidebar"}
            >
              {courseSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-2">
              {currentCourse.topics.map((topic, index) => {
                const isActive = selectedTopic === index;

                return (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(index)}
                    className={`group flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm tracking-wide transition-all duration-300 ease-out ${
                      isActive
                        ? "border-white/30 bg-white text-[#020b23] shadow-lg dark:border-white/10 dark:bg-[#1a2b6d] dark:text-white"
                        : "border-transparent text-[#020b23]/50 hover:border-[#3C83F6]/20 hover:bg-white/95 hover:text-[#020b23] dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-[#1a2b6d]/95 dark:hover:text-white"
                    } ${courseSidebarCollapsed ? "justify-center px-2" : ""}`}
                    title={courseSidebarCollapsed ? topic.title : undefined}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold transition-colors ${
                        isActive
                          ? "border border-black/10 bg-white text-[#020b23] shadow-md dark:border-white/10 dark:bg-black/30 dark:text-white"
                          : "border border-black/10 bg-white text-black/65 dark:border-white/10 dark:bg-black/30 dark:text-white/75"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {!courseSidebarCollapsed && (
                      <div className="min-w-0 flex-1 self-center">
                        <span className="block text-[9px] uppercase tracking-[0.16em] font-semibold text-black/35 dark:text-white/45 leading-none">
                          Chapter {index + 1}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-tight line-clamp-2">
                          {topic.title}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Syllabus Drawer */}
        <AnimatePresence>
          {isSyllabusOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={() => setIsSyllabusOpen(false)} 
                className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-40" 
              />
              <motion.div 
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-white/95 dark:bg-[#0a1128]/95 backdrop-blur-3xl border-l border-black/10 dark:border-white/10 z-50 flex flex-col shadow-2xl md:hidden"
              >
                <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#3C83F6] dark:text-white font-semibold block">Chapter List</span>
                    <span className="text-xs font-medium text-black/50 dark:text-white/50">{totalTopics} Chapters Total</span>
                  </div>
                  <button onClick={() => setIsSyllabusOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <PanelLeftClose className="w-4 h-4 text-black/60 dark:text-white/60" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {currentCourse.topics.map((topic, index) => (
                     <button 
                      key={topic.id} 
                      onClick={() => { setSelectedTopic(index); setIsSyllabusOpen(false); }} 
                      className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${selectedTopic === index ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/5 dark:border-white/5 shadow-sm' : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'}`}
                     >
                       <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-medium transition-colors ${selectedTopic === index ? 'bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black shadow-md' : 'bg-white dark:bg-black/50 border border-black/10 dark:border-white/10'}`}>
                         {index + 1}
                       </div>
                       <span className="text-sm font-medium line-clamp-2 pr-4 leading-relaxed">{topic.title}</span>
                     </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Scroll Area - Attached ref here for auto-scroll */}
        <div 
          ref={scrollContainerRef} 
          className={`flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-10 relative transition-all duration-500 ease-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
            courseSidebarCollapsed ? "md:pl-28" : "md:pl-80"
          }`}
        >
          <div className="max-w-[800px] mx-auto pb-20">

            {/* Reading Container Card */}
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-[2rem] p-8 md:p-12 lg:p-16 shadow-sm min-h-[60vh]">
              
              {/* Premium Heading Section */}
              <div className="mb-8 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#3C83F6]/10 dark:bg-white/5 rounded-full mb-6 border border-[#3C83F6]/20 dark:border-white/10">
                  <div className="w-2 h-2 rounded-full bg-[#3C83F6] dark:bg-white animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-widest text-[#3C83F6] dark:text-white font-bold">
                    Chapters
                  </span>
                </div>
                
                {/* Swapped out useInViewport for a Framer Motion component tied to a key.
                  This forces React to completely unmount and re-animate the title whenever the selectedTopic changes.
                */}
                <motion.h1 
                  key={selectedTopic}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-3xl md:text-4xl lg:text-5xl font-medium text-black dark:text-white tracking-tight leading-[1.2]"
                >
                  {currentTopic?.title}
                </motion.h1>
              </div>

              {/* Dynamic Content - Added CSS rules to strictly strip top margin from the very first Markdown element */}
              {currentTopic?.hasNotes && currentTopic?.notesContent ? (
                <div className="w-full [&>*:first-child]:mt-0 [&>*:first-child>*:first-child]:mt-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                    {currentTopic.notesContent}
                  </ReactMarkdown>
                </div>
              ) : currentTopic?.hasNotes ? (
                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/20 dark:border-white/5">
                    <AlertCircle className="w-8 h-8 text-black/30 dark:text-white/30" />
                  </div>
                  <h3 className="text-lg font-medium text-black dark:text-white mb-2">Notes are being compiled</h3>
                  <p className="text-sm text-black/50 dark:text-white/50 max-w-sm">The curriculum team is currently writing the detailed reading material for this topic.</p>
                </div>
              ) : (
                <div className="text-black/75 dark:text-white/75 leading-[1.8] font-light text-lg whitespace-pre-line">
                  {currentTopic?.content.theory}
                </div>
              )}
            </div>

            {/* Premium Navigation Footer */}
            <div className="flex items-center justify-between mt-8 bg-white/70 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/5 p-4 rounded-[1.5rem] shadow-sm">
              {!isFirstTopic ? (
                <button onClick={() => setSelectedTopic(prev => prev - 1)} className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-black/60 dark:text-white/60 hover:bg-white dark:hover:bg-white/10 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5">
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                </button>
              ) : <div className="w-24" />}

              <span className="text-[10px] uppercase tracking-widest font-bold text-black/40 dark:text-white/40 px-5 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl">
                {selectedTopic + 1} / {totalTopics}
              </span>

              {!isLastTopic ? (
                <button onClick={() => setSelectedTopic(prev => prev + 1)} className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => navigate(`/learn/exercises/${courseId}`)} className="flex items-center gap-2 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                  Complete <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseTopics;
