import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ArrowRight, ArrowLeft, Code } from "lucide-react";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI, dataAdapters } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";

const COURSES_CACHE_KEY = 'learn-courses-cache-v1';
const COURSES_CACHE_TTL_MS = 5 * 60 * 1000;
const MotionButton = motion.button;
const COURSE_TOPIC_ID_OVERRIDES = {
  'c': '6890c2acbc09eb4b5c346b9b',
  'c programming': '6890c2acbc09eb4b5c346b9b',
  'introduction to c': '6890c2acbc09eb4b5c346b9b',
  'python': '6890ec81950225df57310f52',
  'python programming': '6890ec81950225df57310f52',
  'java': '6890f09830551d88a325f623',
  'java programming': '6890f09830551d88a325f623',
  'core java': '6890f09830551d88a325f623',
  'java (core)': '6890f09830551d88a325f623',
};

const normalizeCourseKey = (value = '') => value.toString().trim().toLowerCase();

const getCourseTopicsPath = (course) => {
  const overrideId =
    COURSE_TOPIC_ID_OVERRIDES[normalizeCourseKey(course.title)] ||
    COURSE_TOPIC_ID_OVERRIDES[normalizeCourseKey(course.id)];

  return `/learn/courses/${overrideId || course.id}/topics`;
};

const readCachedCourses = () => {
  try {
    const raw = sessionStorage.getItem(COURSES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !Array.isArray(parsed?.courses)) return null;
    if (Date.now() - parsed.timestamp > COURSES_CACHE_TTL_MS) return null;

    return parsed.courses;
  } catch {
    return null;
  }
};

const writeCachedCourses = (courses) => {
  try {
    sessionStorage.setItem(
      COURSES_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        courses,
      })
    );
  } catch {
    // Ignore cache write failures and continue with live data only.
  }
};

export default function Courses() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const onlineCoursesSectionRef = useRef(null);
  const isDarkMode = theme === 'dark';
  const cachedCourses = readCachedCourses();

  // Embla API Instances for scroll control
  const [selfPacedApi, setSelfPacedApi] = useState(null);
  const [expertLedApi, setExpertLedApi] = useState(null);

  // Self-Paced Scroll Boundary States
  const [canScrollPrevSelf, setCanScrollPrevSelf] = useState(false);
  const [canScrollNextSelf, setCanScrollNextSelf] = useState(true);

  // Expert-Led Scroll Boundary States
  const [canScrollPrevExpert, setCanScrollPrevExpert] = useState(false);
  const [canScrollNextExpert, setCanScrollNextExpert] = useState(true);

  const levelTagStyles = {
    Beginner: 'bg-[#dff6e8] text-[#1f7d53] border border-[#b9e9c8]',
    Intermediate: 'bg-[#fff6c9] text-[#9a7a16] border border-[#f6e597]',
    Advanced: 'bg-[#efe5ff] text-[#7551a6] border border-[#ddcbff]',
  };

  const bannerStyles = [
    'from-[#8cd2ff] via-[#65b8ff] to-[#3c83f6]',
    'from-[#8cecff] via-[#6fd9ff] to-[#5aa6ff]',
    'from-[#94d8ff] via-[#79c8ff] to-[#5d99ff]',
  ];

  const [coursesData, setCoursesData] = useState(cachedCourses || []);
  const [loading, setLoading] = useState(!cachedCourses);
  const [error, setError] = useState(null);

  const mockCoursesData = [
    { id: "6890c2acbc09eb4b5c346b9b", title: "C Programming", description: "Master the fundamentals of C programming and memory concepts", status: "available" },
    { id: "6890ec81950225df57310f52", title: "Python Programming", description: "Learn Python programming from basics to advanced concepts", status: "available" },
    { id: "6890f09830551d88a325f623", title: "Java Programming", description: "Master Java programming and object-oriented concepts", status: "available" },
    { id: "dsa", title: "Data Structures & Algorithms", description: "Master DSA concepts for coding interviews and problem solving", status: "available" },
    { id: "mysql", title: "MySQL Database", description: "Learn database design, queries, and management with MySQL", status: "available" }
  ];

  const onlineCourses = [
    { id: "python-programming", title: "Python Programming", instructor: "Prashanti Vasi", duration: "4 weeks", schedule: "Mon-Sat", startDate: "In Progress", level: "Beginner" },
    { id: "dsa-with-java", title: "DSA with Java", instructor: "Prashanti Vasi", duration: "4 weeks", schedule: "Mon-Sat", startDate: "In Progress", level: "Intermediate" },
    { id: "dsa-with-python", title: "DSA with Python", instructor: "Prashanti Vasi", duration: "4 weeks", schedule: "Mon-Sat", startDate: "In Progress", level: "Intermediate" },
    { id: "web-development", title: "Web Development", instructor: "Jyotsna", duration: "3 weeks", schedule: "Mon-Sat", time: "6:00 PM - 7:00 PM", startDate: "In Progress", level: "Beginner" },
    { id: "java-core", title: "Java (Core)", instructor: "Prashanti Vasi", duration: "TBD", schedule: "Mon-Sat", time: "(Not listed)", startDate: "In Progress", level: "Intermediate" }
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!cachedCourses) {
          setLoading(true);
        }
        const backendCourses = await courseAPI.getAllCourses();
        const adaptedCourses = backendCourses.map(course => dataAdapters.adaptCourse(course));
        setCoursesData(adaptedCourses);
        writeCachedCourses(adaptedCourses);
        setError(null);
      } catch (fetchError) {
        setError(fetchError.message);
        if (!cachedCourses) {
          setCoursesData(mockCoursesData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const shouldScrollToOnlineCourses = sessionStorage.getItem('returnToOnlineCourses');

    if (shouldScrollToOnlineCourses === 'true' && !loading && onlineCoursesSectionRef.current) {
      sessionStorage.removeItem('returnToOnlineCourses');

      const scrollTimer = setTimeout(() => {
        const element = onlineCoursesSectionRef.current;
        if (element) {
          const elementTop = element.offsetTop - 100;
          window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
          });
        }
      }, 500);

      return () => clearTimeout(scrollTimer);
    }
  }, [loading]);

  // Hook scroll boundaries trackers for Self-Paced
  useEffect(() => {
    if (!selfPacedApi) return;
    
    const onSelect = () => {
      setCanScrollPrevSelf(selfPacedApi.canScrollPrev());
      setCanScrollNextSelf(selfPacedApi.canScrollNext());
    };

    selfPacedApi.on("select", onSelect);
    selfPacedApi.on("reInit", onSelect);
    
    onSelect();

    return () => {
      selfPacedApi.off("select", onSelect);
      selfPacedApi.off("reInit", onSelect);
    };
  }, [selfPacedApi]);

  // Hook scroll boundaries trackers for Expert-Led
  useEffect(() => {
    if (!expertLedApi) return;
    
    const onSelect = () => {
      setCanScrollPrevExpert(expertLedApi.canScrollPrev());
      setCanScrollNextExpert(expertLedApi.canScrollNext());
    };

    expertLedApi.on("select", onSelect);
    expertLedApi.on("reInit", onSelect);
    
    onSelect();

    return () => {
      expertLedApi.off("select", onSelect);
      expertLedApi.off("reInit", onSelect);
    };
  }, [expertLedApi]);

  const handleWhatsAppClick = (courseTitle) => {
    const message = `Hi! I'd like to join the waitlist for ${courseTitle}. Can you share more details?`;
    const whatsappUrl = `https://wa.me/919676663136?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Custom navigation arrow button
  const NavArrow = ({ direction, onClick }) => {
    const isLeft = direction === 'left';
    return (
      <MotionButton
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={onClick}
        className={`absolute z-30 top-1/2 -translate-y-1/2 p-3.5 rounded-full border border-[#8ec8ff]/40 dark:border-[#6fbfff]/30 bg-white/95 dark:bg-[#0a1128]/95 text-[#3C83F6] dark:text-[#8fd9ff] shadow-[0_8px_30px_rgba(34,119,255,0.18)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:bg-[#dbf1ff] dark:hover:bg-[#122b5e] transition-colors duration-300 flex items-center justify-center ${
          isLeft ? 'left-2 md:-left-5' : 'right-2 md:-right-5'
        }`}
      >
        {isLeft ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </MotionButton>
    );
  };

  if (loading) {
    return <LoadingScreen showMessage={false} size={48} duration={800} />;
  }

  return (
    <div className={`w-full font-sans antialiased text-[#0d2a57] dark:text-[#8fd9ff] ${isDarkMode ? "dark" : "light"}`}>
      <main className="z-10 px-4 sm:px-6 md:px-12 lg:px-16 pb-12 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-12">

          <section className="pt-6 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#8ec8ff]/30 dark:border-[#6fbfff]/25 gap-4">
              <div>
                <h1 className="mt-8 font-poppins tracking-tight leading-[0.92]">
                  <span className="brand-heading-primary block text-4xl sm:text-5xl md:text-6xl font-bold font-poppins">
                    Courses.
                  </span>
                </h1>
                <p className="text-xs tracking-widest uppercase text-black/40 dark:text-white/40 mt-4 max-w-4xl leading-relaxed">
                  Pick a track, enroll in self-paced or expert-led learning courses, and start building skills.
                </p>
              </div>
            </header>

            {error && (
              <div className="text-left py-2">
                <p className="text-sm text-red-500 dark:text-red-400">Failed to load courses: {error}. Showing fallback data.</p>
              </div>
            )}

            {/* Subsection 1: Self-Paced Courses */}
            <div className="space-y-6">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#0d2a57] dark:text-[#8fd9ff] flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-[#3C83F6]" />
                Self-Paced Courses
              </h3>

              <div className="relative px-2 group">
                <Carousel
                  setApi={setSelfPacedApi}
                  opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: false }}
                  className="w-full max-w-full"
                >
                  <CarouselContent className="-ml-2 py-4">
                    {coursesData.map((course) => (
                      <CarouselItem
                        key={course.id}
                        className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 px-3"
                      >
                        <div
                          onClick={() => navigate(getCourseTopicsPath(course))}
                          className="dashboard-surface group p-6 md:p-8 transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[260px] relative overflow-hidden hover:-translate-y-1 h-full"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7ec9ff]/18 to-transparent rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

                          <div className="relative z-10 flex items-start justify-between mb-5 min-h-[52px]">
                            <div className="dashboard-icon-badge group-hover:scale-110 transition-transform duration-500">
                              <Code className="w-5 h-5 text-[#3C83F6] dark:text-[#8fd9ff]" />
                            </div>
                          </div>

                          <div className="relative z-10 mt-auto">
                            <h3 className="text-xl md:text-[1.6rem] font-semibold text-[#0d2a57] dark:text-[#8fd9ff] group-hover:text-[#2d7fe8] dark:group-hover:text-[#96ddff] transition-colors mb-3 min-h-[72px] leading-snug flex items-start">
                              {course.title}
                            </h3>
                            <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2] leading-relaxed line-clamp-2 min-h-[46px]">
                              {course.description}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                <AnimatePresence>
                  {canScrollPrevSelf && (
                    <NavArrow direction="left" onClick={() => selfPacedApi?.scrollPrev()} />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {canScrollNextSelf && (
                    <NavArrow direction="right" onClick={() => selfPacedApi?.scrollNext()} />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Subsection 2: Expert-Led Courses */}
            <div
              ref={onlineCoursesSectionRef}
              className="space-y-6 pt-4"
            >
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[#0d2a57] dark:text-[#8fd9ff] flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-[#3C83F6]" />
                Expert-Led Courses
              </h3>

              <div className="relative px-2 group">
                <Carousel
                  setApi={setExpertLedApi}
                  opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: false }}
                  className="w-full max-w-full"
                >
                  <CarouselContent className="-ml-2 py-4">
                    {onlineCourses.map((batch, index) => (
                      <CarouselItem
                        key={batch.id}
                        className="md:basis-1/2 lg:basis-1/3 xl:basis-1/3 px-3"
                      >
                        <div
                          className="dashboard-surface p-7 flex flex-col h-full transition-all duration-300 rounded-2xl group min-h-[320px] hover:-translate-y-1"
                        >
                          <div className="flex justify-between items-center mb-6">
                            <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-semibold ${levelTagStyles[batch.level] || 'bg-[#dff6e8] text-[#1f7d53] border border-[#b9e9c8]'}`}>
                              {batch.level}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-[#4f719c] dark:text-[#8ac7f3] transition-colors">
                              By {batch.instructor}
                            </span>
                          </div>

                          <div className={`mb-5 h-24 w-full rounded-xl border border-[#90c8ff]/40 dark:border-[#6cb7ec]/35 bg-gradient-to-r ${bannerStyles[index % bannerStyles.length]} flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]`}>
                            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#08295e]/85">
                              Banner Space
                            </span>
                          </div>

                          <h3 className="text-xl font-medium text-[#0d2a57] dark:text-[#8fd9ff] group-hover:text-[#2c7de4] dark:group-hover:text-[#9adfff] transition-colors mb-6">
                            {batch.title}
                          </h3>

                          <div className="grid grid-cols-2 gap-y-5 gap-x-8 mb-8 border-t border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 pt-5">
                            <div className="flex items-start gap-2.5">
                              <Clock className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee] mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-[#10305e] dark:text-[#8fd9ff] whitespace-nowrap">{batch.duration}</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <Calendar className="w-4 h-4 text-[#4f7fb7] dark:text-[#7cc3ee] mt-0.5" />
                              <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-[#10305e] dark:text-[#8fd9ff] whitespace-nowrap">{batch.schedule}</span>
                                <span className="text-[10px] text-[#5f82ac] dark:text-[#81bde6] mt-0.5">Recurring</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleWhatsAppClick(batch.title)}
                            className="mt-auto w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-[#00113b] text-white text-sm font-semibold shadow-sm transition hover:bg-[#001b5c] dark:bg-[#00113b] dark:hover:bg-[#001b5c]"
                          >
                            <span>Join Waitlist</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                <AnimatePresence>
                  {canScrollPrevExpert && (
                    <NavArrow direction="left" onClick={() => expertLedApi?.scrollPrev()} />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {canScrollNextExpert && (
                    <NavArrow direction="right" onClick={() => expertLedApi?.scrollNext()} />
                  )}
                </AnimatePresence>
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
