import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import ScrollProgress from "../../components/ScrollProgress";
import { courseAPI } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { readCachedCourseDetails, writeCachedCourseDetails } from '../../utils/courseCache';

const MarkdownContent = lazy(() => import('./MarkdownContent'));

const CourseTopicsSkeleton = ({ isDarkMode }) => (
    <div className={`flex min-h-screen w-full font-sans antialiased text-[#001862] dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
    <ScrollProgress />
    <div className={`fixed inset-0 -z-10 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"}`} />
    <main className="flex-1 flex flex-col h-screen overflow-hidden pt-20 md:pt-24">
      <header className="flex-shrink-0 px-6 md:px-12 pt-4 pb-4">
        <div className="h-4 w-32 rounded-full bg-[#7ec9ff]/30 dark:bg-white/10 animate-pulse" />
      </header>
      <div className="flex-1 min-h-0 overflow-hidden md:grid md:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[minmax(16rem,1fr)_minmax(0,760px)_minmax(16rem,1fr)]">
        <aside className="hidden md:flex min-h-0 w-64 justify-self-start flex-col rounded-r-2xl border-y border-r border-black/5 dark:border-white/5 bg-[#bceaff]/80 dark:bg-[#020b23] backdrop-blur-2xl p-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="mb-2 h-11 rounded-lg bg-[#e4f6ff]/65 dark:bg-white/10 animate-pulse" />
          ))}
        </aside>
        <div className="min-h-0 overflow-hidden px-4 md:px-8 xl:px-0 pb-10">
          <div className="mx-auto w-full max-w-[760px] p-8 md:px-10 lg:px-12">
            <div className="h-10 w-3/4 rounded-xl bg-white/35 dark:bg-white/10 animate-pulse" />
            <div className="mt-10 space-y-4">
              <div className="h-5 w-full rounded-full bg-white/30 dark:bg-white/10 animate-pulse" />
              <div className="h-5 w-11/12 rounded-full bg-white/30 dark:bg-white/10 animate-pulse" />
              <div className="h-5 w-5/6 rounded-full bg-white/30 dark:bg-white/10 animate-pulse" />
              <div className="h-5 w-9/12 rounded-full bg-white/30 dark:bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="hidden xl:block" aria-hidden="true" />
      </div>
    </main>
  </div>
);

const CourseTopics = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { courseId } = useParams();
  const navigate = useNavigate();
  const cachedCourse = readCachedCourseDetails(courseId);
  
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [isCourseHeaderHidden, setIsCourseHeaderHidden] = useState(false);

  const [selectedTopic, setSelectedTopic] = useState(0);
  
  // Ref for the scrollable container
  const scrollContainerRef = useRef(null);
  const lastContentScrollTopRef = useRef(0);

  const [backendCourse, setBackendCourse] = useState(cachedCourse);
  const [loading, setLoading] = useState(!cachedCourse);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCourse = async () => {
      try {
        const cached = readCachedCourseDetails(courseId);
        if (cached) {
          setBackendCourse(cached);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const response = await courseAPI.getCourse(courseId);
        const courseData = response.course || response;
        writeCachedCourseDetails(courseId, courseData);

        if (!cancelled) {
          setBackendCourse(courseData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          if (!readCachedCourseDetails(courseId)) {
            setBackendCourse(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    if (courseId) fetchCourse();

    return () => {
      cancelled = true;
    };
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

  // Auto-scroll instantly to the top when navigating between topics
  useEffect(() => { 
    if (scrollContainerRef.current) {
      // Direct DOM manipulation ensures it snaps instantly without weird transition glitches
      scrollContainerRef.current.scrollTop = 0;
    }
    lastContentScrollTopRef.current = 0;
    setIsCourseHeaderHidden(false);
    window.dispatchEvent(new CustomEvent('techlearn:course-content-scroll', {
      detail: { isScrolled: false, isScrollingDown: false },
    }));
  }, [selectedTopic]);

  const handleContentScroll = (event) => {
    const currentScrollTop = event.currentTarget.scrollTop;
    const isScrollingDown = currentScrollTop > lastContentScrollTopRef.current;
    const shouldHideHeader = currentScrollTop > 24 && isScrollingDown;

    lastContentScrollTopRef.current = Math.max(currentScrollTop, 0);

    window.dispatchEvent(new CustomEvent('techlearn:course-content-scroll', {
      detail: { isScrolled: shouldHideHeader, isScrollingDown },
    }));
    setIsCourseHeaderHidden((current) => (
      current === shouldHideHeader ? current : shouldHideHeader
    ));
  };

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('techlearn:course-content-scroll', {
        detail: { isScrolled: false, isScrollingDown: false },
      }));
    };
  }, []);

  if (loading && !backendCourse) return <CourseTopicsSkeleton isDarkMode={isDarkMode} />;

  if (error || !currentCourse) {
    return (
      <div className={`flex min-h-full w-full font-sans antialiased text-[#001862] dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
         <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"}`} />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="dashboard-surface text-center p-12 shadow-sm">
            <h1 className="dashboard-page-title mb-4">{error ? 'Error Loading' : 'Course Not Found'}</h1>
            <button onClick={() => navigate('/learn')} className="text-[10px] uppercase tracking-widest font-semibold text-[#3C83F6] hover:underline">
              Back to Learn
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-full w-full font-sans antialiased text-[#001862] dark:text-slate-100 ${isDarkMode ? "dark" : "light"}`}>
      <ScrollProgress />
      
      {/* Unified Background */}
      <div className={`fixed inset-0 -z-10 transition-colors duration-1000 ${isDarkMode ? "bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"}`} />

      <main className="relative flex-1 flex flex-col transition-all duration-700 ease-in-out z-10 h-screen overflow-hidden pt-20 md:pt-24">
        
        {/* Top Header */}
        <header className={`flex-shrink-0 overflow-hidden flex items-center justify-between px-7 md:px-12 transition-all duration-300 ease-out ${
          isCourseHeaderHidden
            ? "max-h-0 py-0 opacity-0 pointer-events-none"
            : "max-h-32 pt-4 pb-4 opacity-100"
        }`}>
          <div className="flex flex-col items-start gap-3">
            <button 
                onClick={() => navigate('/learn')} 
                className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] leading-tight text-[#001862] hover:text-[#2d7fe8] dark:text-[#7fb9e6] dark:hover:text-[#96ddff] transition-colors group"
            >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Learn</span>
            </button>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 relative z-50">
            <button 
              onClick={() => setIsSyllabusOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#3C83F6] dark:text-white" />
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-[#001862] dark:text-white/70 font-semibold">Chapters</span>
            </button>
          </div>
        </header>

        {/* Syllabus Drawer */}
        {isSyllabusOpen && (
          <>
            <button
              type="button"
              aria-label="Close syllabus"
              onClick={() => setIsSyllabusOpen(false)}
              className="fixed inset-x-0 bottom-0 top-20 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden"
            />
            <div className="fixed left-0 top-20 bottom-0 w-full sm:w-96 rounded-r-2xl bg-[#bceaff]/80 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] backdrop-blur-2xl border-r border-black/5 dark:border-white/5 z-40 flex flex-col shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:hidden">
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-black/20">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#3C83F6] dark:text-white font-semibold block">Syllabus</span>
                  </div>
                  <button onClick={() => setIsSyllabusOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-[#001862]/60 dark:text-white/60" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {currentCourse.topics.map((topic, index) => {
                    const isActive = selectedTopic === index;

                    return (
                      <button
                        key={topic.id}
                        onClick={() => { setSelectedTopic(index); setIsSyllabusOpen(false); }}
                        className={`group flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm tracking-wide transition-all duration-300 ease-out ${
                          isActive
                            ? "border-[#7ec9ff]/45 bg-[#e4f6ff]/75 text-[#001862] shadow-[0_8px_20px_rgba(60,131,246,0.12)] dark:border-white/10 dark:bg-[#1a2b6d] dark:text-white"
                            : "border-transparent text-[#001862] hover:border-[#7ec9ff]/35 hover:bg-[#d8f1fb]/55 hover:text-[#001862] dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-[#1a2b6d]/95 dark:hover:text-white"
                        }`}
                      >
                        <span className="block min-w-0 flex-1 text-sm font-medium leading-tight line-clamp-2">
                          {topic.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
            </div>
          </>
        )}

        <div className="flex-1 min-h-0 overflow-hidden md:grid md:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[minmax(16rem,1fr)_minmax(0,760px)_minmax(16rem,1fr)]">
          <aside
            className="hidden md:flex min-h-0 w-64 justify-self-start flex-col overflow-hidden rounded-r-2xl border-y border-r border-black/5 bg-[#bceaff]/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all duration-500 ease-out dark:rounded-none dark:border-transparent dark:bg-transparent dark:shadow-none dark:backdrop-blur-none"
          >
            <div className="flex-1 overflow-y-auto px-3 py-4 md:ml-6 md:max-w-[13.5rem] md:px-0 md:py-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-2">
                {currentCourse.topics.map((topic, index) => {
                  const isActive = selectedTopic === index;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(index)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-5 py-3.5 text-left text-sm tracking-wide transition-all duration-300 ease-out ${
                        isActive
                          ? "border-[#7ec9ff]/45 bg-[#e4f6ff]/75 text-[#001862] shadow-[0_8px_20px_rgba(60,131,246,0.12)] dark:border-white/10 dark:bg-[#1a2b6d] dark:text-white"
                          : "border-transparent text-[#001862] hover:border-[#7ec9ff]/35 hover:bg-[#d8f1fb]/55 hover:text-[#001862] dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-[#1a2b6d]/95 dark:hover:text-white"
                      }`}
                    >
                      <span className="block min-w-0 flex-1 text-sm font-medium leading-tight line-clamp-2">
                        {topic.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Scroll Area - Attached ref here for auto-scroll */}
          <div
            ref={scrollContainerRef}
            onScroll={handleContentScroll}
            className="min-h-0 overflow-y-auto px-4 md:px-8 xl:px-0 pt-0 pb-10 relative transition-all duration-500 ease-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="mx-auto w-full max-w-[760px] pb-20">

              {/* Reading Content */}
              <div className="course-notes-text px-6 py-2 md:px-10 lg:px-12 md:py-3 min-h-[60vh]">
              
              {/* Premium Heading Section */}
              <div className="mb-8 text-center md:text-left">
                {/* Swapped out useInViewport for a Framer Motion component tied to a key.
                  This forces React to completely unmount and re-animate the title whenever the selectedTopic changes.
                */}
                <h1
                  key={selectedTopic}
                  className="text-4xl md:text-5xl lg:text-[3.5rem] font-semibold text-[#001862] dark:text-white tracking-tight leading-[1.1]"
                >
                  {currentTopic?.title}
                </h1>
              </div>

              {/* Dynamic Content - Added CSS rules to strictly strip top margin from the very first Markdown element */}
              {currentTopic?.hasNotes && currentTopic?.notesContent ? (
                <div className="w-full [&>*:first-child]:mt-0 [&>*:first-child>*:first-child]:mt-0">
                  <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-white/20 dark:bg-white/5" />}>
                    <MarkdownContent>{currentTopic.notesContent}</MarkdownContent>
                  </Suspense>
                </div>
              ) : currentTopic?.hasNotes ? (
                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                  <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 flex items-center justify-center mb-6 shadow-inner border border-white/20 dark:border-white/5">
                    <AlertCircle className="w-8 h-8 text-[#001862]/30 dark:text-white/30" />
                  </div>
                  <h3 className="text-lg font-medium text-[#001862] dark:text-white mb-2">Notes are being compiled</h3>
                  <p className="text-sm text-[#001862] dark:text-white/50 max-w-sm">The curriculum team is currently writing the detailed reading material for this topic.</p>
                </div>
              ) : (
                <div className="text-[#001862] dark:text-white/75 leading-[1.8] font-light text-lg whitespace-pre-line">
                  {currentTopic?.content.theory}
                </div>
              )}
              </div>

              {/* Premium Navigation Footer */}
              <div className="dashboard-surface flex items-center justify-between mt-8 p-4 rounded-[1.5rem] shadow-sm">
              {!isFirstTopic ? (
                <button onClick={() => setSelectedTopic(prev => prev - 1)} className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-[10px] uppercase tracking-widest font-bold text-[#001862] dark:text-white/60 hover:bg-white dark:hover:bg-white/10 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5">
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                </button>
              ) : <div className="w-24" />}

              <span className="text-[10px] uppercase tracking-widest font-bold text-[#001862] dark:text-white/40 px-5 py-2.5 bg-black/5 dark:bg-white/5 rounded-xl">
                {selectedTopic + 1} / {totalTopics}
              </span>

              {!isLastTopic ? (
                <button onClick={() => setSelectedTopic(prev => prev + 1)} className="dashboard-primary-btn flex items-center gap-2 px-8 py-3.5">
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => navigate(`/learn/exercises/${courseId}`)} className="dashboard-primary-btn flex items-center gap-2 px-8 py-3.5">
                  Complete <CheckCircle className="w-4 h-4" />
                </button>
              )}
              </div>

              </div>
          </div>
          <div className="hidden xl:block" aria-hidden="true" />
        </div>
      </main>
    </div>
  );
};

export default CourseTopics;
