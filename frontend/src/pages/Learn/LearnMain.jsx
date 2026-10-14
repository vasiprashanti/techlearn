import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { courseAPI, dataAdapters, placementLearningAPI } from "../../services/api";
import { programLearningAPI } from "../../services/programLearningApi";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import JoinWaitlistModal from '../../components/Learn/JoinWaitlistModal';
import ScrollProgress from '../../components/ScrollProgress';
import FilterDrawer from '../../components/common/FilterDrawer';
import StateFallback from '../../components/common/StateFallback';
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

// Language courses use the icon artwork on the blue banner; other subjects keep their banner image.
const getLanguageIcon = (text = '') => {
  const t = String(text).toLowerCase();
  if (t.includes('javascript') || /\bjs\b/.test(t)) return '/js.png';
  if (t.includes('java') && !t.includes('full')) return '/java.png';
  if (t.includes('python')) return '/python.png';
  if (t.includes('sql') || t.includes('database')) return '/sql.png';
  if (/\bc programming\b|^c$|^basics: c\b|^c /.test(t)) return '/c.png';
  return null;
};

const getCourseImage = (course) => {
  const icon = getLanguageIcon(course?.title);
  if (icon) return icon;
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
  const icon = getLanguageIcon(program?.name || program?.title);
  if (icon) return icon;
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

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const MODE_OPTIONS = [
  { value: 'all', label: 'All modes' },
  { value: 'self-paced', label: 'Self-paced' },
  { value: 'structured', label: 'Structured' },
  { value: 'trainer-led', label: 'Trainer-led' },
];

const DEFAULT_FILTERS = { level: 'all', mode: 'all', skills: [] };
const normalizeKey = (value = '') => String(value).trim().toLowerCase().replace(/[\s_]+/g, '-');
const isTrainerLedCourse = (course) => normalizeKey(course?.deliveryType || '') === 'trainer-led';
const isTrainerLedProgram = (program) => normalizeKey(program?.availability || '') === 'trainer-led';

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

  const [view, setView] = useState('explore'); // 'explore' | 'enrolled'
  const [catalogTab, setCatalogTab] = useState('all'); // 'all' | 'courses' | 'programs'
  const skillTab = 'all'; // the Your Skills / All Skills toggle was removed from the design
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [selectedWaitlistProgram, setSelectedWaitlistProgram] = useState(null);

  const cachedCourses = readCachedCourses();
  const [coursesData, setCoursesData] = useState(cachedCourses || []);
  const [publicPrograms, setPublicPrograms] = useState([]);
  const [loading, setLoading] = useState(!cachedCourses);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const activeFilterCount = (filters.level !== 'all' ? 1 : 0) + (filters.mode !== 'all' ? 1 : 0) + filters.skills.length;
  const hasActiveCriteria = activeFilterCount > 0 || Boolean(searchQuery.trim());

  // skill chips come from the skills actually attached to the catalog
  const availableSkills = useMemo(() => {
    const set = new Set();
    const add = (list) => (Array.isArray(list) ? list : []).forEach((skill) => {
      if (skill && String(skill).trim()) set.add(String(skill).trim());
    });
    coursesData.forEach((course) => add(course.skills));
    publicPrograms.forEach((program) => add((program.skills || program.skillTags)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [coursesData, publicPrograms]);

  const drawerGroups = useMemo(() => [
    { id: 'level', label: 'Difficulty level', type: 'radio', options: LEVEL_OPTIONS, defaultValue: 'all' },
    { id: 'mode', label: 'Learning mode', type: 'radio', options: MODE_OPTIONS, defaultValue: 'all' },
    { id: 'skills', label: 'Skills', type: 'chips', options: availableSkills },
  ], [availableSkills]);

  const clearAllCriteria = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  useEffect(() => {
    const fetchCoursesAndPrograms = async () => {
      try {
        if (!cachedCourses || reloadKey > 0) {
          setLoading(true);
        }
        const [backendCourses, programsRes] = await Promise.allSettled([
          courseAPI.getAllCourses(),
          programLearningAPI.getPublicPrograms(),
        ]);

        setLoadError(backendCourses.status === 'rejected' && programsRes.status === 'rejected');

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
  }, [isAuthenticated, user?.programId, reloadKey]);

  const prefetchCourseTopics = (course) => {
    const topicCourseId = getCourseTopicsId(course);
    if (!topicCourseId || readCachedCourseDetails(topicCourseId)) return;

    courseAPI.getCourse(topicCourseId)
      .then((response) => writeCachedCourseDetails(topicCourseId, response.course || response))
      .catch(() => {});
  };

  const handleCourseClick = (course) => {
    if (isTrainerLedCourse(course)) {
      navigate(`/waitlist/${getCourseTopicsId(course)}`);
      return;
    }
    prefetchCourseTopics(course);
    navigate(`/learn/courses/${getCourseTopicsId(course)}`);
  };

  const handleProgramClick = (program) => {
    const progId = String(program._id || program.id || "");
    const activeProgId = String(placementLearning?.program?.id || placementLearning?.program?._id || "");
    const isEnrolledInProg = Boolean((activeProgId && activeProgId === progId) || enrolledProgramIds.has(progId));

    if (!isEnrolledInProg && isTrainerLedProgram(program) && program._id) {
      navigate(`/waitlist/${program._id}`);
      return;
    }
    
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

  // Extract all user skills from profile, onboarding, or auth user
  const userSkills = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    const collected = new Set();
    const addValues = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === 'string' && item.trim()) {
            collected.add(item.trim().toLowerCase());
          }
        });
      } else if (typeof val === 'string') {
        val.split(/[,/]+/).forEach((item) => {
          if (item.trim()) collected.add(item.trim().toLowerCase());
        });
      }
    };

    addValues(user.skills);
    addValues(user.currentSkills);
    addValues(user.skillsOfInterest);
    addValues(user.learningGoal);
    addValues(user.targetRole);
    addValues(user.branch);

    return Array.from(collected);
  }, [isAuthenticated, user]);

  const matchesUserSkills = (skillList, text) => {
    if (userSkills.length === 0) return true;
    const lowered = (skillList || []).map((skill) => String(skill).toLowerCase());
    return userSkills.some((skill) => lowered.some((entry) => entry.includes(skill) || skill.includes(entry)) || text.includes(skill));
  };

  const matchesLevel = (level) => {
    if (filters.level === 'all') return true;
    const value = normalizeKey(level);
    return value === filters.level || (filters.level === 'beginner' && value === 'basic');
  };

  // Self-paced: self-paced courses + structured programs. Structured: structured programs only.
  // Trainer-led: trainer-led courses only.
  const courseMatchesMode = (course) => {
    if (filters.mode === 'all') return true;
    const mode = normalizeKey(course.deliveryType || 'Self-Paced');
    if (filters.mode === 'self-paced') return mode === 'self-paced';
    if (filters.mode === 'trainer-led') return mode === 'trainer-led';
    return false;
  };

  const programMatchesMode = (program) => {
    if (filters.mode === 'all') return true;
    const availability = normalizeKey(program.availability || 'Structured');
    if (filters.mode === 'self-paced' || filters.mode === 'structured') return availability === 'structured' || availability === 'both';
    return false;
  };

  const matchesSkillChips = (skillList, text) => {
    if (filters.skills.length === 0) return true;
    const lowered = (skillList || []).map((skill) => String(skill).toLowerCase());
    return filters.skills.some((skill) => lowered.includes(skill.toLowerCase()) || text.includes(skill.toLowerCase()));
  };

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return coursesData.filter((course) => {
      const text = `${course.title || ''} ${course.description || ''}`.toLowerCase();
      if (skillTab === 'your-skills' && isAuthenticated && !matchesUserSkills(course.skills, text)) return false;
      if (!matchesLevel(course.level || 'Beginner')) return false;
      if (!courseMatchesMode(course)) return false;
      if (!matchesSkillChips(course.skills, text)) return false;
      if (q) {
        const target = `${text} ${getCourseCategory(course)} ${(course.skills || []).join(' ')} ${course.level || ''} ${course.deliveryType || ''}`.toLowerCase();
        if (!target.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coursesData, filters, searchQuery, skillTab, isAuthenticated, userSkills]);

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return publicPrograms.filter((program) => {
      const text = `${program.name || program.title || ''} ${program.description || ''} ${program.instructor || ''}`.toLowerCase();
      if (skillTab === 'your-skills' && isAuthenticated && !matchesUserSkills((program.skills || program.skillTags), text)) return false;
      if (filters.level !== 'all' && !matchesLevel(program.level || program.difficulty || '')) return false;
      if (!programMatchesMode(program)) return false;
      if (!matchesSkillChips((program.skills || program.skillTags), text)) return false;
      if (q) {
        const target = `${text} ${program.availability || ''} ${program.programType || ''} ${((program.skills || program.skillTags) || []).join(' ')}`.toLowerCase();
        if (!target.includes(q)) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicPrograms, filters, searchQuery, skillTab, isAuthenticated, userSkills]);

  const isProgramEnrolled = (program) => {
    const progId = String(program._id || program.id || '');
    const activeProgId = String(placementLearning?.program?.id || placementLearning?.program?._id || '');
    return Boolean((activeProgId && activeProgId === progId) || enrolledProgramIds.has(progId));
  };

  // Enrolled view: only programs the learner is enrolled in (courses have no enrollment of their own)
  const enrolledPrograms = useMemo(
    () => filteredPrograms.filter(isProgramEnrolled),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredPrograms, enrolledProgramIds, placementLearning]
  );

  const visibleCourses = view === 'explore' && catalogTab !== 'programs' ? filteredCourses : [];
  const visiblePrograms = view === 'explore'
    ? (catalogTab !== 'courses' ? filteredPrograms : [])
    : (catalogTab !== 'courses' ? enrolledPrograms : []);
  const totalVisible = visibleCourses.length + visiblePrograms.length;

  const renderSkeletons = () => (
    <div className="card-grid" id="courseGrid">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <article key={i} className="card skeleton-shimmer" style={{ border: '1px solid var(--border)', minHeight: '355px' }}>
          <div className="card-banner skeleton-shimmer" style={{ opacity: 0.6 }} />
          <div className="card-content">
            <div className="skeleton-shimmer" style={{ height: '20px', width: '70%', borderRadius: '6px', marginBottom: '12px' }} />
            <div className="skeleton-shimmer" style={{ height: '12px', width: '90%', borderRadius: '4px', marginBottom: '8px' }} />
            <div className="skeleton-shimmer" style={{ height: '12px', width: '60%', borderRadius: '4px' }} />
          </div>
        </article>
      ))}
    </div>
  );

  const renderCourseCard = (course) => {
    const isFree = isFreeCourseItem(course);
    const rawPrice = course.price;
    const displayPrice = isFree ? 'FREE' : String(rawPrice).startsWith('₹') ? rawPrice : `₹${rawPrice}`;
    const categoryLabel = getCourseCategory(course) === 'placement' ? 'Placement' : 'Skill';
    return (
      <article
        key={`course-${course.id || course._id}`}
        className="card"
        onMouseEnter={() => prefetchCourseTopics(course)}
        onClick={() => handleCourseClick(course)}
      >
        <div className="card-banner">
          <img
            className={getCourseImage(course).endsWith('.png') ? 'banner-icon' : undefined}
            src={getCourseImage(course)}
            alt={course.title}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/python.jpg'; }}
          />
          <div className="category-badge">{categoryLabel}</div>
        </div>
        <div className="card-content">
          <h2 className="title">{course.title}</h2>
          <p className="description">{cleanDescription(course.description)}</p>
          {Array.isArray(course.skills) && course.skills.length > 0 && (
            <div className="card-skills-row">
              {course.skills.slice(0, 3).map((skill, idx) => <span key={idx} className="card-skill-tag">{skill}</span>)}
              {course.skills.length > 3 && <span className="card-skill-tag">+{course.skills.length - 3}</span>}
            </div>
          )}
          <div className="card-bottom">
            <div className="content-divider" />
            <div className="card-footer">
              {isFree ? <div className="free-label">FREE</div> : <div className="price">{displayPrice}</div>}
              <span className="start-link">{isTrainerLedCourse(course) ? 'Join Waitlist' : 'View Course'}<span className="arrow">→</span></span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderProgramCard = (program) => {
    const isFree = isFreeProgramItem(program);
    const displayPrice = getProgramPriceLabel(program);
    const enrolled = isProgramEnrolled(program);
    const currentDay = placementLearning?.batch?.currentDay || placementLearning?.todayTopic?.day || 1;
    const metaItems = program.metaTags || [
      program.duration || `${program.durationDays || 30} Days`,
      program.level || 'Roadmap',
      program.programType || 'Projects',
    ];
    return (
      <article key={`program-${program._id || program.id}`} className="card" onClick={() => handleProgramClick(program)}>
        <div className="card-banner">
          <img
            className={getProgramImage(program).endsWith('.png') ? 'banner-icon' : undefined}
            src={getProgramImage(program)}
            alt={program.name || program.title}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/c-programming.jpg'; }}
          />
          <div className="category-badge">Program</div>
        </div>
        <div className="card-content">
          <h2 className="title">{program.name || program.title}</h2>
          <p className="description">{cleanDescription(program.description)}</p>
          <div className="program-meta">
            {metaItems.map((meta, idx) => (
              <React.Fragment key={idx}>
                <span className="meta-item">{meta}</span>
                {idx < metaItems.length - 1 && <span className="meta-dot">·</span>}
              </React.Fragment>
            ))}
          </div>
          {Array.isArray((program.skills || program.skillTags)) && (program.skills || program.skillTags).length > 0 && (
            <div className="card-skills-row">
              {(program.skills || program.skillTags).slice(0, 4).map((skill, idx) => <span key={idx} className="card-skill-tag">{skill}</span>)}
              {(program.skills || program.skillTags).length > 4 && <span className="card-skill-tag">+{(program.skills || program.skillTags).length - 4}</span>}
            </div>
          )}
          <div className="card-bottom">
            <div className="content-divider" />
            <div className="card-footer">
              {enrolled ? <div className="free-label enrolled-label">ENROLLED</div> : isFree ? <div className="free-label">FREE</div> : <div className="price">{displayPrice}</div>}
              <span className="start-link">
                {enrolled ? (currentDay <= 1 ? 'Start Learning' : 'Resume Learning') : isTrainerLedProgram(program) ? 'Join Waitlist' : 'View Program'}
                <span className="arrow">→</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  // exactly one of these states shows; loading, error, locked, empty and not-found never overlap
  const renderCatalogBody = () => {
    if (view === 'enrolled' && !isAuthenticated) {
      return <StateFallback state="login-required" onAction={() => navigate('/login')} />;
    }
    if (loading) return renderSkeletons();
    if (loadError) return <StateFallback state="unavailable" onAction={() => setReloadKey((key) => key + 1)} />;
    if (totalVisible > 0) {
      return (
        <div className="card-grid" id="courseGrid">
          {visibleCourses.map(renderCourseCard)}
          {visiblePrograms.map(renderProgramCard)}
        </div>
      );
    }
    if (hasActiveCriteria) return <StateFallback state="no-matches" onAction={clearAllCriteria} />;
    if (view === 'enrolled') return <StateFallback state="not-enrolled" onAction={() => setView('explore')} />;
    if (catalogTab === 'programs') return <StateFallback state="no-programs" onAction={() => setCatalogTab('courses')} />;
    return <StateFallback state="no-courses" onAction={() => setCatalogTab('programs')} />;
  };

  return (
    <div className={`learn-page-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <ScrollProgress />

      <main className="page">
        <header className="academy-header">
          <div className="eyebrow">TECHLEARN</div>
          <h1 className="academy-title">ACADEMY</h1>
          <p className="academy-subtitle">Learn the skills to build things worth noticing.</p>
        </header>

        <div className="search-row-container">
          <div className="search-wrapper">
            <span className="search-icon" aria-hidden="true"><Search className="w-4 h-4" /></span>
            <input
              type="text"
              className="search-input"
              id="searchInput"
              placeholder="Search courses, programs, skills..."
              aria-label="Search courses and programs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`drawer-trigger-btn ${activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setFilterDrawerOpen(true)}
            aria-expanded={filterDrawerOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="filter-badge-count">{activeFilterCount}</span>}
          </button>
        </div>

        <div className="content-switch" role="group" aria-label="Learning catalogue view">
          <button type="button" className={`switch-button ${view === 'enrolled' ? 'active' : ''}`} aria-pressed={view === 'enrolled'} onClick={() => setView('enrolled')}>ENROLLED</button>
          <button type="button" className={`switch-button ${view === 'explore' ? 'active' : ''}`} aria-pressed={view === 'explore'} onClick={() => setView('explore')}>EXPLORE</button>
        </div>

        <div className="catalog-tabs" role="tablist" aria-label="Learning type">
          {[['all', 'All'], ['courses', 'Courses'], ['programs', 'Programs']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={catalogTab === key}
              className={`catalog-tab ${catalogTab === key ? 'active' : ''}`}
              onClick={() => setCatalogTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="catalog active" id="catalog">{renderCatalogBody()}</section>
      </main>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        groups={drawerGroups}
        applied={filters}
        onApply={(values) => { setFilters({ level: values.level, mode: values.mode, skills: values.skills }); setFilterDrawerOpen(false); }}
        onClear={() => { setFilters(DEFAULT_FILTERS); setFilterDrawerOpen(false); }}
        description="Find the right course or program for your learning goals."
      />

      <JoinWaitlistModal
        isOpen={Boolean(selectedWaitlistProgram)}
        onClose={() => setSelectedWaitlistProgram(null)}
        program={selectedWaitlistProgram}
      />
    </div>
  );
};

export default LearnMain;
