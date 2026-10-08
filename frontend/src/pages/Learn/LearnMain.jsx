import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { courseAPI, dataAdapters, placementLearningAPI } from "../../services/api";
import { programLearningAPI } from "../../services/programLearningApi";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import JoinWaitlistModal from '../../components/Learn/JoinWaitlistModal';
import ScrollProgress from '../../components/ScrollProgress';
import { readCachedCourseDetails, writeCachedCourseDetails } from '../../utils/courseCache';
import { getProgramPriceLabel, isFreeProgramItem } from '../../utils/programDisplay';
import './learnPage.css';

const COURSES_CACHE_KEY = 'learn-courses-cache-v2';
const COURSES_CACHE_TTL_MS = 5 * 60 * 1000;

const normalizeCourseKey = (value = '') => value.toString().trim().toLowerCase();

const HIDDEN_COURSE_KEYS = new Set([
  '6995d2d6576b86926b74cc71',
  '6a0f089f28624d4a125064b0',
  'test course',
  'phase 2 course',
  'phase two course',
]);

const isUserVisibleCourse = (course) => {
  if (course?.status !== "Published") return false;

  const courseKeys = [
    course?.title,
    course?.id,
    course?._id,
    course?.courseId,
  ].map(normalizeCourseKey);

  if (courseKeys.some((key) => HIDDEN_COURSE_KEYS.has(key))) return false;

  const topics = Array.isArray(course?.topics)
    ? course.topics
    : Array.isArray(course?.topicIds)
      ? course.topicIds
      : [];
  return topics.length > 0 || Number(course?.numTopics) > 0;
};

const cleanDescription = (description) => {
  if (!description) return '';
  const trimmed = String(description).trim();
  if (/^no description( provided\.?)?$/i.test(trimmed)) {
    return '';
  }
  return trimmed;
};

const getCourseTopicsId = (course) => {
  return course?.id || course?._id || course?.courseId;
};

const getCourseImage = (course) => {
  if (course?.bannerImage) return course.bannerImage;
  if (course?.image && !course.image.includes('/python.jpg')) return course.image;
  const t = (course?.title || '').toLowerCase();
  if (t.includes('genai') || t.includes('generative ai')) return '/genai.jpg';
  if (t.includes('aptitude') || t.includes('quantitative') || t.includes('reasoning')) return '/aptitude.jpg';
  if (t.includes('fullstack') || t.includes('full stack') || t.includes('full-stack')) return '/java-fullstack.jpg';
  if (t.includes('java') && !t.includes('javascript')) return '/java.jpg';
  if (t.includes('python')) return '/python.jpg';
  if (t.includes('c programming') || t === 'c' || t.startsWith('c ')) return '/c-programming.jpg';
  return course?.image || '/python.jpg';
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

const getProgramImage = (program) => {
  if (program?.bannerImage && !program.bannerImage.includes('expert-led-banner') && !program.bannerImage.includes('auth-hero')) {
    return program.bannerImage;
  }
  if (program?.image && !program.image.includes('expert-led-banner') && !program.image.includes('auth-hero')) {
    return program.image;
  }
  const name = (program?.name || program?.title || '').toLowerCase();
  if (name.includes('genai') || name.includes('generative ai') || name.includes('ai &') || name.includes('ai/ml')) return '/genai.jpg';
  if (name.includes('aptitude') || name.includes('reasoning') || name.includes('math')) return '/aptitude.jpg';
  if (name.includes('full stack') || name.includes('fullstack') || name.includes('web bootcamp') || name.includes('backend')) return '/java-fullstack.jpg';
  if (name.includes('java') && !name.includes('javascript')) return '/java.jpg';
  if (name.includes('python')) return '/python.jpg';
  if (name.includes('c programming') || name === 'c' || name.startsWith('c ')) return '/c-programming.jpg';
  if (name.includes('dsa') || name.includes('interview') || name.includes('placement') || name.includes('sprint')) return '/c-programming.jpg';
  if (name.includes('system design') || name.includes('architecture') || name.includes('cloud') || name.includes('devops')) return '/java-fullstack.jpg';
  if (name.includes('data') || name.includes('analytics') || name.includes('engineering')) return '/python.jpg';
  return '/c-programming.jpg';
};

const isFreeCourseItem = (course) => {
  if (course?.accessType === 'Free') return true;
  if (course?.accessType === 'Paid') return false;
  const rawPrice = course?.price;
  return (
    !rawPrice ||
    rawPrice === 'Free' ||
    String(rawPrice).toLowerCase() === 'free' ||
    String(rawPrice).toLowerCase() === 'coming soon' ||
    course?.status === 'coming_soon' ||
    (!String(rawPrice).includes('₹') && isNaN(Number(rawPrice))) ||
    Number(rawPrice) === 0
  );
};

const STANDARD_SKILLS = [
  'Python', 'Java', 'C++', 'Data Structures', 'Algorithms',
  'Frontend', 'Backend', 'Full Stack', 'Machine Learning', 'GenAI',
  'SQL', 'DevOps', 'Cloud', 'System Design'
];

const LearnMain = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';

  const { isAuthenticated, user } = useAuth();
  const [placementLearning, setPlacementLearning] = useState(null);
  const [enrolledProgramIds, setEnrolledProgramIds] = useState(() => {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.programId) return new Set([String(parsed.programId)]);
      }
    } catch {}
    return new Set();
  });

  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'programs'
  const [courseFilter, setCourseFilter] = useState('all'); // 'all' | 'free' | 'skill' | 'placement'
  const [programFilter, setProgramFilter] = useState('all'); // 'all' | 'free' | 'self-paced' | 'trainer-led'
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedWaitlistProgram, setSelectedWaitlistProgram] = useState(null);

  const cachedCourses = readCachedCourses();
  const [coursesData, setCoursesData] = useState(cachedCourses || []);
  const [publicPrograms, setPublicPrograms] = useState([]);
  const [loading, setLoading] = useState(!cachedCourses);

  // Drawer filters state (applied)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedDeliveryTypes, setSelectedDeliveryTypes] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedAccessTypes, setSelectedAccessTypes] = useState([]);

  // Staged filter state (in drawer before apply)
  const [stagedSkills, setStagedSkills] = useState([]);
  const [stagedDeliveryTypes, setStagedDeliveryTypes] = useState([]);
  const [stagedLevels, setStagedLevels] = useState([]);
  const [stagedAccessTypes, setStagedAccessTypes] = useState([]);

  const openFilterDrawer = () => {
    setStagedSkills(selectedSkills);
    setStagedDeliveryTypes(selectedDeliveryTypes);
    setStagedLevels(selectedLevels);
    setStagedAccessTypes(selectedAccessTypes);
    setFilterDrawerOpen(true);
  };

  const handleApplyDrawerFilters = () => {
    setSelectedSkills(stagedSkills);
    setSelectedDeliveryTypes(stagedDeliveryTypes);
    setSelectedLevels(stagedLevels);
    setSelectedAccessTypes(stagedAccessTypes);
    setFilterDrawerOpen(false);
  };

  const handleClearDrawerFilters = () => {
    setStagedSkills([]);
    setStagedDeliveryTypes([]);
    setStagedLevels([]);
    setStagedAccessTypes([]);
    setSelectedSkills([]);
    setSelectedDeliveryTypes([]);
    setSelectedLevels([]);
    setSelectedAccessTypes([]);
    setFilterDrawerOpen(false);
  };

  const activeDrawerFiltersCount = useMemo(() => {
    return (
      selectedSkills.length +
      selectedDeliveryTypes.length +
      selectedLevels.length +
      selectedAccessTypes.length
    );
  }, [selectedSkills, selectedDeliveryTypes, selectedLevels, selectedAccessTypes]);

  // Aggregate dynamic skills from loaded courses
  const availableSkills = useMemo(() => {
    const set = new Set(STANDARD_SKILLS);
    coursesData.forEach((c) => {
      if (Array.isArray(c.skills)) {
        c.skills.forEach((s) => {
          if (s && s.trim()) set.add(s.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [coursesData]);

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
            .filter(isUserVisibleCourse)
            .filter(course => (Number(course.numTopics) > 0) || (Array.isArray(course.topics) && course.topics.length > 0) || (Array.isArray(course.topicIds) && course.topicIds.length > 0));
          setCoursesData(adapted);
          writeCachedCourses(adapted);
        }

        if (programsRes.status === 'fulfilled' && Array.isArray(programsRes.value?.programs)) {
          setPublicPrograms(programsRes.value.programs);
        }

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (isAuthenticated || token) {
          try {
            const [placementRes, assignedRes] = await Promise.allSettled([
              placementLearningAPI.getDashboard(),
              programLearningAPI.getAssignedPrograms(),
            ]);

            const idSet = new Set();
            if (placementRes.status === 'fulfilled' && placementRes.value?.hasPlacementLearning) {
              setPlacementLearning(placementRes.value);
              const pId = placementRes.value.program?.id || placementRes.value.program?._id;
              if (pId) idSet.add(String(pId));
            }

            if (assignedRes.status === 'fulfilled' && Array.isArray(assignedRes.value?.programs)) {
              assignedRes.value.programs.forEach((prog) => {
                if (prog?._id || prog?.id) {
                  idSet.add(String(prog._id || prog.id));
                }
              });
            }

            if (user?.programId) {
              idSet.add(String(user.programId));
            }

            if (idSet.size > 0) {
              setEnrolledProgramIds(idSet);
            }
          } catch {
            // Unenrolled or unauthorized for placement learning
          }
        }
      } catch (fetchError) {
        console.error('Error fetching learn catalog:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndPrograms();
  }, [isAuthenticated, user?.programId]);

  const prefetchCourseTopics = (course) => {
    const topicCourseId = getCourseTopicsId(course);
    if (!topicCourseId || readCachedCourseDetails(topicCourseId)) return;

    courseAPI.getCourse(topicCourseId)
      .then((response) => writeCachedCourseDetails(topicCourseId, response.course || response))
      .catch(() => {});
  };

  const handleCourseClick = (course) => {
    prefetchCourseTopics(course);
    navigate(`/learn/courses/${getCourseTopicsId(course)}`);
  };

  const handleProgramClick = (program) => {
    const progId = String(program._id || program.id || "");
    const activeProgId = String(placementLearning?.program?.id || placementLearning?.program?._id || "");
    const isEnrolledInProg = Boolean((activeProgId && activeProgId === progId) || enrolledProgramIds.has(progId));
    
    if (isEnrolledInProg) {
      if (activeProgId === progId) {
        const currentDay = placementLearning?.batch?.currentDay || placementLearning?.todayTopic?.day || 1;
        if (currentDay <= 1) {
          navigate("/dashboard");
        } else {
          const todayTopicHref = placementLearning?.todayTopic?.href || (
            placementLearning?.course?.id
              ? `/learn/courses/${placementLearning.course.id}/topics?day=${currentDay}`
              : "/dashboard"
          );
          navigate(todayTopicHref);
        }
      } else {
        navigate("/dashboard");
      }
      return;
    }

    if (program._id) {
      navigate(`/learn/programs/${program._id}`);
      return;
    }
    setSelectedWaitlistProgram(program);
  };

  // Filter & Search Logic for Courses
  const getCourseCategory = (course) => {
    const t = (course.title || '').toLowerCase();
    const l = (course.level || '').toLowerCase();
    if (t.includes('aptitude') || t.includes('placement') || l.includes('placement')) {
      return 'placement';
    }
    return 'skill';
  };

  const filteredCourses = useMemo(() => {
    return coursesData.filter(course => {
      const category = getCourseCategory(course);
      if (courseFilter === 'free') {
        if (!isFreeCourseItem(course)) return false;
      } else if (courseFilter !== 'all' && category !== courseFilter) {
        return false;
      }

      // Drawer: Skills filter
      if (selectedSkills.length > 0) {
        const courseSkills = (course.skills || []).map(s => s.toLowerCase());
        const hasSkillMatch = selectedSkills.some(s => courseSkills.includes(s.toLowerCase()));
        if (!hasSkillMatch) return false;
      }

      // Drawer: Delivery Type filter
      if (selectedDeliveryTypes.length > 0) {
        const delivery = (course.deliveryType || 'Self-Paced').toLowerCase();
        const matchesDelivery = selectedDeliveryTypes.some(d => d.toLowerCase() === delivery);
        if (!matchesDelivery) return false;
      }

      // Drawer: Level / Difficulty filter
      if (selectedLevels.length > 0) {
        const lvl = (course.level || 'Beginner').toLowerCase();
        const matchesLevel = selectedLevels.some(l => l.toLowerCase() === lvl);
        if (!matchesLevel) return false;
      }

      // Drawer: Access Type filter (Free / Paid)
      if (selectedAccessTypes.length > 0) {
        const isFree = isFreeCourseItem(course);
        const matchesAccess = selectedAccessTypes.some(a => {
          if (a === 'Free') return isFree;
          if (a === 'Paid') return !isFree;
          return true;
        });
        if (!matchesAccess) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const skillsText = (course.skills || []).join(' ');
        const searchTarget = `${course.title || ''} ${course.description || ''} ${category} ${skillsText} ${course.level || ''} ${course.deliveryType || ''}`.toLowerCase();
        if (!searchTarget.includes(q)) return false;
      }
      return true;
    });
  }, [coursesData, courseFilter, selectedSkills, selectedDeliveryTypes, selectedLevels, selectedAccessTypes, searchQuery]);

  // Filter & Search Logic for Programs
  const getProgramDeliveryType = (program) => {
    if (program.deliveryType) return program.deliveryType.toLowerCase();
    const t = (program.name || program.title || '').toLowerCase();
    if (t.includes('sprint') || t.includes('bootcamp') || t.includes('aptitude') || t.includes('full stack')) {
      return 'self-paced';
    }
    return 'trainer-led';
  };

  const filteredPrograms = useMemo(() => {
    return publicPrograms.filter(program => {
      const delivery = getProgramDeliveryType(program);
      if (programFilter === 'free') {
        if (!isFreeProgramItem(program)) return false;
      } else if (programFilter !== 'all' && delivery !== programFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const searchTarget = `${program.name || program.title || ''} ${program.description || ''} ${program.instructor || ''} ${delivery} ${program.programType || ''}`.toLowerCase();
        if (!searchTarget.includes(q)) return false;
      }
      return true;
    });
  }, [publicPrograms, programFilter, searchQuery]);

  return (
    <div className={`learn-page-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <ScrollProgress />

      <main className="page">
        {/* =========================
             SEARCH & FILTER (Directly below Navbar, above Heading)
        ========================= */}
        <div className="search-row-container">
          <div className="search-wrapper">
            <span className="search-icon" aria-hidden="true">
              <Search className="w-4 h-4" />
            </span>

            <input
              type="text"
              className="search-input"
              id="searchInput"
              placeholder="Search courses, programs, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {activeTab === 'courses' && (
            <button
              type="button"
              className={`drawer-trigger-btn ${activeDrawerFiltersCount > 0 ? 'active' : ''}`}
              onClick={openFilterDrawer}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeDrawerFiltersCount > 0 && (
                <span className="filter-badge-count">{activeDrawerFiltersCount}</span>
              )}
            </button>
          )}
        </div>

        {/* =========================
             HEADER
        ========================= */}
        <header className="academy-header" style={{ marginTop: '40px' }}>
          <div className="eyebrow">
            TECHLEARN
          </div>

          <h1 className="academy-title">
            ACADEMY
          </h1>

          <p className="academy-subtitle">
            Learn the skills to build things worth noticing.
          </p>
        </header>

        {/* =========================
             COURSE / PROGRAM SWITCH
        ========================= */}
        <div className="content-switch">
          <button
            type="button"
            className={`switch-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('courses');
              setSearchQuery('');
            }}
          >
            COURSES
          </button>

          <button
            type="button"
            className={`switch-button ${activeTab === 'programs' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('programs');
              setSearchQuery('');
            }}
          >
            PROGRAMS
          </button>
        </div>

        {/* ==================================================
             COURSES CATALOG
        ================================================== */}
        {activeTab === 'courses' && (
          <section className="catalog active" id="courses">
            <div className="catalog-header">
              <div className="catalog-heading-wrap">
                <h2 className="catalog-heading">
                  Learn at your own pace
                </h2>
              </div>

              {/* FILTERS */}
              <div className="filters">
                <button
                  type="button"
                  className={`filter-button ${courseFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCourseFilter('all')}
                >
                  ALL
                </button>

                <button
                  type="button"
                  className={`filter-button ${courseFilter === 'free' ? 'active' : ''}`}
                  onClick={() => setCourseFilter('free')}
                >
                  FREE
                </button>

                <button
                  type="button"
                  className={`filter-button ${courseFilter === 'skill' ? 'active' : ''}`}
                  onClick={() => setCourseFilter('skill')}
                >
                  SKILL
                </button>

                <button
                  type="button"
                  className={`filter-button ${courseFilter === 'placement' ? 'active' : ''}`}
                  onClick={() => setCourseFilter('placement')}
                >
                  PLACEMENT
                </button>
              </div>
            </div>

            {/* SKELETON LOADING STATE */}
            {loading ? (
              <div className="card-grid" id="courseGrid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <article key={i} className="card skeleton-shimmer" style={{ border: '1px solid var(--border)', minHeight: '380px' }}>
                    <div className="card-banner skeleton-shimmer" style={{ opacity: 0.6 }} />
                    <div className="card-content">
                      <div className="skeleton-shimmer" style={{ height: '22px', width: '70%', borderRadius: '6px', marginBottom: '12px' }} />
                      <div className="skeleton-shimmer" style={{ height: '14px', width: '90%', borderRadius: '4px', marginBottom: '8px' }} />
                      <div className="skeleton-shimmer" style={{ height: '14px', width: '60%', borderRadius: '4px', marginBottom: '16px' }} />
                      <div className="card-bottom">
                        <div className="content-divider" />
                        <div className="card-footer">
                          <div className="skeleton-shimmer" style={{ height: '18px', width: '40px', borderRadius: '4px' }} />
                          <div className="skeleton-shimmer" style={{ height: '18px', width: '60px', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="card-grid" id="courseGrid">
                {filteredCourses.map((course) => {
                  const rawPrice = course.price;
                  const isFree = isFreeCourseItem(course);
                  const displayPrice = isFree
                    ? 'FREE'
                    : String(rawPrice).startsWith('₹')
                    ? rawPrice
                    : `₹${rawPrice}`;

                  const categoryLabel = getCourseCategory(course) === 'placement' ? 'Placement' : 'Skill';

                  return (
                    <article
                      key={course.id || course._id}
                      className="card"
                      onMouseEnter={() => prefetchCourseTopics(course)}
                      onClick={() => handleCourseClick(course)}
                    >
                      <div className="card-banner">
                        <img
                          src={getCourseImage(course)}
                          alt={course.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/python.jpg';
                          }}
                        />
                        <div className="category-badge">
                          {categoryLabel}
                        </div>
                      </div>

                      <div className="card-content">
                        <h2 className="title">
                          {course.title}
                        </h2>

                        <p className="description">
                          {cleanDescription(course.description)}
                        </p>

                        {/* SKILLS TAGS */}
                        {Array.isArray(course.skills) && course.skills.length > 0 && (
                          <div className="card-skills-row">
                            {course.skills.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="card-skill-tag">{s}</span>
                            ))}
                            {course.skills.length > 3 && (
                              <span className="card-skill-tag">+{course.skills.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="card-bottom">
                          <div className="content-divider" />

                          <div className="card-footer">
                            {isFree ? (
                              <div className="free-label">FREE</div>
                            ) : (
                              <div className="price">{displayPrice}</div>
                            )}

                            <span className="start-link">
                              View Course
                              <span className="arrow">→</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" id="courseEmpty" style={{ display: 'block' }}>
                <h3>No courses found.</h3>
                <p>Try searching for another skill or clearing filters.</p>
              </div>
            )}
          </section>
        )}

        {/* ==================================================
             PROGRAMS CATALOG
        ================================================== */}
        {activeTab === 'programs' && (
          <section className="catalog active" id="programs">
            <div className="catalog-header">
              <div className="catalog-heading-wrap">
                <h2 className="catalog-heading">
                  Follow a structured path.
                </h2>
              </div>

              {/* FILTERS */}
              <div className="filters">
                <button
                  type="button"
                  className={`filter-button ${programFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setProgramFilter('all')}
                >
                  ALL
                </button>

                <button
                  type="button"
                  className={`filter-button ${programFilter === 'free' ? 'active' : ''}`}
                  onClick={() => setProgramFilter('free')}
                >
                  FREE
                </button>

                <button
                  type="button"
                  className={`filter-button ${programFilter === 'self-paced' ? 'active' : ''}`}
                  onClick={() => setProgramFilter('self-paced')}
                >
                  SELF-PACED
                </button>

                <button
                  type="button"
                  className={`filter-button ${programFilter === 'trainer-led' ? 'active' : ''}`}
                  onClick={() => setProgramFilter('trainer-led')}
                >
                  TRAINER-LED
                </button>
              </div>
            </div>

            {/* SKELETON OR PROGRAM CARDS */}
            {loading ? (
              <div className="card-grid" id="programGrid">
                {[1, 2, 3, 4].map((i) => (
                  <article key={i} className="card skeleton-shimmer" style={{ border: '1px solid var(--border)', minHeight: '380px' }}>
                    <div className="card-banner skeleton-shimmer" style={{ opacity: 0.6 }} />
                    <div className="card-content">
                      <div className="skeleton-shimmer" style={{ height: '22px', width: '70%', borderRadius: '6px', marginBottom: '12px' }} />
                      <div className="skeleton-shimmer" style={{ height: '14px', width: '90%', borderRadius: '4px', marginBottom: '8px' }} />
                      <div className="card-bottom">
                        <div className="content-divider" />
                        <div className="card-footer">
                          <div className="skeleton-shimmer" style={{ height: '18px', width: '40px', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : filteredPrograms.length > 0 ? (
              <div className="card-grid" id="programGrid">
                {filteredPrograms.map((program) => {
                  const isFree = isFreeProgramItem(program);
                  const displayPrice = getProgramPriceLabel(program);

                  const progId = String(program._id || program.id || "");
                  const activeProgId = String(placementLearning?.program?.id || placementLearning?.program?._id || "");
                  const isEnrolledInProg = Boolean((activeProgId && activeProgId === progId) || enrolledProgramIds.has(progId));
                  const currentDay = placementLearning?.batch?.currentDay || placementLearning?.todayTopic?.day || 1;
                  const isDay1 = currentDay <= 1;

                  const metaItems = program.metaTags || [
                    program.duration || `${program.durationDays || 30} Days`,
                    program.level || 'Roadmap',
                    program.programType || 'Projects'
                  ];

                  return (
                    <article
                      key={program._id || program.id}
                      className="card"
                      onClick={() => handleProgramClick(program)}
                    >
                      <div className="card-banner">
                        <img
                          src={getProgramImage(program)}
                          alt={program.name || program.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/c-programming.jpg';
                          }}
                        />
                        <div className="category-badge">
                          Program
                        </div>
                      </div>

                      <div className="card-content">
                        <h2 className="title">
                          {program.name || program.title}
                        </h2>

                        <p className="description">
                          {cleanDescription(program.description)}
                        </p>

                        <div className="card-bottom">
                          <div className="program-meta">
                            {metaItems.map((meta, idx) => (
                              <React.Fragment key={idx}>
                                <span className="meta-item">{meta}</span>
                                {idx < metaItems.length - 1 && (
                                  <span className="meta-dot">·</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          <div className="content-divider" />

                          <div className="card-footer">
                            {isEnrolledInProg ? (
                              <div className="free-label" style={{ backgroundColor: "#89c638", color: "#02052e" }}>ENROLLED</div>
                            ) : isFree ? (
                              <div className="free-label">FREE</div>
                            ) : (
                              <div className="price">{displayPrice}</div>
                            )}

                            <span className="start-link">
                              {isEnrolledInProg ? (isDay1 ? "Start Learning" : "Resume Learning") : "View Program"}
                              <span className="arrow">→</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" id="programEmpty" style={{ display: 'block' }}>
                <h3>No programs found.</h3>
                <p>Try searching for another program.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ==================================================
           FILTER DRAWER (Sliding from Right)
      ================================================== */}
      {/* Overlay */}
      <div
        onClick={() => setFilterDrawerOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] transition-opacity duration-250 ${
          filterDrawerOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        style={{ backgroundColor: "var(--page-bg)" }}
        className={`fixed right-0 top-0 bottom-0 w-[380px] max-w-[90%] z-[160] transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isDarkMode ? "text-white" : "text-[#00113b]"
        } ${filterDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-[20px] flex justify-between items-center border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-500" />
            <h3 className="font-['Press_Start_2P'] text-[11px] leading-[1.6]">Course Filters</h3>
          </div>
          <button
            onClick={() => setFilterDrawerOpen(false)}
            className="w-[32px] h-[32px] border-none bg-white/60 dark:bg-white/10 text-[#00113b] dark:text-white rounded-[7px] text-[18px] cursor-pointer flex items-center justify-center shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-[20px] space-y-[24px] learn-filter-scroll">
          {/* ACCESS TYPE */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[10px] opacity-75">Access Type</h4>
            <div className="flex flex-wrap gap-2">
              {['Free', 'Paid'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (stagedAccessTypes.includes(type)) {
                      setStagedAccessTypes(stagedAccessTypes.filter(t => t !== type));
                    } else {
                      setStagedAccessTypes([...stagedAccessTypes, type]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    stagedAccessTypes.includes(type)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* DELIVERY TYPE */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[10px] opacity-75">Delivery Type</h4>
            <div className="flex flex-wrap gap-2">
              {['Self-Paced', 'Structured', 'Trainer-Led'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (stagedDeliveryTypes.includes(type)) {
                      setStagedDeliveryTypes(stagedDeliveryTypes.filter(t => t !== type));
                    } else {
                      setStagedDeliveryTypes([...stagedDeliveryTypes, type]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    stagedDeliveryTypes.includes(type)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* LEVEL / DIFFICULTY */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[10px] opacity-75">Difficulty Level</h4>
            <div className="flex flex-wrap gap-2">
              {['Beginner', 'Basic', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    if (stagedLevels.includes(lvl)) {
                      setStagedLevels(stagedLevels.filter(l => l !== lvl));
                    } else {
                      setStagedLevels([...stagedLevels, lvl]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    stagedLevels.includes(lvl)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* SKILLS MULTI-SELECT */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] font-bold mb-[10px] opacity-75">Skills</h4>
            <div className="space-y-1.5 pr-1">
              {availableSkills.map((skill) => (
                <label
                  key={skill}
                  className="flex items-center gap-2.5 py-1 text-xs cursor-pointer opacity-85 hover:opacity-100"
                >
                  <input
                    type="checkbox"
                    checked={stagedSkills.includes(skill)}
                    onChange={(e) => {
                      if (e.target.checked) setStagedSkills([...stagedSkills, skill]);
                      else setStagedSkills(stagedSkills.filter(s => s !== skill));
                    }}
                    className="accent-blue-600 w-3.5 h-3.5 rounded"
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div className="p-[16px_20px] border-t border-black/10 dark:border-white/10 flex gap-[10px]">
          <button
            onClick={handleClearDrawerFilters}
            className="flex-1 h-[40px] rounded-[10px] text-xs font-bold cursor-pointer bg-white/70 dark:bg-white/10 border border-black/15 dark:border-white/10 text-current hover:bg-white dark:hover:bg-white/20 transition-all"
          >
            Clear All
          </button>
          <button
            onClick={handleApplyDrawerFilters}
            className="flex-1 h-[40px] rounded-[10px] text-xs font-bold cursor-pointer bg-blue-600 text-white border border-blue-600 shadow-md hover:bg-blue-500 active:scale-[0.98] transition-all"
          >
            Apply Filters
          </button>
        </div>
      </aside>

      {/* Join Waitlist Modal */}
      <JoinWaitlistModal
        isOpen={Boolean(selectedWaitlistProgram)}
        onClose={() => setSelectedWaitlistProgram(null)}
        program={selectedWaitlistProgram}
      />
    </div>
  );
};

export default LearnMain;
