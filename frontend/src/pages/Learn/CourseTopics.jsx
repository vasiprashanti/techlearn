import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import '../../styles/markdown.css';
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Dashboard/Sidebar';

const CourseTopics = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const isDarkMode = theme === 'dark';

  const { courseId } = useParams();
  const navigate = useNavigate();
  
  // Layout State
  const [appSidebarCollapsed, setAppSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  
  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || 'S';
  const userName = user?.firstName ? user.firstName : 'Student';

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
            description: `Learn about ${cleanTitle} concepts and applications.`,
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
      <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/5 p-12 rounded-3xl shadow-sm">
            <h1 className="text-xl font-medium tracking-tight text-black dark:text-white mb-4">{error ? 'Error Loading' : 'Course Not Found'}</h1>
            <button onClick={() => navigate('/learn/courses')} className="text-[10px] uppercase tracking-widest font-semibold text-[#3C83F6] hover:underline">
              Back to Course Details
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
    <div className={`flex min-h-screen w-full font-sans antialiased text-slate-900 dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#daf0fa]"}`} />

      {/* Main App Sidebar */}
      <Sidebar onToggle={setAppSidebarCollapsed} isCollapsed={appSidebarCollapsed} />

      <main className={`flex-1 flex flex-col transition-all duration-700 ease-in-out z-10 ${appSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} h-screen overflow-hidden`}>
        
        {/* Top Header */}
        <header className="flex-shrink-0 flex items-center justify-between pt-8 pb-4 px-6 md:px-12 border-b border-black/5 dark:border-white/5">
          <div className="flex flex-col items-start gap-3">
            <button 
                onClick={() => navigate(`/learn/courses/${courseId}`)} 
                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Course</span>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-[#3C83F6] dark:text-white">
                Course Player.
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-black/40 dark:text-white/40 mt-1 line-clamp-1 font-semibold">
                {currentCourse.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 relative z-50">
            <button 
              onClick={() => setIsSyllabusOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#3C83F6] dark:text-white" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-black/70 dark:text-white/70 font-semibold">Syllabus</span>
            </button>

            <button onClick={toggleTheme} className="hidden sm:block text-[10px] tracking-widest uppercase text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors font-semibold">
              {isDarkMode ? "Light" : "Dark"}
            </button>

            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-sm font-medium tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 dark:border-black/20"
              >
                {userInitial}
              </button>
              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-br from-[#3C83F6]/5 to-[#2563eb]/5 dark:from-white/5 dark:to-gray-200/5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C83F6] to-[#2563eb] dark:from-white dark:to-gray-200 text-white dark:text-black flex items-center justify-center text-lg font-medium tracking-wider shadow-md">
                          {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-black dark:text-white truncate">
                            {userName}
                          </h3>
                          <p className="text-xs text-black/60 dark:text-white/60 truncate">
                            {user?.email || 'student@techlearn.com'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <button onClick={() => { setProfileDropdownOpen(false); navigate('/profile'); }} className="w-full px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#3C83F6]/10 group-hover:text-[#3C83F6] dark:group-hover:bg-white/10 dark:group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div>
                          <div className="font-medium">My Profile</div>
                          <div className="text-[10px] text-black/50 dark:text-white/50">Manage your account</div>
                        </div>
                      </button>
                      <div className="mx-4 my-2 h-px bg-black/10 dark:bg-white/10"></div>
                      <button onClick={() => { setProfileDropdownOpen(false); logout(); }} className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </div>
                        <div>
                          <div className="font-medium">Log Out</div>
                          <div className="text-[10px] text-red-500/70 dark:text-red-400/70">Sign out securely</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

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
                className="fixed top-0 right-0 w-full sm:w-96 h-screen bg-white/95 dark:bg-[#0a1128]/95 backdrop-blur-3xl border-l border-black/10 dark:border-white/10 z-50 flex flex-col shadow-2xl"
              >
                <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#3C83F6] dark:text-white font-semibold block">Syllabus Drawer</span>
                    <span className="text-xs font-medium text-black/50 dark:text-white/50">{totalTopics} Modules Total</span>
                  </div>
                  <button onClick={() => setIsSyllabusOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-black/60 dark:text-white/60" />
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
          className="flex-1 overflow-y-auto px-4 md:px-8 py-10 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="max-w-[800px] mx-auto pb-20">

            {/* Reading Container Card */}
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-[2rem] p-8 md:p-12 lg:p-16 shadow-sm min-h-[60vh]">
              
              {/* Premium Heading Section */}
              <div className="mb-8 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#3C83F6]/10 dark:bg-white/5 rounded-full mb-6 border border-[#3C83F6]/20 dark:border-white/10">
                  <div className="w-2 h-2 rounded-full bg-[#3C83F6] dark:bg-white animate-pulse"></div>
                  <span className="text-[10px] uppercase tracking-widest text-[#3C83F6] dark:text-white font-bold">
                    Module {selectedTopic + 1}
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