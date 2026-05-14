import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ArrowRight, Code } from "lucide-react";
import LoadingScreen from "../../components/LoadingScreen";
import { courseAPI, dataAdapters } from "../../services/api";
import { useTheme } from '../../context/ThemeContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";

const COURSES_CACHE_KEY = 'learn-courses-cache-v1';
const COURSES_CACHE_TTL_MS = 5 * 60 * 1000;

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
    { id: "java", title: "Java Programming", description: "Master Java programming and object-oriented concepts", status: "available" },
    { id: "python", title: "Python Programming", description: "Learn Python programming from basics to advanced concepts", status: "available" },
    { id: "dsa", title: "Data Structures & Algorithms", description: "Master DSA concepts for coding interviews and problem solving", status: "available" },
    { id: "mysql", title: "MySQL Database", description: "Learn database design, queries, and management with MySQL", status: "available" }
  ];

  const onlineCourses = [
    { id: "python-programming", title: "Python Programming", instructor: "Prashanti Vasi", duration: "2 weeks", schedule: "Mon-Sat", time: "11:30 AM - 12:30 PM", startDate: "In Progress", level: "Beginner" },
    { id: "dsa-with-java", title: "DSA with Java", instructor: "Prashanti Vasi", duration: "3 weeks", schedule: "Mon-Sat", time: "10:00 AM - 11:00 AM", startDate: "In Progress", level: "Intermediate" },
    { id: "dsa-with-python", title: "DSA with Python", instructor: "Prashanti Vasi", duration: "3 weeks", schedule: "Mon-Sat", time: "10:00 AM - 11:00 AM", startDate: "In Progress", level: "Intermediate" },
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
  }, [cachedCourses]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleCourseClick = (courseId) => {
    navigate(`/learn/courses/${courseId}`);
  };

  const handleWhatsAppClick = (courseTitle) => {
    const message = `Hi! I'd like to join the waitlist for ${courseTitle}. Can you share more details?`;
    const whatsappUrl = `https://wa.me/919676663136?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <LoadingScreen showMessage={false} size={48} duration={800} />;
  }

  return (
    <div className={`w-full font-sans antialiased text-[#0d2a57] dark:text-[#8fd9ff] ${isDarkMode ? "dark" : "light"}`}>
      <main className="z-10 px-4 sm:px-6 md:px-12 lg:px-16 pb-12 overflow-auto">
        <div className="max-w-[1600px] mx-auto space-y-12">

          <section className="pt-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#8ec8ff]/30 dark:border-[#6fbfff]/25 gap-4">
              <div>
                <h2 className="dashboard-page-title">
                  Courses
                </h2>
                <p className="dashboard-page-subtitle mt-2">
                  Pick a track and start building skills
                </p>
              </div>
            </header>

            <div className="mb-8 mt-6">
              {error && (
                <div className="text-left py-2 mb-4">
                  <p className="text-sm text-red-500 dark:text-red-400">Failed to load courses: {error}. Showing fallback data.</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
                {coursesData.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="dashboard-surface group p-6 md:p-8 transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[260px] relative overflow-hidden hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7ec9ff]/18 to-transparent rounded-full blur-3xl -mr-10 -mt-10 transition-opacity duration-500 opacity-0 group-hover:opacity-100"></div>

                    <div className="relative z-10 flex items-start justify-between mb-5 min-h-[52px]">
                      <div className="dashboard-icon-badge group-hover:scale-110 transition-transform duration-500">
                        <Code className="w-5 h-5 text-[#3C83F6] dark:text-[#8fd9ff]" />
                      </div>
                    </div>

                    <div className="relative z-10 mt-auto">
                      <h3 className="text-2xl md:text-[1.9rem] font-semibold text-[#0d2a57] dark:text-[#8fd9ff] group-hover:text-[#2d7fe8] dark:group-hover:text-[#96ddff] transition-colors mb-3 min-h-[72px] leading-snug flex items-start">
                        {course.title}
                      </h3>
                      <p className="text-sm text-[#4c6f9a] dark:text-[#7fb8e2] leading-relaxed line-clamp-2 min-h-[46px]">
                        {course.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          <section
            ref={onlineCoursesSectionRef}
            className="pb-4"
          >
            <div className="mb-8">
              <div className="flex items-center">
                <h2 className="dashboard-page-title">
                  Online Courses
                </h2>
              </div>
            </div>

            <div className="relative px-2 mb-8">
              <Carousel
                opts={{ align: "start", loop: true, dragFree: true, slidesToScroll: 1 }}
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
                              <span className="text-[11px] font-semibold text-[#10305e] dark:text-[#8fd9ff] whitespace-nowrap">{batch.time}</span>
                              <span className="text-[10px] text-[#5f82ac] dark:text-[#81bde6] mt-0.5">{batch.duration}</span>
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
                          className="dashboard-primary-btn mt-auto w-full py-3"
                        >
                          Join Waitlist <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
