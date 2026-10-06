import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import API from "../../api/client";
import { courseAPI, dataAdapters } from "../../services/api";

const STORAGE_KEY = "techlearn-contextual-onboarding";

// ---------------- Catalog & Options Definitions ----------------

// Learn a Skill Options
const SKILL_CATALOG = [
  "C", "C++", "Java", "Python", "JavaScript", "Web Development",
  "DSA", "SQL", "AI/ML", "Generative AI", "Aptitude", "Other"
];

const SKILL_GOAL_OPTIONS = [
  "Learn Fundamentals",
  "Build Practical Skills",
  "Get Certified"
];

const SKILL_LEVEL_OPTIONS = [
  "Beginner",
  "Basic",
  "Intermediate",
  "Advanced"
];

const SKILL_LEARNING_PREFERENCES = [
  "Learn at my own pace",
  "Follow a structured plan",
  "Learn with a trainer"
];

// Get Job-Ready Options
const JOB_OPPORTUNITY_OPTIONS = [
  "On-campus",
  "Off-campus",
  "Both"
];

const JOB_ROLE_OPTIONS = [
  "Software Developer",
  "Java Developer",
  "Full Stack Developer",
  "Python Developer",
  "Data Analyst",
  "QA / Test Engineer",
  "Other"
];

const JOB_COMPANY_OPTIONS = [
  "TCS",
  "Infosys",
  "Accenture",
  "Wipro",
  "Cognizant",
  "Capgemini",
  "Amazon",
  "Deloitte",
  "Other"
];

const JOB_LEVEL_OPTIONS = [
  "Beginner",
  "Basic",
  "Intermediate",
  "Advanced"
];

const JOB_SKILL_OPTIONS = [
  "C", "C++", "Java", "Python", "JavaScript", "Web Development",
  "DSA", "SQL", "AI/ML", "Generative AI", "Aptitude", "Other"
];

const JOB_LEARNING_PREFERENCES = [
  "Learn at my own pace",
  "Follow a structured plan",
  "Learn with a trainer"
];

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
  if (!course) return '';
  return (
    COURSE_TOPIC_ID_OVERRIDES[normalizeCourseKey(course.title)] ||
    COURSE_TOPIC_ID_OVERRIDES[normalizeCourseKey(course.id)] ||
    course.id ||
    course._id
  );
};

const getCourseImage = (course) => {
  if (!course) return '/python.jpg';
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

const mockFallbackCourses = [
  { id: "6890c2acbc09eb4b5c346b9b", title: "C Programming", description: "Master the fundamentals of C programming and memory concepts", status: "available", image: "/c-programming.jpg", price: "Free" },
  { id: "6890ec81950225df57310f52", title: "Python Programming", description: "Learn Python programming from basics to advanced concepts", status: "available", image: "/python.jpg", price: "Free" },
  { id: "6890f09830551d88a325f623", title: "Java Programming", description: "Master Java programming and object-oriented concepts", status: "available", image: "/java.jpg", price: "Free" },
  { id: "dsa", title: "Data Structures & Algorithms", description: "Master DSA concepts for coding interviews and problem solving", status: "available", image: "/dsa.png", price: "Free" },
  { id: "mysql", title: "MySQL Database", description: "Learn database design, queries, and management with MySQL", status: "available", image: "/mysql.png", price: "Free" }
];

export default function ContextualOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, setSession } = useAuth();
  const { refetchUserData } = useUser();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const urlIntent = searchParams.get("intent") || location.state?.intent || null;

  // Selected onboarding flow type: null (undecided), "skill", or "job-ready"
  const [flowType, setFlowType] = useState(() => {
    if (urlIntent === "skill") return "skill";
    if (urlIntent === "placement" || urlIntent === "job-ready") return "job-ready";
    return null;
  });

  // Step counter (1-indexed for the questions in the selected path; step 0 if flowType is null)
  const [step, setStep] = useState(() => {
    if (urlIntent === "skill" || urlIntent === "placement" || urlIntent === "job-ready") return 1;
    return 0;
  });

  // Skill state
  const [skill, setSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [skillGoal, setSkillGoal] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [skillPreference, setSkillPreference] = useState("");

  // Job-Ready state
  const [jobOpportunity, setJobOpportunity] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [customJobRole, setCustomJobRole] = useState("");
  const [jobCompanies, setJobCompanies] = useState([]);
  const [customJobCompany, setCustomJobCompany] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [jobSkills, setJobSkills] = useState([]);
  const [customJobSkill, setCustomJobSkill] = useState("");
  const [jobPreference, setJobPreference] = useState("");

  // Recommendation & loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Exit feedback state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");

  const effectiveSkill = (skill === "Other" ? customSkill : skill).trim();
  const effectiveJobRole = (jobRole === "Other" ? customJobRole : jobRole).trim();

  // Total questions per path
  const totalQuestions = flowType === "skill" ? 4 : flowType === "job-ready" ? 6 : 1;

  // Toggle helpers for multi-select
  const handleToggleJobCompany = (item) => {
    setError("");
    setJobCompanies((prev) => {
      if (prev.includes(item)) {
        return prev.filter((c) => c !== item);
      }
      return [...prev, item];
    });
  };

  const handleToggleJobSkill = (item) => {
    setError("");
    setJobSkills((prev) => {
      if (prev.includes(item)) {
        return prev.filter((s) => s !== item);
      }
      return [...prev, item];
    });
  };

  // Check validity for current step
  const isCurrentStepValid = () => {
    if (step === 0) {
      return !!flowType;
    }
    if (flowType === "skill") {
      if (step === 1) return skill === "Other" ? !!customSkill.trim() : !!skill;
      if (step === 2) return !!skillGoal;
      if (step === 3) return !!skillLevel;
      if (step === 4) return !!skillPreference;
    } else if (flowType === "job-ready") {
      if (step === 1) return !!jobOpportunity;
      if (step === 2) return jobRole === "Other" ? !!customJobRole.trim() : !!jobRole;
      if (step === 3) {
        if (jobCompanies.length === 0) return false;
        if (jobCompanies.includes("Other") && !customJobCompany.trim()) return false;
        return true;
      }
      if (step === 4) return !!jobLevel;
      if (step === 5) {
        if (jobSkills.length === 0) return false;
        if (jobSkills.includes("Other") && !customJobSkill.trim()) return false;
        return true;
      }
      if (step === 6) return !!jobPreference;
    }
    return true;
  };

  // Find match logic
  const finish = async () => {
    setLoading(true);
    setError("");

    // Prepare answers payload
    const effectiveCompanies = jobCompanies.map((c) => (c === "Other" ? customJobCompany.trim() : c)).filter(Boolean);
    const effectiveSkillsList = jobSkills.map((s) => (s === "Other" ? customJobSkill.trim() : s)).filter(Boolean);

    const answersPayload = flowType === "skill"
      ? {
          type: "skill",
          skill: effectiveSkill,
          goal: skillGoal,
          level: skillLevel,
          learningPreference: skillPreference,
        }
      : {
          type: "job-ready",
          opportunityType: jobOpportunity,
          role: effectiveJobRole,
          companies: effectiveCompanies,
          level: jobLevel,
          skills: effectiveSkillsList,
          learningPreference: jobPreference,
        };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answersPayload));

      const [programsRes, backendCoursesRes] = await Promise.allSettled([
        API.get("/api/programs/public"),
        courseAPI.getAllCourses(),
      ]);

      const catalog = programsRes.status === "fulfilled" ? (programsRes.value?.data?.programs || []) : [];
      let availableCourses = mockFallbackCourses;
      if (backendCoursesRes.status === "fulfilled" && Array.isArray(backendCoursesRes.value)) {
        const adapted = backendCoursesRes.value
          .map((c) => dataAdapters.adaptCourse(c))
          .filter(isUserVisibleCourse);
        if (adapted.length > 0) availableCourses = adapted;
      }

      if (flowType === "skill") {
        const normalizedSkill = effectiveSkill.toLowerCase();
        const directCourseMatch = availableCourses.find((c) => {
          const title = (c.title || "").toLowerCase();
          return (
            title === normalizedSkill ||
            title.includes(normalizedSkill) ||
            normalizedSkill.includes(title) ||
            (normalizedSkill === "c" && (title === "c programming" || title.startsWith("c ")))
          );
        });

        // Search programs
        const sameSkillPrograms = catalog.filter((p) => {
          if (p.programType !== "Skill") return false;
          const tags = [...(p.skillTags || []), p.name, p.description].join(" ").toLowerCase();
          return tags.includes(normalizedSkill);
        });

        let bestProgramMatch = null;
        if (sameSkillPrograms.length > 0) {
          const scored = sameSkillPrograms.map((program) => {
            const tags = (program.skillTags || []).map((tag) => String(tag).toLowerCase());
            const goals = (program.learningGoals || []).map((item) => String(item).toLowerCase());
            let score = 0;
            if (tags.includes(normalizedSkill)) score += 4;
            if (goals.some((item) => item.includes(skillGoal.toLowerCase()))) score += 2;
            const courseLevels = (program.courseIds || []).map((course) => String(course.level || "").toLowerCase());
            if (courseLevels.includes(skillLevel.toLowerCase())) score += 3;
            return { program, score };
          }).sort((a, b) => b.score - a.score)[0];
          bestProgramMatch = scored ? scored.program : null;
        }

        if (directCourseMatch) {
          setResult({
            itemType: "course",
            matchedCourse: directCourseMatch,
            program: bestProgramMatch,
            matchType: "exact",
          });
        } else if (bestProgramMatch) {
          const attached = bestProgramMatch.courseIds?.[0] || availableCourses[0];
          const adaptedAttached = attached && typeof attached === "object"
            ? (attached.title ? attached : dataAdapters.adaptCourse(attached))
            : availableCourses[0];
          setResult({
            itemType: "program",
            matchedCourse: adaptedAttached || availableCourses[0],
            program: bestProgramMatch,
            matchType: "exact",
          });
        } else if (availableCourses.length > 0) {
          setResult({
            itemType: "course",
            matchedCourse: availableCourses[0],
            program: null,
            matchType: "closest",
          });
        } else {
          setResult({ matchType: "none" });
        }
      } else {
        // Job-Ready Flow
        const normalizedRole = effectiveJobRole.toLowerCase();
        const rolePlacementPrograms = catalog.filter((p) => {
          if (p.programType !== "Placement") return false;
          const searchSpace = [...(p.targetRoles || []), ...(p.targetCompanies || []), p.name, p.description].join(" ").toLowerCase();
          return searchSpace.includes(normalizedRole) || effectiveCompanies.some((c) => searchSpace.includes(c.toLowerCase()));
        });

        const scored = (rolePlacementPrograms.length > 0 ? rolePlacementPrograms : catalog.filter((p) => p.programType === "Placement")).map((program) => {
          let score = 0;
          const progRoles = (program.targetRoles || []).map((r) => String(r).toLowerCase());
          const progCompanies = (program.targetCompanies || []).map((c) => String(c).toLowerCase());
          const progSkills = (program.skillTags || []).map((s) => String(s).toLowerCase());

          if (progRoles.some((r) => r.includes(normalizedRole) || normalizedRole.includes(r))) score += 35;
          const companyMatches = effectiveCompanies.filter((c) => progCompanies.some((pc) => pc.includes(c.toLowerCase())));
          score += companyMatches.length * 10;
          const skillMatches = effectiveSkillsList.filter((s) => progSkills.some((ps) => ps.includes(s.toLowerCase())));
          score += skillMatches.length * 5;

          return { program, score };
        }).sort((a, b) => b.score - a.score)[0];

        const recommendedProgram = scored?.program || catalog.find((p) => p.programType === "Placement") || null;

        if (recommendedProgram) {
          const attachedCourse = recommendedProgram.courseIds?.[0] || availableCourses[0];
          const adaptedAttached = attachedCourse && typeof attachedCourse === "object"
            ? (attachedCourse.title ? attachedCourse : dataAdapters.adaptCourse(attachedCourse))
            : availableCourses[0];

          setResult({
            itemType: "program",
            program: recommendedProgram,
            matchedCourse: adaptedAttached,
            matchType: scored?.score > 0 ? "exact" : "closest",
          });
        } else if (availableCourses.length > 0) {
          setResult({
            itemType: "course",
            matchedCourse: availableCourses[0],
            program: null,
            matchType: "closest",
          });
        } else {
          setResult({ matchType: "none" });
        }
      }

      setStep(totalQuestions + 1);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not find a recommendation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!isCurrentStepValid()) {
      setError("Please select an option to continue.");
      return;
    }
    setError("");

    if (step === 0) {
      setStep(1);
      return;
    }

    if (step < totalQuestions) {
      setStep((prev) => prev + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    setError("");
    if (isFeedbackOpen) {
      setIsFeedbackOpen(false);
      return;
    }
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else if (step === 1 && !urlIntent) {
      setStep(0);
    } else {
      setIsFeedbackOpen(true);
    }
  };

  const FEEDBACK_OPTIONS = [
    "I want to change my answers",
    "I'm not sure what I want to learn",
    "I couldn't find what I was looking for",
    "I need more information",
    "I'm just exploring",
  ];

  const handleFeedbackSubmit = () => {
    if (!feedbackReason) {
      setError("Please select an option before submitting.");
      return;
    }
    try {
      localStorage.setItem("techlearn_exit_feedback", JSON.stringify({
        reason: feedbackReason,
        flowType,
        timestamp: new Date().toISOString()
      }));
    } catch {
      // storage helper
    }

    if (feedbackReason === "I want to change my answers") {
      setIsFeedbackOpen(false);
      setStep(0);
      setFlowType(null);
      setError("");
      setResult(null);
    } else {
      navigate("/");
    }
  };

  const handleStartRecommendation = () => {
    if (!result) return;
    const isProgram = result.itemType === "program" || !!result.program;
    const programId = result.program?._id;
    const courseId = getCourseTopicsId(result.matchedCourse);

    const structuredPayload = flowType === "skill"
      ? {
          type: "skill",
          skill: effectiveSkill,
          goal: skillGoal,
          level: skillLevel,
          learningPreference: skillPreference,
          programId,
          courseId,
        }
      : {
          type: "job-ready",
          opportunityType: jobOpportunity,
          role: effectiveJobRole,
          companies: jobCompanies.map((c) => (c === "Other" ? customJobCompany.trim() : c)).filter(Boolean),
          level: jobLevel,
          skills: jobSkills.map((s) => (s === "Other" ? customJobSkill.trim() : s)).filter(Boolean),
          learningPreference: jobPreference,
          programId,
          courseId,
        };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(structuredPayload));

    if (!isAuthenticated || !user) {
      navigate("/signup", { state: structuredPayload });
      return;
    }

    if (isProgram && programId) {
      navigate("/onboarding/programs", { state: structuredPayload });
    } else if (courseId) {
      navigate(`/learn/courses/${courseId}`);
    } else {
      navigate("/learn");
    }
  };

  return (
    <div className={`tl-unified-onboarding-root ${isDarkMode ? "dark-mode" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .tl-unified-onboarding-root {
          --navy: #bceaff;
          --navy-dark: #02052e;
          --chip-blue: #a5d8f4;
          --lime: #8cbf4a;
          --lime-hover: #a2d354;
          --white: #050a5b;
          --muted: #6f7894;
          --muted-light: #59657d;
          --border: rgba(5, 10, 91, .14);
          --border-hover: rgba(5, 10, 91, .30);
          --card-white: #ffffff;
          --card-border: #e2e5eb;
          --danger: #d83b52;
          --toggle-bg: rgba(255, 255, 255, .55);
          --toggle-border: rgba(5, 10, 91, .16);
          --toggle-icon: #02052e;
          --input-bg: rgba(255, 255, 255, .28);

          min-height: 100vh;
          background: #bceaff;
          color: var(--white);
          font-family: "Inter", sans-serif;
          transition: background .25s ease, color .25s ease;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .tl-unified-onboarding-root.dark-mode {
          background: var(--navy);
          --navy: #080d25;
          --navy-dark: #020416;
          --chip-blue: #031553;
          --lime: #8cbf4a;
          --lime-hover: #a2d354;
          --white: #f5f7ff;
          --muted: #9da7c2;
          --muted-light: #b7bfd4;
          --border: rgba(255, 255, 255, .12);
          --border-hover: rgba(255, 255, 255, .25);
          --card-white: #11172d;
          --card-border: #252d46;
          --danger: #ff8f9d;
          --toggle-bg: rgba(255, 255, 255, .08);
          --toggle-border: rgba(255, 255, 255, .16);
          --toggle-icon: #f5f7ff;
          --input-bg: rgba(255, 255, 255, .05);
        }

        .tl-unified-onboarding-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: "Inter", sans-serif;
        }

        .tl-unified-page {
          width: 50vw;
          max-width: 1100px;
          height: 100vh;
          max-height: 100vh;
          margin: 0 auto;
          padding: 80px 0 0;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
        }

        .tl-progress-wrapper {
          width: 100%;
          margin-top: 2px;
          margin-bottom: 20px;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .tl-progress-steps {
          display: grid;
          gap: 8px;
          width: 100%;
          align-items: center;
        }

        .tl-progress-step {
          height: 5px;
          border-radius: 10px;
          background: rgba(5, 10, 91, .15);
          transition: background .25s ease;
          width: 100%;
        }

        .tl-unified-onboarding-root.dark-mode .tl-progress-step {
          background: rgba(255, 255, 255, .15);
        }

        .tl-progress-step.active {
          background: var(--lime) !important;
        }

        .tl-screen {
          display: flex;
          flex: 1;
          flex-direction: column;
          min-height: 0;
          position: relative;
          overflow: hidden;
          animation: tlScreenIn .25s ease;
        }

        .tl-screen-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
          padding-bottom: 110px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .tl-screen-body::-webkit-scrollbar {
          width: 5px;
        }

        .tl-screen-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        @keyframes tlScreenIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tl-eyebrow {
          font-family: "Press Start 2P", monospace !important;
          font-size: 8.5px;
          line-height: 1.4;
          color: var(--white);
          letter-spacing: .6px;
          margin-top: 14px;
          margin-bottom: 22px;
          flex-shrink: 0;
        }

        .tl-title {
          font-size: clamp(30px, 2.5vw, 46px);
          line-height: 1.1;
          letter-spacing: -1.4px;
          font-weight: 600;
          color: var(--white);
          margin-top: 0;
          margin-bottom: 28px;
          flex-shrink: 0;
        }

        .tl-title i,
        .tl-title em {
          font-style: italic;
        }

        .tl-field {
          margin-bottom: 16px;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        /* Unified Button Layout: Dynamic width wrapping inside question container */
        .tl-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
        }

        /* Unified Button Appearance: Learn a Skill style colors, border, hover, active */
        .tl-chip {
          appearance: none;
          width: auto;
          border: 1px solid var(--border);
          background: var(--chip-blue);
          color: var(--white);
          border-radius: 8px;
          padding: 8px 16px;
          min-height: 42px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.3;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: "Inter", sans-serif;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease, transform .12s ease, color .18s ease;
          box-sizing: border-box;
        }

        .tl-chip:hover {
          background: var(--lime);
          border-color: var(--lime);
          color: #000f45;
        }

        .tl-chip:active {
          transform: scale(.98);
        }

        .tl-chip.selected {
          background: #000f45;
          border-color: var(--lime);
          color: var(--navy);
        }

        .tl-unified-onboarding-root.dark-mode .tl-chip.selected {
          background: var(--lime);
          border-color: var(--lime);
          color: #000f45;
        }

        .tl-other-wrapper {
          margin-top: 14px;
          animation: tlFadeIn .2s ease;
        }

        @keyframes tlFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tl-other-input {
          width: 100%;
          height: 40px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--white);
          padding: 0 14px;
          font-size: 13px;
          outline: none;
          transition: background .2s ease, border-color .2s ease;
          box-sizing: border-box;
        }

        .tl-other-input::placeholder {
          color: var(--muted);
        }

        .tl-other-input:focus {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(140, 191, 74, .12);
        }

        .tl-error-text {
          color: var(--danger);
          background: rgba(255, 80, 100, .08);
          border: 1px solid rgba(255, 80, 100, .18);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11.5px;
          margin-top: 12px;
        }

        .tl-actions {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 50vw;
          max-width: 1100px;
          display: flex;
          gap: 12px;
          padding: 16px 0 24px;
          background: var(--navy);
          z-index: 50;
          box-sizing: border-box;
          transition: background .25s ease;
        }

        .tl-btn {
          height: 46px;
          border: none;
          border-radius: 10px;
          font-family: "Press Start 2P", monospace !important;
          font-size: 8px !important;
          letter-spacing: .02em;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: .18s ease;
          box-sizing: border-box;
        }

        .tl-btn:hover {
          transform: translateY(-1px);
        }

        .tl-btn:active {
          transform: scale(.99);
        }

        .tl-btn-back {
          width: 30%;
          background: rgba(88, 90, 95, .22) !important;
          color: var(--white) !important;
          border: 1px solid var(--border) !important;
        }

        .tl-btn-back:hover {
          background: rgba(88, 90, 95, .35) !important;
        }

        .tl-btn-primary {
          width: 70%;
          background: var(--lime) !important;
          color: #07101b !important;
        }

        .tl-btn-primary:hover {
          background: var(--lime-hover) !important;
        }

        .tl-btn:disabled {
          opacity: .4 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* Match / Recommendation Card Styles */
        .tl-rec-container {
          display: flex;
          justify-content: center;
          margin-top: 8px;
          width: 100%;
        }

        .tl-learn-card {
          width: 100%;
          max-width: 440px;
          background: var(--chip-blue);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
        }

        .tl-learn-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-hover);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
        }

        .tl-card-banner {
          height: 160px;
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #02052e;
        }

        .tl-card-banner-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(20px);
          opacity: 0.45;
          transform: scale(1.15);
        }

        .tl-card-banner img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tl-category-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 2;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          backdrop-filter: blur(4px);
        }

        .tl-card-content {
          padding: 20px 22px;
        }

        .tl-card-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
        }

        .tl-card-description {
          font-size: 13px;
          line-height: 1.5;
          color: var(--muted-light);
          margin-bottom: 16px;
        }

        .tl-content-divider {
          height: 1px;
          background: var(--border);
          margin-bottom: 14px;
        }

        .tl-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tl-price {
          font-size: 18px;
          font-weight: 800;
          color: var(--lime);
        }

        .tl-start-link {
          font-size: 13px;
          font-weight: 700;
          color: var(--white);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tl-mismatch-notice {
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(140, 191, 74, 0.15);
          border: 1px solid rgba(140, 191, 74, 0.3);
          color: var(--white);
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }

        /* Feedback Screen */
        .tl-feedback-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }

        /* Responsive Breakpoints */
        @media (min-width: 701px) and (max-width: 1200px) {
          .tl-unified-page {
            width: 75vw;
            max-width: 850px;
            padding-top: 86px;
          }
          .tl-actions {
            width: 75vw;
            max-width: 850px;
          }
          .tl-title {
            font-size: clamp(34px, 3.2vw, 48px);
          }
        }

        @media (max-width: 700px) {
          .tl-unified-page {
            width: 100%;
            padding: 82px 16px 0;
          }
          .tl-actions {
            width: 100%;
            left: 0;
            transform: none;
            padding: 14px 16px 20px;
          }
          .tl-eyebrow { font-size: 8px; }
          .tl-title { font-size: clamp(26px, 6vw, 32px); letter-spacing: -1.2px; }
          .tl-chip { font-size: 12px; padding: 8px 12px; min-height: 38px; }
          .tl-btn { height: 46px; font-size: 8px; }
        }
      `}</style>

      <div className="tl-unified-page">
        {/* Progress Bar */}
        {!isFeedbackOpen && step > 0 && step <= totalQuestions && (
          <div className="tl-progress-wrapper">
            <div
              className="tl-progress-steps"
              style={{ gridTemplateColumns: `repeat(${totalQuestions}, 1fr)` }}
            >
              {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((idx) => (
                <div
                  key={idx}
                  className={`tl-progress-step ${step >= idx ? "active" : ""}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* FEEDBACK SCREEN */}
        {isFeedbackOpen ? (
          <div className="tl-screen">
            <div className="tl-screen-body">
              <div className="tl-eyebrow">BEFORE YOU GO...</div>
              <h1 className="tl-title">
                What made you want to <i>go back?</i>
              </h1>

              <div className="tl-field">
                <div className="tl-feedback-options">
                  {FEEDBACK_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`tl-chip ${feedbackReason === item ? "selected" : ""}`}
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setFeedbackReason(item);
                        setError("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {error && <div className="tl-error-text" style={{ textAlign: "center" }}>{error}</div>}
              </div>
            </div>

            <div className="tl-actions">
              <button
                type="button"
                className="tl-btn tl-btn-back"
                onClick={() => {
                  setError("");
                  setIsFeedbackOpen(false);
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="tl-btn tl-btn-primary"
                onClick={handleFeedbackSubmit}
              >
                SUBMIT
              </button>
            </div>
          </div>
        ) : step === 0 ? (
          /* STEP 0: What are you looking for? (Learn a Skill vs Get Job-Ready) */
          <div className="tl-screen">
            <div className="tl-screen-body">
              <div className="tl-eyebrow">GET STARTED</div>
              <h1 className="tl-title">
                What are you <i>looking for?</i>
              </h1>

              <div className="tl-field">
                <div className="tl-chips">
                  {[
                    { label: "Learn a Skill", type: "skill" },
                    { label: "Get Job-Ready", type: "job-ready" },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      className={`tl-chip ${flowType === opt.type ? "selected" : ""}`}
                      onClick={() => {
                        setError("");
                        setFlowType(opt.type);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {error && <div className="tl-error-text">{error}</div>}
              </div>
            </div>

            <div className="tl-actions">
              <button
                type="button"
                className="tl-btn tl-btn-back"
                onClick={() => setIsFeedbackOpen(true)}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="tl-btn tl-btn-primary"
                disabled={!flowType}
                onClick={handleContinue}
              >
                CONTINUE →
              </button>
            </div>
          </div>
        ) : step <= totalQuestions ? (
          /* QUESTION STEPS (1 question per screen) */
          <div className="tl-screen">
            <div className="tl-screen-body">
              <div className="tl-eyebrow">STEP {step} OF {totalQuestions}</div>

              {/* LEARN A SKILL QUESTIONS */}
              {flowType === "skill" && (
                <>
                  {step === 1 && (
                    <>
                      <h1 className="tl-title">
                        What do you want to <i>learn?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {SKILL_CATALOG.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${skill === item ? "selected" : ""}`}
                              onClick={() => {
                                setSkill(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        {skill === "Other" && (
                          <div className="tl-other-wrapper">
                            <input
                              type="text"
                              className="tl-other-input"
                              placeholder="Enter a skill (e.g. Kotlin, Flutter, Rust)..."
                              maxLength={60}
                              value={customSkill}
                              onChange={(e) => {
                                setCustomSkill(e.target.value);
                                setError("");
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h1 className="tl-title">
                        What do you want to <i>achieve?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {SKILL_GOAL_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${skillGoal === item ? "selected" : ""}`}
                              onClick={() => {
                                setSkillGoal(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h1 className="tl-title">
                        What’s your <i>current level?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {SKILL_LEVEL_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${skillLevel === item ? "selected" : ""}`}
                              onClick={() => {
                                setSkillLevel(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <h1 className="tl-title">
                        How do you <i>prefer to learn?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {SKILL_LEARNING_PREFERENCES.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${skillPreference === item ? "selected" : ""}`}
                              onClick={() => {
                                setSkillPreference(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* GET JOB-READY QUESTIONS */}
              {flowType === "job-ready" && (
                <>
                  {step === 1 && (
                    <>
                      <h1 className="tl-title">
                        What opportunity are you <i>looking for?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {JOB_OPPORTUNITY_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${jobOpportunity === item ? "selected" : ""}`}
                              onClick={() => {
                                setJobOpportunity(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h1 className="tl-title">
                        What role are you <i>targeting?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {JOB_ROLE_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${jobRole === item ? "selected" : ""}`}
                              onClick={() => {
                                setJobRole(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        {jobRole === "Other" && (
                          <div className="tl-other-wrapper">
                            <input
                              type="text"
                              className="tl-other-input"
                              placeholder="Enter target role (e.g. DevOps Engineer)..."
                              maxLength={60}
                              value={customJobRole}
                              onChange={(e) => {
                                setCustomJobRole(e.target.value);
                                setError("");
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h1 className="tl-title">
                        Which companies are you <i>targeting?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {JOB_COMPANY_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${jobCompanies.includes(item) ? "selected" : ""}`}
                              onClick={() => handleToggleJobCompany(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        {jobCompanies.includes("Other") && (
                          <div className="tl-other-wrapper">
                            <input
                              type="text"
                              className="tl-other-input"
                              placeholder="Enter company name(s)..."
                              maxLength={60}
                              value={customJobCompany}
                              onChange={(e) => {
                                setCustomJobCompany(e.target.value);
                                setError("");
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <h1 className="tl-title">
                        What’s your <i>current level?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {JOB_LEVEL_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${jobLevel === item ? "selected" : ""}`}
                              onClick={() => {
                                setJobLevel(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 5 && (
                    <>
                      <h1 className="tl-title">
                        What skills do you <i>have?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {JOB_SKILL_OPTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${jobSkills.includes(item) ? "selected" : ""}`}
                              onClick={() => handleToggleJobSkill(item)}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                        {jobSkills.includes("Other") && (
                          <div className="tl-other-wrapper">
                            <input
                              type="text"
                              className="tl-other-input"
                              placeholder="Enter other skill(s)..."
                              maxLength={60}
                              value={customJobSkill}
                              onChange={(e) => {
                                setCustomJobSkill(e.target.value);
                                setError("");
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 6 && (
                    <>
                      <h1 className="tl-title">
                        How do you <i>prefer to learn?</i>
                      </h1>
                      <div className="tl-field">
                        <div className="tl-chips">
                          {JOB_LEARNING_PREFERENCES.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className={`tl-chip ${jobPreference === item ? "selected" : ""}`}
                              onClick={() => {
                                setJobPreference(item);
                                setError("");
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && <div className="tl-error-text">{error}</div>}
            </div>

            <div className="tl-actions">
              <button
                type="button"
                className="tl-btn tl-btn-back"
                onClick={handleBack}
              >
                BACK
              </button>
              <button
                type="button"
                className="tl-btn tl-btn-primary"
                disabled={loading || !isCurrentStepValid()}
                onClick={handleContinue}
              >
                {loading ? "FINDING..." : step === totalQuestions ? "FIND MATCH →" : "CONTINUE →"}
              </button>
            </div>
          </div>
        ) : (
          /* RECOMMENDATION / MATCH SCREEN */
          <div className="tl-screen">
            <div className="tl-screen-body">
              <div className="tl-eyebrow">YOUR MATCH</div>
              <h1 className="tl-title">
                {result?.matchType === "none" ? (
                  <>We don't have this program <i>yet.</i></>
                ) : (
                  <>Here's what fits <i>you.</i></>
                )}
              </h1>

              {result?.matchType !== "none" && (() => {
                const displayItem = result?.program || result?.matchedCourse;
                const isProgram = result?.itemType === "program" || !!result?.program;
                const title = result?.program?.name || result?.matchedCourse?.title || "Recommended Track";
                const description = result?.program?.description || result?.matchedCourse?.description || "";
                const price = result?.program?.price || result?.matchedCourse?.price || "Free";
                const isFree = !price || price === "Free" || String(price).toLowerCase() === "free";
                const displayPrice = isFree ? "Free" : `₹${String(price).replace(/[^\d]/g, "")}`;

                return (
                  <div className="tl-rec-container">
                    <div className="tl-learn-card" onClick={handleStartRecommendation}>
                      <div className="tl-card-banner">
                        <div
                          className="tl-card-banner-bg"
                          style={{ backgroundImage: `url(${getCourseImage(displayItem)})` }}
                        />
                        <img
                          src={getCourseImage(displayItem)}
                          alt={title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/c-programming.jpg";
                          }}
                        />
                        <div className="tl-category-badge">
                          {isProgram ? "Program" : "Course"}
                        </div>
                      </div>

                      <div className="tl-card-content">
                        <h2 className="tl-card-title">{title}</h2>
                        <p className="tl-card-description">{description}</p>
                        <div className="tl-content-divider" />
                        <div className="tl-card-footer">
                          <div className="tl-price">
                            {displayPrice}
                            {!isFree && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 4 }}>/ Year</span>}
                          </div>
                          <span className="tl-start-link">
                            Start Now →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {error && <div className="tl-error-text">{error}</div>}
            </div>

            <div className="tl-actions">
              <button
                type="button"
                className="tl-btn tl-btn-back"
                onClick={() => setStep(totalQuestions)}
              >
                BACK
              </button>
              <button
                type="button"
                className="tl-btn tl-btn-primary"
                onClick={handleStartRecommendation}
              >
                START LEARNING →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
