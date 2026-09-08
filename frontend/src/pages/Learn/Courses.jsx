import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ArrowRight, ArrowLeft, Code } from "lucide-react";
import { courseAPI, dataAdapters } from "../../services/api";
import { programLearningAPI } from "../../services/programLearningApi";
import { useTheme } from '../../context/ThemeContext';
import JoinWaitlistModal from '../../components/Learn/JoinWaitlistModal';
import { readCachedCourseDetails, writeCachedCourseDetails } from '../../utils/courseCache';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";

const COURSES_CACHE_KEY = 'learn-courses-cache-v2';
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

const getCourseImage = (course) => {
  if (course.image) return course.image;
  if (course.bannerImage) return course.bannerImage;
  const t = (course.title || '').toLowerCase();
  if (t.includes('genai') || t.includes('generative ai')) return '/genai.jpg';
  if (t.includes('aptitude') || t.includes('quantitative') || t.includes('reasoning')) return '/aptitude.jpg';
  if (t.includes('fullstack') || t.includes('full stack') || t.includes('full-stack')) return '/java-fullstack.jpg';
  if (t.includes('java') && !t.includes('javascript')) return '/java.jpg';
  if (t.includes('python')) return '/python.jpg';
  if (t.includes('c programming') || t === 'c' || t.startsWith('c ')) return '/c-programming.jpg';
  return '/python.jpg';
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
    // Ignore cache write failures
  }
};

export default function Courses() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const onlineCoursesSectionRef = useRef(null);
  const isDarkMode = theme === 'dark';
  const cachedCourses = readCachedCourses();

  // Modals state
  const [selectedWaitlistProgram, setSelectedWaitlistProgram] = useState(null);

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

  const [coursesData, setCoursesData] = useState(cachedCourses || []);
  const [publicPrograms, setPublicPrograms] = useState([]);
  const [loading, setLoading] = useState(!cachedCourses);

  const mockCoursesData = [
    { id: "6890c2acbc09eb4b5c346b9b", title: "C Programming", description: "Master the fundamentals of C programming and memory concepts", status: "available", image: "/c-programming.jpg" },
    { id: "6890ec81950225df57310f52", title: "Python Programming", description: "Learn Python programming from basics to advanced concepts", status: "available", image: "/python.jpg" },
    { id: "6890f09830551d88a325f623", title: "Java Programming", description: "Master Java programming and object-oriented concepts", status: "available", image: "/java.jpg" },
    { id: "dsa", title: "Data Structures & Algorithms", description: "Master DSA concepts for coding interviews and problem solving", status: "available", image: "/dsa.png" },
    { id: "mysql", title: "MySQL Database", description: "Learn database design, queries, and management with MySQL", status: "available", image: "/mysql.png" }
  ];

  const defaultTrainerPrograms = [
    { _id: "placement-sprint", name: "30-Day Placement Sprint", description: "Structured daily tasks, real company patterns, mock interviews, and assessment readiness.", duration: "4 weeks", instructor: "Prashanti Vasi", level: "Intermediate", programType: "Placement", bannerImage: "/expert-led-banner.jpg" },
    { _id: "full-stack-live", name: "Full Stack Web Bootcamp", description: "Hands-on projects with React, Node.js, and cloud deployments with live doubt sessions.", duration: "6 weeks", instructor: "Jyotsna", level: "Beginner", programType: "Skill", bannerImage: "/expert-led-banner.jpg" },
    { _id: "dsa-interview-mastery", name: "DSA & Interview Mastery", description: "In-depth problem solving covering top interview patterns for product companies.", duration: "5 weeks", instructor: "Prashanti Vasi", level: "Advanced", programType: "Placement", bannerImage: "/expert-led-banner.jpg" },
    { _id: "system-design-cohort", name: "System Design & Architecture", description: "Scalable backend systems, caching, microservices, and distributed architecture.", duration: "4 weeks", instructor: "Prashanti Vasi", level: "Advanced", programType: "Placement", bannerImage: "/expert-led-banner.jpg" },
    { _id: "data-analytics-track", name: "Data Engineering & Analytics", description: "SQL, Python, ETL pipelines, and business intelligence interview preparation.", duration: "6 weeks", instructor: "Jyotsna", level: "Intermediate", programType: "Skill", bannerImage: "/expert-led-banner.jpg" },
    { _id: "cloud-devops-mastery", name: "Cloud & DevOps Career Track", description: "Docker, Kubernetes, AWS infrastructure, and CI/CD automated deployment pipelines.", duration: "6 weeks", instructor: "Lead Trainer", level: "Intermediate", programType: "Skill", bannerImage: "/expert-led-banner.jpg" },
    { _id: "ai-ml-bootcamp", name: "AI & Applied ML Track", description: "Machine learning algorithms, neural networks, PyTorch, and LLM application development.", duration: "8 weeks", instructor: "Prashanti Vasi", level: "Advanced", programType: "Skill", bannerImage: "/expert-led-banner.jpg" },
    { _id: "aptitude-reasoning-sprint", name: "Aptitude & Fast Problem Solving", description: "Speed math, quantitative reasoning, and logical ability for major campus drives.", duration: "3 weeks", instructor: "Lead Trainer", level: "Beginner", programType: "Placement", bannerImage: "/expert-led-banner.jpg" },
  ];

  useEffect(() => {
    const fetchCoursesAndPrograms = async () => {
      try {
        if (!cachedCourses) {
          setLoading(true);
        }
        const [backendCourses, programsRes] = await Promise.allSettled([
          courseAPI.getAllCourses(),
          programLearningAPI.getPublicPrograms(),
        ]);

        if (backendCourses.status === 'fulfilled' && Array.isArray(backendCourses.value)) {
          const adapted = backendCourses.value
            .map(course => dataAdapters.adaptCourse(course))
            .filter(isUserVisibleCourse);
          setCoursesData(adapted);
          writeCachedCourses(adapted);
        } else if (!cachedCourses) {
          setCoursesData(mockCoursesData);
        }

        if (programsRes.status === 'fulfilled' && Array.isArray(programsRes.value?.programs) && programsRes.value.programs.length > 0) {
          const combined = [...programsRes.value.programs];
          defaultTrainerPrograms.forEach(dp => {
            if (!combined.some(p => p._id === dp._id || p.name === dp.name)) {
              combined.push(dp);
            }
          });
          setPublicPrograms(combined);
        } else {
          setPublicPrograms(defaultTrainerPrograms);
        }
      } catch (fetchError) {
        console.error('Error fetching learn catalog:', fetchError);
        if (!cachedCourses) {
          setCoursesData(mockCoursesData);
          setPublicPrograms(defaultTrainerPrograms);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndPrograms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoinWaitlistClick = (program) => {
    setSelectedWaitlistProgram(program);
  };

  const handleProgramAction = (program) => {
    if (program.pricingType === 'Free' && program._id) {
      navigate(`/learn/programs/${program._id}`);
      return;
    }
    handleJoinWaitlistClick(program);
  };

  // Hook scroll boundaries trackers for Self-Paced Courses
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

  // Hook scroll boundaries trackers for Trainer-Led Programs
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

  const prefetchCourseTopics = (course) => {
    const topicCourseId = getCourseTopicsId(course);
    if (!topicCourseId || readCachedCourseDetails(topicCourseId)) return;

    courseAPI.getCourse(topicCourseId)
      .then((response) => writeCachedCourseDetails(topicCourseId, response.course || response))
      .catch(() => {});
  };

  const NavArrow = ({ direction, onClick }) => {
    const isLeft = direction === 'left';
    return (
      <button
        type="button"
        onClick={onClick}
        className={`absolute z-30 top-1/2 -translate-y-1/2 p-2 md:p-3.5 rounded-full border border-[#8ec8ff]/40 dark:border-[#6fbfff]/30 bg-white/95 dark:bg-[#0a1128]/95 text-[#3C83F6] dark:text-[#8fd9ff] shadow-[0_8px_30px_rgba(34,119,255,0.18)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:bg-[#dbf1ff] dark:hover:bg-[#122b5e] transition-colors duration-300 flex items-center justify-center cursor-pointer ${
          isLeft ? 'left-1 md:-left-4' : 'right-1 md:-right-4'
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

  const trainerProgramsList = publicPrograms.length > 0
    ? publicPrograms
    : defaultTrainerPrograms;

  return (
    <div className="w-full min-h-screen min-w-0 overflow-x-clip font-sans antialiased text-[#00113b] dark:text-[#8fd9ff] bg-transparent">
      <main className="z-10 min-w-0 px-4 sm:px-6 md:px-12 lg:px-16 pb-20 overflow-x-clip">
        <div className="max-w-[1600px] mx-auto space-y-12">

          {/* =========================================================
               01 — COURSES (Self-Paced Foundational Tracks - 2 Rows)
          ========================================================= */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-left">
              <div>
                <h3 className="text-xl md:text-2xl font-press-start tracking-tight uppercase hover-gradient-text">
                  COURSES
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Self-paced foundational tracks, syntax guides, and interactive problem sets.
                </p>
              </div>
            </div>

            {/* Styles for Courses cards matching learnlight.html & learndark.html */}
            <style dangerouslySetInnerHTML={{ __html: `
              .tl-learn-card {
                width: 100%;
                max-width: 360px;
                margin-left: auto;
                margin-right: auto;
                background: #ffffff;
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 12px 35px rgba(3, 4, 50, 0.08);
                position: relative;
                display: flex;
                flex-direction: column;
                transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
                text-align: left;
                cursor: pointer;
              }
              .tl-learn-card:hover {
                transform: translateY(-6px);
                box-shadow: 0 22px 50px rgba(3, 4, 50, 0.12);
              }
              .dark .tl-learn-card {
                background: #0b1238;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
              }
              .dark .tl-learn-card:hover {
                box-shadow: 0 24px 55px rgba(0, 0, 0, 0.38);
                border-color: rgba(137, 198, 56, 0.18);
              }
              .tl-card-banner {
                position: relative;
                height: 240px;
                overflow: hidden;
                background: #0d1117;
              }
              .dark .tl-card-banner {
                background: #0d1117;
              }
              .tl-card-banner img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: cover;
                object-position: center center;
                transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
              }
              .tl-learn-card:hover .tl-card-banner img {
                transform: scale(1.04);
              }
              .tl-category-badge {
                position: absolute;
                top: 16px;
                right: 16px;
                padding: 7px 12px;
                background: rgba(255, 255, 255, 0.94);
                color: #02107a;
                border-radius: 20px;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 12px rgba(3, 4, 50, 0.08);
                backdrop-filter: blur(10px);
                z-index: 2;
              }
              .dark .tl-category-badge {
                background: rgba(5, 11, 46, 0.88);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
              }
              .tl-card-content {
                background: #ffffff;
                padding: 25px 24px 23px;
                border-top-right-radius: 28px;
                margin-top: -12px;
                position: relative;
                flex: 1;
                display: flex;
                flex-direction: column;
                z-index: 1;
              }
              .dark .tl-card-content {
                background: #0b1238;
              }
              .tl-card-title {
                font-size: 21px;
                font-weight: 750;
                color: #02107a;
                margin-top: 4px;
                margin-bottom: 0;
                line-height: 1.25;
                letter-spacing: -0.5px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .dark .tl-card-title {
                color: #ffffff;
              }
              .tl-card-description {
                font-size: 13px;
                color: #02107a;
                line-height: 1.6;
                margin-top: 13px;
                margin-bottom: 21px;
                min-height: 62px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .dark .tl-card-description {
                color: #ffffff;
              }
              .tl-content-divider {
                width: 100%;
                height: 1px;
                background: rgba(2, 16, 122, 0.12);
                margin-bottom: 18px;
                margin-top: auto;
              }
              .dark .tl-content-divider {
                background: rgba(255, 255, 255, 0.12);
              }
              .tl-card-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .tl-price {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 23px;
                font-weight: 800;
                color: #89c638;
                letter-spacing: -0.7px;
                display: inline-flex;
                align-items: baseline;
                line-height: 1;
                transform: translateY(-9px);
                transition: color 0.25s ease;
              }
              .tl-price-type {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin-left: 4px;
                font-size: 9px;
                font-weight: 600;
                color: #89c638;
                transition: color 0.25s ease;
              }
              .tl-start-link {
                display: inline-flex;
                align-items: center;
                gap: 7px;
                color: #89c638;
                text-decoration: none;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: -0.1px;
                transition: color 0.25s ease, gap 0.35s cubic-bezier(0.22, 1, 0.36, 1);
              }
              .tl-start-link .tl-arrow {
                font-size: 18px;
                font-weight: 400;
                line-height: 1;
                color: #89c638;
                transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.25s ease;
              }
              .tl-learn-card:hover .tl-start-link {
                color: #02107a;
                gap: 10px;
              }
              .tl-learn-card:hover .tl-start-link .tl-arrow {
                color: #02107a;
                transform: translateX(3px);
              }
              .dark .tl-learn-card:hover .tl-start-link {
                color: #ffffff;
                gap: 10px;
              }
              .dark .tl-learn-card:hover .tl-start-link .tl-arrow {
                color: #ffffff;
                transform: translateX(3px);
              }
              @media (max-width: 500px) {
                .tl-card-banner {
                  height: 220px;
                }
                .tl-card-content {
                  padding: 22px 20px 21px;
                }
                .tl-card-title {
                  font-size: 19px;
                }
                .tl-card-description {
                  font-size: 12.5px;
                }
              }
            ` }} />

            <div className="relative px-2 group">
              <Carousel
                setApi={setSelfPacedApi}
                opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: true, duration: 40 }}
                className="w-full max-w-full"
              >
                <CarouselContent className="-ml-2 py-4">
                  {coursesData
                    .filter(course => course.courseType !== 'Trainer-led')
                    .map((course) => {
                      const rupee = '\u20B9';
                      const rawPrice = course.price || '';
                      const displayPrice = rawPrice && rawPrice !== 'Free' && rawPrice !== 'Coming Soon'
                        ? (rawPrice.includes('1499') || rawPrice.includes('399') ? `${rupee}${rawPrice.replace(/[^\d]/g, '')}` : rawPrice)
                        : `${rupee}399`;

                      return (
                        <CarouselItem
                          key={course.id}
                          className="basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/3 px-3"
                        >
                          <div
                            onMouseEnter={() => prefetchCourseTopics(course)}
                            onFocus={() => prefetchCourseTopics(course)}
                            onClick={() => {
                              prefetchCourseTopics(course);
                              navigate(getCourseTopicsPath(course));
                            }}
                            className="tl-learn-card h-full"
                          >
                            {/* IMAGE */}
                            <div className="tl-card-banner">
                              <img
                                src={getCourseImage(course)}
                                alt={course.title}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/c-programming.jpg';
                                }}
                              />
                              <div className="tl-category-badge">
                                Skill
                              </div>
                            </div>

                            {/* CONTENT */}
                            <div className="tl-card-content">
                              <h2 className="tl-card-title">
                                {course.title}
                              </h2>

                              <p className="tl-card-description">
                                {course.description}
                              </p>

                              <div className="tl-content-divider"></div>

                              {/* FOOTER */}
                              <div className="tl-card-footer">
                                <div className="tl-price">
                                  {displayPrice}
                                  <span className="tl-price-type">/ Year</span>
                                </div>

                                <span className="tl-start-link">
                                  Start Now
                                  <span className="tl-arrow">→</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      );
                    })}
                </CarouselContent>
              </Carousel>

              {canScrollPrevSelf && (
                <NavArrow direction="left" onClick={() => selfPacedApi?.scrollPrev()} />
              )}

              {canScrollNextSelf && (
                <NavArrow direction="right" onClick={() => selfPacedApi?.scrollNext()} />
              )}
            </div>
          </section>

          {/* =========================================================
               02 — PROGRAMS (Trainer-Led Cohorts - Single Row)
          ========================================================= */}
          <section
            ref={onlineCoursesSectionRef}
            className="space-y-6 pt-6 border-t border-black/10 dark:border-white/10"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-left">
              <div>
                <h3 className="text-xl md:text-2xl font-press-start tracking-tight uppercase hover-gradient-text">
                  PROGRAMS
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Intensive live cohorts, placement preparation sprints, and direct mentor guidance.
                </p>
              </div>
            </div>

            <div className="relative px-2 group">
              <Carousel
                setApi={setTrainerLedApi}
                opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: true, duration: 40 }}
                className="w-full max-w-full"
              >
                <CarouselContent className="-ml-2 py-4">
                  {trainerProgramsList.map((program) => (
                    <CarouselItem
                      key={program._id || program.id}
                      className="basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/3 px-3"
                    >
                      <div
                        className="dashboard-surface p-7 flex flex-col h-full transition-all duration-300 rounded-2xl group min-h-[340px] hover:-translate-y-1 border border-black/5 bg-white/40 shadow-sm dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-semibold ${levelTagStyles[program.level || 'Intermediate'] || 'bg-[#dff6e8] text-[#1f7d53] border border-[#b9e9c8]'}`}>
                            {program.programType || program.level || "Cohort"}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-[#00113b] dark:text-[#8ac7f3] transition-colors">
                            By {program.instructor || "Lead Trainer"}
                          </span>
                        </div>

                        <div className="mb-4 h-24 w-full rounded-xl border border-[#90c8ff]/40 dark:border-[#6cb7ec]/35 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                          <img
                            src={program.bannerImage || "/expert-led-banner.jpg"}
                            alt={program.name || program.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <h3 className="text-lg font-bold text-left text-[#00113b] dark:text-[#8fd9ff] group-hover:text-[#001b5c] dark:group-hover:text-[#9adfff] transition-colors mb-2">
                          {program.name || program.title}
                        </h3>

                        <p className="text-xs text-left text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                          {program.description}
                        </p>

                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 px-3 mb-6 border-t border-[#9fcfff]/45 dark:border-[#6bb8ec]/35 pt-4 mt-auto">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#00113b] dark:text-[#7cc3ee]" />
                            <span className="text-[11px] font-semibold text-[#00113b] dark:text-[#8fd9ff] whitespace-nowrap">
                              {program.duration || `${program.durationDays || 30} Days`}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <Calendar className="w-3.5 h-3.5 text-[#00113b] dark:text-[#7cc3ee]" />
                            <span className="text-[11px] font-semibold text-[#00113b] dark:text-[#8fd9ff] whitespace-nowrap">
                              Cohort Batches
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleProgramAction(program)}
                          className="w-full py-2.5 sm:py-3 flex items-center justify-center gap-2 rounded-xl bg-[#00113b] text-white text-xs sm:text-sm font-bold shadow-sm transition hover:bg-[#001b5c] dark:!bg-[#bceaff] dark:!text-[#020b23] dark:hover:!bg-[#daf0fa] cursor-pointer"
                        >
                          <span>{program.pricingType === 'Free' ? 'Explore Program' : 'Join Waitlist'}</span>
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
          </section>

        </div>
      </main>

      {/* Join Waitlist Modal */}
      <JoinWaitlistModal
        isOpen={Boolean(selectedWaitlistProgram)}
        onClose={() => setSelectedWaitlistProgram(null)}
        program={selectedWaitlistProgram}
      />
    </div>
  );
}
