import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ArrowRight, ArrowLeft, Code } from "lucide-react";
import { courseAPI, dataAdapters } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import { readCachedCourseDetails, writeCachedCourseDetails } from '../../utils/courseCache';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";

const COURSES_CACHE_KEY = 'learn-courses-cache-v1';
const COURSES_CACHE_TTL_MS = 5 * 60 * 1000;
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

const HIDDEN_COURSE_KEYS = new Set([
  '6995d2d6576b86926b74cc71',
  '6a0f089f28624d4a125064b0',
  'test course',
  'phase 2 course',
  'phase two course',
]);

const isUserVisibleCourse = (course) => {
  const courseKeys = [
    course?.title,
    course?.id,
    course?._id,
    course?.courseId,
  ].map(normalizeCourseKey);

  return !courseKeys.some((key) => HIDDEN_COURSE_KEYS.has(key));
};

const getCourseTopicsId = (course) => {
  return (
    COURSE_TOPIC_ID_OVERRIDES[normalizeCourseKey(course.title)] ||
    COURSE_TOPIC_ID_OVERRIDES[normalizeCourseKey(course.id)] ||
    course.id
  );
};

const getCourseTopicsPath = (course) => {
  return `/learn/courses/${getCourseTopicsId(course)}/topics`;
};

const readCachedCourses = () => {
  try {
    const raw = sessionStorage.getItem(COURSES_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !Array.isArray(parsed?.courses)) return null;
    if (Date.now() - parsed.timestamp > COURSES_CACHE_TTL_MS) return null;

    return parsed.courses.filter(isUserVisibleCourse);
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
  const [trainerLedApi, setTrainerLedApi] = useState(null);

  // Self-Paced Scroll Boundary States
  const [canScrollPrevSelf, setCanScrollPrevSelf] = useState(false);
  const [canScrollNextSelf, setCanScrollNextSelf] = useState(true);

  // Trainer-Led Scroll Boundary States
  const [canScrollPrevTrainer, setCanScrollPrevTrainer] = useState(false);
  const [canScrollNextTrainer, setCanScrollNextTrainer] = useState(true);

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
        const adaptedCourses = backendCourses
          .map(course => dataAdapters.adaptCourse(course))
          .filter(isUserVisibleCourse);
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

  // Hook scroll boundaries trackers for Trainer-Led
  useEffect(() => {
    if (!trainerLedApi) return;
    
    const onSelect = () => {
      setCanScrollPrevTrainer(trainerLedApi.canScrollPrev());
      setCanScrollNextTrainer(trainerLedApi.canScrollNext());
    };

    trainerLedApi.on("select", onSelect);
    trainerLedApi.on("reInit", onSelect);
    
    onSelect();

    return () => {
      trainerLedApi.off("select", onSelect);
      trainerLedApi.off("reInit", onSelect);
    };
  }, [trainerLedApi]);

  const handleWhatsAppClick = (courseTitle) => {
    const message = `Hi! I'd like to join the waitlist for ${courseTitle}. Can you share more details?`;
    const whatsappUrl = `https://wa.me/919000663666?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const prefetchCourseTopics = (course) => {
    const topicCourseId = getCourseTopicsId(course);
    if (!topicCourseId || readCachedCourseDetails(topicCourseId)) return;

    courseAPI.getCourse(topicCourseId)
      .then((response) => writeCachedCourseDetails(topicCourseId, response.course || response))
      .catch(() => {
        // Prefetch failures should never block navigation.
      });
  };

  // Custom navigation arrow button
  const NavArrow = ({ direction, onClick }) => {
    const isLeft = direction === 'left';
    return (
      <button
        type="button"
        onClick={onClick}
        className={`absolute z-30 top-1/2 -translate-y-1/2 p-2 md:p-3.5 rounded-full border border-[#8ec8ff]/40 dark:border-[#6fbfff]/30 bg-white/95 dark:bg-[#0a1128]/95 text-[#3C83F6] dark:text-[#8fd9ff] shadow-[0_8px_30px_rgba(34,119,255,0.18)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:bg-[#dbf1ff] dark:hover:bg-[#122b5e] transition-colors duration-300 flex items-center justify-center ${
          isLeft ? 'left-2 md:-left-5' : 'right-2 md:-right-5'
        }`}
      >
        {isLeft ? <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />}
      </button>
    );
  };

  if (loading) {
    return (
      <div className={`w-full min-h-screen px-4 sm:px-6 md:px-12 lg:px-16 pb-12 pt-24 ${isDarkMode ? "dark bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" : "light bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"}`}>
        <div className="mx-auto max-w-[1600px] space-y-10">
          <div className="h-16 w-72 rounded-2xl bg-white/30 dark:bg-white/10 animate-pulse" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-h-[260px] rounded-2xl border border-[#8ec8ff]/25 bg-white/25 dark:border-[#15366f]/45 dark:bg-[#020b23] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen min-w-0 overflow-x-clip font-sans antialiased text-[#00113b] dark:text-[#8fd9ff] bg-transparent">
      <main className="z-10 min-w-0 px-4 sm:px-6 md:px-12 lg:px-16 pb-12 overflow-x-clip">
        <div className="max-w-[1600px] mx-auto space-y-12">

          <section className="pt-6 space-y-10">

            {error && (
              <div className="text-left py-2">
                <p className="text-sm text-red-500 dark:text-red-400">Failed to load courses: {error}. Showing fallback data.</p>
              </div>
            )}

            {/* Subsection 1: Self-Paced Courses */}
            <div className="space-y-6">
              <h3 className="text-xl md:text-2xl font-press-start tracking-tight uppercase flex items-center gap-2 hover-gradient-text">
                SELF-PACED COURSES
              </h3>

              <div className="relative px-2 group">
                <Carousel
                  setApi={setSelfPacedApi}
                  opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: true, duration: 40 }}
                  className="w-full max-w-full"
                >
                  <CarouselContent className="-ml-2 py-4">
                    {coursesData.filter(course => course.courseType !== 'Trainer-led').map((course) => (
                      <CarouselItem
                        key={course.id}
                        className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 px-3"
                      >
                        <div
                          onMouseEnter={() => prefetchCourseTopics(course)}
                          onFocus={() => prefetchCourseTopics(course)}
                          onClick={() => {
                            prefetchCourseTopics(course);
                            navigate(getCourseTopicsPath(course));
                          }}
                          className="dashboard-surface group p-6 md:p-8 transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[260px] relative overflow-hidden hover:-translate-y-1 h-full dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7ec9ff]/18 to-transparent rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

                          <div className="relative z-10 flex items-start justify-between mb-5 min-h-[52px]">
                            <div className="dashboard-icon-badge group-hover:scale-110 transition-transform duration-500">
                              <Code className="w-5 h-5 text-[#3C83F6] dark:text-[#8fd9ff]" />
                            </div>
                          </div>

                          <div className="relative z-10 mt-auto">
                            <h3 className="text-xl md:text-[1.6rem] font-semibold text-[#00113b] dark:text-[#8fd9ff] group-hover:text-[#001b5c] dark:group-hover:text-[#96ddff] transition-colors mb-3 min-h-[72px] leading-snug flex items-start">
                              {course.title}
                            </h3>
                            <p className="text-sm text-[#00113b] dark:text-[#7fb8e2] leading-relaxed line-clamp-2 min-h-[46px]">
                              {course.description}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {canScrollPrevSelf && (
                  <NavArrow direction="left" onClick={() => selfPacedApi?.scrollPrev()} />
                )}

                {canScrollNextSelf && (
                  <NavArrow direction="right" onClick={() => selfPacedApi?.scrollNext()} />
                )}
              </div>
            </div>

            {/* Subsection 2: Trainer-Led Courses */}
            <div
              ref={onlineCoursesSectionRef}
              className="space-y-6 pt-4"
            >
              <h3 className="text-xl md:text-2xl font-press-start tracking-tight uppercase flex items-center gap-2 hover-gradient-text">
                TRAINER-LED COURSES
              </h3>

              <div className="relative px-2 group">
                <Carousel
                  setApi={setTrainerLedApi}
                  opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: true, duration: 40 }}
                  className="w-full max-w-full"
                >
                  <CarouselContent className="-ml-2 py-4">
                    {coursesData.filter(c => c.courseType === 'Trainer-led').map((batch, index) => (
                      <CarouselItem
                        key={batch.id || batch._id}
                        className="md:basis-1/2 lg:basis-1/3 xl:basis-1/3 px-3"
                      >
                        <div
                          onClick={() => {
                            prefetchCourseTopics(batch);
                            navigate(getCourseTopicsPath(batch));
                          }}
                          className="dashboard-surface p-7 flex flex-col h-full transition-all duration-300 rounded-2xl group min-h-[320px] hover:-translate-y-1 dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] cursor-pointer"
                        >
                          <div className="flex justify-between items-center mb-6">
                            <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-semibold ${levelTagStyles[batch.level] || 'bg-[#dff6e8] text-[#1f7d53] border border-[#b9e9c8]'}`}>
                              {batch.level}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-[#00113b] dark:text-[#8ac7f3] transition-colors">
                              By {batch.instructor || "Trainer"}
                            </span>
                          </div>

                          <div className="mb-5 h-24 w-full rounded-xl border border-[#90c8ff]/40 dark:border-[#6cb7ec]/35 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                            <img
                              src={batch.bannerImage || "/expert-led-banner.jpg"}
                              alt="Trainer-Led Course"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>

                          <h3 className="text-xl font-medium text-center text-[#00113b] dark:text-[#8fd9ff] group-hover:text-[#001b5c] dark:group-hover:text-[#9adfff] transition-colors mb-6">
                            {batch.title}
                          </h3>

                          <div className="grid grid-cols-2 gap-y-5 gap-x-4 px-3 mb-8 border-t border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 pt-5">
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-[#00113b] dark:text-[#7cc3ee]" />
                              <div className="flex items-center">
                                <span className="text-[11px] font-semibold text-[#00113b] dark:text-[#8fd9ff] whitespace-nowrap">{batch.duration || 'Self-paced'}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2.5">
                              <Calendar className="w-4 h-4 text-[#00113b] dark:text-[#7cc3ee]" />
                              <div className="flex items-center">
                                <span className="text-[11px] font-semibold text-[#00113b] dark:text-[#8fd9ff] whitespace-nowrap">{batch.schedule || 'Flexible'}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsAppClick(batch.title);
                            }}
                            className="mt-auto w-full py-2 sm:py-3 flex items-center justify-center gap-2 rounded-xl bg-[#00113b] text-white text-xs sm:text-sm font-semibold shadow-sm transition hover:bg-[#001b5c] dark:!bg-[#bceaff] dark:!text-[#020b23] dark:hover:!bg-[#daf0fa]"
                          >
                            <span>Join Waitlist</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>

                {canScrollPrevTrainer && (
                  <NavArrow direction="left" onClick={() => trainerLedApi?.scrollPrev()} />
                )}

                {canScrollNextTrainer && (
                  <NavArrow direction="right" onClick={() => trainerLedApi?.scrollNext()} />
                )}
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
