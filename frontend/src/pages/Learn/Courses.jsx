import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Clock, ArrowRight, ArrowLeft, Code } from "lucide-react";
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

  const [coursesData, setCoursesData] = useState(cachedCourses || []);
  const [publicPrograms, setPublicPrograms] = useState([]);
  const [loading, setLoading] = useState(!cachedCourses);

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
          setCoursesData([]);
        }

        setPublicPrograms(
          programsRes.status === 'fulfilled' && Array.isArray(programsRes.value?.programs)
            ? programsRes.value.programs
            : []
        );
      } catch (fetchError) {
        console.error('Error fetching learn catalog:', fetchError);
        if (!cachedCourses) {
          setCoursesData([]);
        }
        setPublicPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndPrograms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoinWaitlistClick = (program) => {
    setSelectedWaitlistProgram(program);
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

  const trainerProgramsList = publicPrograms;

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

            <div className="relative px-2 group">
              {coursesData.filter(course => course.courseType !== 'Trainer-led').length === 0 ? (
                <div className="dashboard-surface rounded-2xl border border-black/5 p-6 text-sm text-slate-600 dark:border-[#15366f]/45 dark:text-slate-300">
                  No self-paced courses are available right now. Check back soon for the next release.
                </div>
              ) : (
              <Carousel
                setApi={setSelfPacedApi}
                opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: true, duration: 40 }}
                className="w-full max-w-full"
              >
                <CarouselContent className="-ml-2 py-4">
                  {(() => {
                    const selfPacedCourses = coursesData.filter(course => course.courseType !== 'Trainer-led');
                    const groupedSelfPaced = [];
                    for (let i = 0; i < selfPacedCourses.length; i += 2) {
                      groupedSelfPaced.push(selfPacedCourses.slice(i, i + 2));
                    }
                    return groupedSelfPaced.map((pair, index) => (
                      <CarouselItem
                        key={index}
                        className="basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 px-3"
                      >
                        <div className="flex flex-col gap-4">
                          {pair.map((course) => (
                            <div
                              key={course.id}
                              onMouseEnter={() => prefetchCourseTopics(course)}
                              onFocus={() => prefetchCourseTopics(course)}
                              onClick={() => {
                                prefetchCourseTopics(course);
                                navigate(getCourseTopicsPath(course));
                              }}
                              className="dashboard-surface group p-3.5 md:p-4 transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[160px] md:min-h-[180px] relative overflow-hidden hover:-translate-y-1 h-[160px] md:h-[180px] rounded-2xl border border-black/5 bg-white/40 shadow-[0_8px_20px_rgba(60,131,246,0.04)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)]"
                            >
                              <div className="relative z-10 flex items-start justify-between mb-3">
                                <div className="dashboard-icon-badge group-hover:scale-105 transition-transform duration-500 p-1.5 bg-[#3C83F6]/10 rounded-lg">
                                  <Code className="w-4 h-4 text-[#3C83F6] dark:text-[#8fd9ff]" />
                                </div>
                              </div>

                              <div className="relative z-10 mt-auto text-left">
                                <h3 className="text-sm md:text-base font-bold text-[#00113b] dark:text-[#8fd9ff] group-hover:text-[#001b5c] dark:group-hover:text-[#96ddff] transition-colors mb-1.5 leading-snug line-clamp-2">
                                  {course.title}
                                </h3>
                                <p className="text-[11px] md:text-xs text-[#00113b] dark:text-[#7fb8e2] leading-relaxed line-clamp-2">
                                  {course.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CarouselItem>
                    ));
                  })()}
                </CarouselContent>
              </Carousel>
              )}

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
                  Published learning paths from the TechLearn program catalog.
                </p>
              </div>
            </div>

            <div className="relative px-2 group">
              {trainerProgramsList.length === 0 ? (
                <div className="dashboard-surface rounded-2xl border border-black/5 p-6 text-sm text-slate-600 dark:border-[#15366f]/45 dark:text-slate-300">
                  There are no trainer-led programs open for enrollment right now. Join the waitlist when a program is published.
                </div>
              ) : (
              <Carousel
                setApi={setTrainerLedApi}
                opts={{ align: "start", loop: false, dragFree: false, slidesToScroll: 1, watchDrag: true, duration: 40 }}
                className="w-full max-w-full"
              >
                <CarouselContent className="-ml-2 py-4">
                  {trainerProgramsList.map((program) => {
                    const programId = program._id || program.id;
                    const isFreeProgram = program.pricingType === "Free";
                    const typeStyles = program.programType === "Placement"
                      ? "bg-[#dff6e8] text-[#1f7d53] border border-[#b9e9c8]"
                      : "bg-[#e4f0ff] text-[#2456a6] border border-[#b7d5ff]";

                    return (
                    <CarouselItem
                      key={programId}
                      className="basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3 xl:basis-1/3 px-3"
                    >
                      <div
                        className="dashboard-surface p-7 flex flex-col h-full transition-all duration-300 rounded-2xl group min-h-[320px] hover:-translate-y-1 border border-black/5 dark:border-[#15366f]/45"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-semibold ${typeStyles}`}>
                            {program.programType}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-[#00113b] dark:text-[#8ac7f3] transition-colors">
                            {isFreeProgram ? "Open access" : "Enrollment required"}
                          </span>
                        </div>

                        <div className="mb-5 flex min-h-20 items-center rounded-xl border border-[#90c8ff]/40 bg-[#eaf5ff] px-5 dark:border-[#6cb7ec]/35 dark:bg-[#0b2552]">
                          <span className="font-press-start text-[10px] uppercase tracking-[0.14em] text-[#2456a6] dark:text-[#bceaff]">
                            {program.programType} learning path
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-left text-[#00113b] dark:text-[#8fd9ff] group-hover:text-[#001b5c] dark:group-hover:text-[#9adfff] transition-colors mb-2">
                          {program.name}
                        </h3>

                        <p className="text-xs text-left text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                          {program.description || "Explore this published learning path and its available resources."}
                        </p>

                        <div className="flex items-center justify-between gap-4 border-t border-[#9fcfff]/45 pt-4 mt-auto dark:border-[#6bb8ec]/35">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-[#00113b] dark:text-[#7cc3ee]" />
                            <span className="text-[11px] font-semibold text-[#00113b] dark:text-[#8fd9ff] whitespace-nowrap">
                              {program.duration || (program.durationDays ? `${program.durationDays} Days` : "Duration pending")}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#00113b] dark:text-[#8fd9ff] whitespace-nowrap">
                            {isFreeProgram ? "Free" : (program.programFee > 0 ? `₹${program.programFee}` : "View details")}
                          </span>
                        </div>

                        {isFreeProgram ? (
                          <Link
                            to={`/learn/programs/${programId}`}
                            className="mt-5 w-full py-2.5 sm:py-3 flex items-center justify-center gap-2 rounded-xl bg-[#00113b] text-white text-xs sm:text-sm font-bold shadow-sm transition hover:bg-[#001b5c] dark:!bg-[#bceaff] dark:!text-[#020b23] dark:hover:!bg-[#daf0fa]"
                          >
                            <span>Explore Program</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoinWaitlistClick(program)}
                            className="mt-5 w-full py-2.5 sm:py-3 flex items-center justify-center gap-2 rounded-xl bg-[#00113b] text-white text-xs sm:text-sm font-bold shadow-sm transition hover:bg-[#001b5c] dark:!bg-[#bceaff] dark:!text-[#020b23] dark:hover:!bg-[#daf0fa] cursor-pointer"
                          >
                            <span>Join Waitlist</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
              )}

              {canScrollPrevTrainer && (
                <NavArrow direction="left" onClick={() => trainerLedApi?.scrollPrev()} />
              )}

              {canScrollNextTrainer && (
                <NavArrow direction="right" onClick={() => trainerLedApi?.scrollNext()} />
              )}
            </div>
          </section>

          <section aria-labelledby="free-resources-heading" className="space-y-5">
            <div>
              <p className="font-press-start text-[9px] uppercase tracking-[0.18em] text-[#3c83f6] dark:text-[#bceaff]">KEEP EXPLORING</p>
              <h2 id="free-resources-heading" className="mt-2 text-2xl font-black tracking-tight text-[#00113b] dark:text-white sm:text-3xl">Free resources</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Browse practical material before you decide what to learn next.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { href: "/resources/roadmaps", title: "Roadmaps", description: "See a clear path from fundamentals to interview readiness." },
                { href: "/resources/resume-templates", title: "Resume templates", description: "Use practical templates to improve your next application." },
                { href: "/learn/interview-questions", title: "Interview questions", description: "Explore role and company-focused questions at your pace." },
              ].map((resource) => (
                <Link key={resource.href} to={resource.href} className="dashboard-surface group rounded-2xl border border-black/5 p-5 transition hover:-translate-y-0.5 hover:border-[#3c83f6]/40 dark:border-[#15366f]/45">
                  <h3 className="text-base font-extrabold text-[#00113b] dark:text-white">{resource.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#2563eb] dark:text-[#bceaff]">Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
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
