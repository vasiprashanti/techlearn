import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { courseAPI, dataAdapters } from "../../services/api";
import { programLearningAPI } from "../../services/programLearningApi";
import { useTheme } from '../../context/ThemeContext';
import JoinWaitlistModal from '../../components/Learn/JoinWaitlistModal';
import ScrollProgress from '../../components/ScrollProgress';
import { readCachedCourseDetails, writeCachedCourseDetails } from '../../utils/courseCache';
import './learnPage.css';

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
  const rawPrice = course?.price;
  return (
    !rawPrice ||
    rawPrice === 'Free' ||
    String(rawPrice).toLowerCase() === 'free' ||
    String(rawPrice).toLowerCase() === 'coming soon' ||
    course?.status === 'coming_soon' ||
    (!String(rawPrice).includes('₹') && isNaN(Number(rawPrice)))
  );
};

const isFreeProgramItem = (program) => {
  // Check pricingType field (case-insensitive)
  if (String(program?.pricingType || '').toLowerCase() === 'free') return true;
  // Check programFee === 0 (explicitly set to free)
  if (program?.programFee !== undefined && program?.programFee !== null && Number(program?.programFee) === 0) return true;
  // Check price string field
  const rawPrice = program?.price;
  if (!rawPrice) return false;
  const p = String(rawPrice).toLowerCase().trim();
  return p === 'free' || p === 'FREE' || p === '₹0' || p === '0';
};

const LearnMain = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme === 'dark';

  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'programs'
  const [courseFilter, setCourseFilter] = useState('all'); // 'all' | 'free' | 'skill' | 'placement'
  const [programFilter, setProgramFilter] = useState('all'); // 'all' | 'free' | 'self-paced' | 'trainer-led'
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedWaitlistProgram, setSelectedWaitlistProgram] = useState(null);

  const cachedCourses = readCachedCourses();
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
            .filter(isUserVisibleCourse)
            .filter(course => (Number(course.numTopics) > 0) || (Array.isArray(course.topics) && course.topics.length > 0) || (Array.isArray(course.topicIds) && course.topicIds.length > 0));
          setCoursesData(adapted);
          writeCachedCourses(adapted);
        }

        if (programsRes.status === 'fulfilled' && Array.isArray(programsRes.value?.programs)) {
          setPublicPrograms(programsRes.value.programs);
        }
      } catch (fetchError) {
        console.error('Error fetching learn catalog:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndPrograms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (program.pricingType === 'Free' && program._id) {
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

  const filteredCourses = coursesData.filter(course => {
    const category = getCourseCategory(course);
    if (courseFilter === 'free') {
      if (!isFreeCourseItem(course)) return false;
    } else if (courseFilter !== 'all' && category !== courseFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const searchTarget = `${course.title || ''} ${course.description || ''} ${category}`.toLowerCase();
      if (!searchTarget.includes(q)) return false;
    }
    return true;
  });

  // Filter & Search Logic for Programs
  const getProgramDeliveryType = (program) => {
    if (program.deliveryType) return program.deliveryType.toLowerCase();
    const t = (program.name || program.title || '').toLowerCase();
    if (t.includes('sprint') || t.includes('bootcamp') || t.includes('aptitude') || t.includes('full stack')) {
      return 'self-paced';
    }
    return 'trainer-led';
  };

  const filteredPrograms = publicPrograms.filter(program => {
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

  return (
    <div className={`learn-page-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <ScrollProgress />

      <main className="page">
        {/* =========================
             HEADER
        ========================= */}
        <header className="academy-header">
          <div className="eyebrow">
            TECHLEARN
          </div>

          <h1 className="academy-title">
            ACADEMY
          </h1>

          <p className="academy-subtitle">
            Learn the skills to build things worth noticing.
          </p>

          {/* SEARCH */}
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

            {/* COURSE CARDS GRID */}
            {filteredCourses.length > 0 ? (
              <div className="card-grid" id="courseGrid">
                {filteredCourses.map((course) => {
                  const rawPrice = course.price;
                  const isFree =
                    !rawPrice ||
                    rawPrice === 'Free' ||
                    String(rawPrice).toLowerCase() === 'free' ||
                    String(rawPrice).toLowerCase() === 'coming soon' ||
                    course.status === 'coming_soon' ||
                    (!String(rawPrice).includes('₹') && isNaN(Number(rawPrice)));
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
                <p>Try searching for another skill.</p>
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

            {/* PROGRAM CARDS GRID */}
            {filteredPrograms.length > 0 ? (
              <div className="card-grid" id="programGrid">
                {filteredPrograms.map((program) => {
                  const rawPrice = program.price || (program.pricingType === 'Free' ? 'FREE' : '₹399');
                  const isFree = !rawPrice || rawPrice === 'FREE' || String(rawPrice).toLowerCase() === 'free' || program.pricingType === 'Free';
                  const displayPrice = isFree
                    ? 'FREE'
                    : String(rawPrice).startsWith('₹')
                    ? rawPrice
                    : `₹${rawPrice}`;

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
                            {isFree ? (
                              <div className="free-label">FREE</div>
                            ) : (
                              <div className="price">{displayPrice}</div>
                            )}

                            <span className="start-link">
                              View Program
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
