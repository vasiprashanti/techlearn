import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import API from "../../api/client";

const STORAGE_KEY = "techlearn-contextual-onboarding";
const MAX_COMPANIES = 3;

const roleOptions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI / Machine Learning Engineer",
  "Data Scientist",
  "Generative AI Engineer",
];
const placementRoleOptions = [
  "Software Developer",
  "Full Stack Developer",
  "Data Analyst",
  "AI / ML Engineer",
  "Web Developer",
  "Other",
];
const OTHER_ROLE = "Other";

const companyCatalog = {
  campus: [
    // Companies with Question Bank questions tagged to them first
    "TCS",
    "Infosys",
    "Accenture",
    "Cognizant",
    "Deloitte",
    "Capgemini",
    "Wipro",
    "HCL",
  ],
  offCampus: [
    // Companies with Question Bank questions tagged to them first
    "Accenture",
    "TCS",
    "Cognizant",
    "Infosys",
    "Deloitte",
    "Capgemini",
    "Wipro",
    "Amazon",
    "Google",
    "Microsoft",
    "Adobe",
    "Flipkart",
    "Walmart",
  ],
};

const skillList = [
  "Java",
  "Python",
  "JavaScript",
  "React",
  "SQL",
  "Data Structures & Algorithms",
  "Generative AI",
];

const skillLevels = [
  "I'm a beginner",
  "I know the basics",
  "I'm building projects",
  "I'm preparing for interviews",
];

const learningGoals = [
  "Build projects",
  "Prepare for interviews",
  "Explore a career",
  "Strengthen fundamentals",
];

const readStoredAnswers = () => {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

const skillCatalog = ["C", "C++", "Java", "Python", "JavaScript", "Web Development", "DSA", "SQL", "AI/ML", "Generative AI", "Aptitude", "Other"];
const skillGoals = [
  ["Learn the basics", "Start from the fundamentals and build a strong foundation."],
  ["Build projects", "Learn by building practical projects."],
  ["Master the skill", "Go deeper and become more confident with the skill."],
];
const skillLevelCards = [
  ["Beginner", 'print("hello")', "I want to start from the basics."],
  ["Basic", "if b > a:\n    print b", "I've seen code before and understand a little."],
  ["Intermediate", "for i in range(5):", "I can write simple programs on my own."],
  ["Advanced", "def circle(size):", "I've built programs and want to go further."],
];

function SkillOnboardingFlow() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [step, setStep] = useState(1);
  const [skill, setSkill] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [learningMode, setLearningMode] = useState("");
  const [result, setResult] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");
  const requestedSkill = (skill === "Other" ? customSkill : skill).trim();

  const findMatch = (catalog) => {
    const normalized = requestedSkill.toLowerCase();
    const sameSkill = catalog.filter((program) => {
      if (program.programType !== "Skill") return false;
      const tags = [...(program.skillTags || []), program.name, program.description].join(" ").toLowerCase();
      return tags.includes(normalized);
    });
    if (!sameSkill.length) return null;
    const scored = sameSkill.map((program) => {
      const tags = (program.skillTags || []).map((tag) => String(tag).toLowerCase());
      const goals = (program.learningGoals || []).map((item) => String(item).toLowerCase());
      const programMode = program.pricingType === "Paid" ? "Trainer-Led" : "Self-Paced";
      let score = 0;
      if (learningMode === "ANY" || programMode === learningMode) score += learningMode === "ANY" ? 0 : 4;
      if (tags.includes(normalized)) score += 4;
      if (goals.some((item) => item.includes(goal.toLowerCase()))) score += 2;
      const courseLevels = (program.courseIds || []).map((course) => String(course.level || "").toLowerCase());
      if (courseLevels.includes(level.toLowerCase())) score += 3;
      return { program, score, programMode };
    }).sort((a, b) => b.score - a.score)[0];
    return { ...scored, matchType: scored.score >= 9 ? "exact" : "closest" };
  };

  const finish = async () => {
    setLoading(true); setError("");
    try {
      const response = await API.get("/api/programs/public");
      const catalog = response.data?.programs || [];
      setPrograms(catalog);
      const match = findMatch(catalog);
      setResult(match || { matchType: "none" });
      setStep(5);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not find a matching program.");
    } finally { setLoading(false); }
  };

  const answers = { skill: requestedSkill, skillSource: skill === "Other" ? "other" : "catalog", goal, level, learningMode };
  const continueStep = () => {
    if (step === 1 && (!requestedSkill || (skill === "Other" && !customSkill.trim()))) return setError("Please choose or enter a skill.");
    if (step === 2 && !goal) return setError("Please choose your learning goal.");
    if (step === 3 && !level) return setError("Please choose your current level.");
    if (step === 4 && !learningMode) return setError("Please choose how you would like to learn.");
    setError("");
    if (step === 4) return finish();
    setStep((current) => current + 1);
  };
  const goBack = () => {
    if (step === 1) {
      navigate("/");
    } else {
      setStep((current) => current - 1);
    }
  };

  const handleFeedbackExit = () => {
    if (!feedbackReason) {
      setError("Please select an option before submitting.");
      return;
    }
    try {
      const feedbackData = {
        reason: feedbackReason,
        skill: requestedSkill,
        goal,
        level,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("techlearn_skill_exit_feedback", JSON.stringify(feedbackData));
    } catch {
      // storage helper
    }
    navigate("/");
  };
  const startProgram = () => {
    sessionStorage.setItem("techlearn-skill-onboarding", JSON.stringify({ ...answers, programId: result?.program?._id || null }));
    if (!isAuthenticated || !user) return navigate("/signup", { state: { ...answers, skills: [requestedSkill], learningGoal: "Learn New Skills" } });
    navigate("/onboarding/programs", { state: { ...answers, skills: [requestedSkill], learningGoal: "Learn New Skills", programId: result?.program?._id } });
  };
  const joinWaitlist = async () => {
    if (!result?.program?._id) return;
    try {
      await API.post(`/api/programs/${result.program._id}/waitlist`, { email: user?.email || "", name: user?.firstName || "", learningMode: "Trainer-Led", message: `I am interested in joining this program: ${result.program.name}` });
      setResult((current) => ({ ...current, waitlisted: true }));
    } catch (requestError) { setError(requestError.response?.data?.message || "Could not join the waitlist."); }
  };

  return (
    <div className={`tl-skill-page-wrapper ${isDarkMode ? "dark-mode" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .tl-skill-page-wrapper {
          --navy: #c0e9ff;
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
          height: 100vh;
          max-height: 100vh;
          background: var(--navy);
          color: var(--white);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          overflow: hidden;
          transition: background .25s ease, color .25s ease;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        .tl-skill-page-wrapper.dark-mode {
          --navy: #00092f;
          --navy-dark: #000537;
          --chip-blue: #031553;
          --lime: #9bd45a;
          --lime-hover: #afe56b;
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

        .tl-skill-page-wrapper button,
        .tl-skill-page-wrapper input,
        .tl-skill-page-wrapper textarea {
          font-family: inherit;
        }

        .tl-skill-page-wrapper button {
          cursor: pointer;
        }

        .tl-skill-theme-toggle {
          position: fixed;
          top: 15px;
          right: 24px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid var(--toggle-border);
          background: var(--toggle-bg);
          color: var(--toggle-icon);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          z-index: 101;
          transition: background .2s ease, border-color .2s ease, color .2s ease, transform .2s ease;
        }

        .tl-skill-theme-toggle:hover {
          transform: translateY(-1px);
          border-color: var(--border-hover);
        }

        .tl-skill-theme-toggle:active {
          transform: scale(.94);
        }

        .tl-skill-page {
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

        .tl-skill-progress-wrapper {
          width: 100%;
          margin-top: 2px;
          margin-bottom: 20px;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .tl-skill-progress-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          width: 100%;
          align-items: center;
        }

        .tl-skill-progress-step {
          height: 5px;
          border-radius: 10px;
          background: rgba(5, 10, 91, .15);
          transition: background .25s ease;
          width: 100%;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-progress-step {
          background: rgba(255, 255, 255, .15);
        }

        .tl-skill-progress-step.active {
          background: var(--lime) !important;
        }

        .tl-skill-screen {
          display: flex;
          flex: 1;
          flex-direction: column;
          min-height: 0;
          position: relative;
          overflow: hidden;
          animation: tlSkillScreenIn .25s ease;
        }

        .tl-skill-screen-body {
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

        .tl-skill-screen-body::-webkit-scrollbar {
          width: 5px;
        }

        .tl-skill-screen-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        @keyframes tlSkillScreenIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
          }
        }

        .tl-skill-eyebrow {
          font-family: "Press Start 2P", monospace !important;
          font-size: 8.5px;
          line-height: 1.4;
          color: var(--white);
          letter-spacing: .6px;
          margin-top: 14px;
          margin-bottom: 22px;
          flex-shrink: 0;
        }

        .tl-skill-page h1 {
          font-size: clamp(30px, 2.5vw, 46px);
          line-height: 1.1;
          letter-spacing: -1.4px;
          font-weight: 600;
          color: var(--white);
          margin-top: 0;
          margin-bottom: 28px;
          flex-shrink: 0;
        }

        .tl-skill-page h1 i,
        .tl-skill-page h1 em {
          font-style: italic;
        }

        /* Specific per-step heading adjustments if needed */
        .tl-skill-step-1 h1 {
          font-size: clamp(32px, 2.7vw, 50px);
          margin-bottom: 24px;
        }

        .tl-skill-step-2 h1 {
          font-size: clamp(30px, 2.6vw, 48px);
          margin-bottom: 30px;
        }

        .tl-skill-step-3 h1 {
          font-size: clamp(28px, 2.4vw, 44px);
          margin-bottom: 24px;
        }

        .tl-skill-step-4 h1 {
          font-size: clamp(30px, 2.6vw, 48px);
          margin-bottom: 30px;
        }

        .tl-skill-field {
          margin-bottom: 16px;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .tl-skill-field-label {
          display: block;
          font-size: 16px;
          line-height: 1.3;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 14px;
          letter-spacing: -.2px;
        }

        .tl-skill-chips {
          display: grid;
          gap: 10px;
        }

        .tl-skill-chips-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .tl-skill-chips-50centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          gap: 14px;
        }

        .tl-skill-chips-50centered .tl-skill-chip {
          width: 70%;
          max-width: 440px;
          min-height: 52px;
          font-size: 14.5px;
          padding: 12px 18px;
          border-radius: 10px;
        }

        .tl-skill-chip {
          appearance: none;
          width: 100%;
          border: 1px solid var(--border);
          background: var(--chip-blue);
          color: var(--white);
          border-radius: 8px;
          padding: 8px 12px;
          min-height: 42px;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.3;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: "Inter", sans-serif;
          transition: background .18s ease, border-color .18s ease, transform .12s ease, color .18s ease;
          box-sizing: border-box;
        }

        .tl-skill-chip .sub-desc {
          display: block;
          font-size: 11.5px;
          opacity: 0.85;
          margin-top: 3px;
          font-weight: 400;
        }

        .tl-skill-chip:hover {
          background: var(--lime);
          color: #000f45;
        }

        .tl-skill-chip:active {
          transform: scale(.98);
        }

        .tl-skill-chip.selected {
          background: #000f45;
          color: var(--navy);
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-chip.selected {
          background: var(--lime);
          color: #000f45;
        }

        .tl-skill-other-wrapper {
          margin-top: 10px;
          animation: tlSkillFadeIn .2s ease;
        }

        .tl-skill-other-input {
          width: 100%;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--white);
          padding: 0 12px;
          font-size: 13px;
          outline: none;
          transition: background .2s ease, border-color .2s ease;
          box-sizing: border-box;
        }

        .tl-skill-other-input::placeholder {
          color: var(--muted);
        }

        .tl-skill-other-input:focus {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(140, 191, 74, .12);
        }

        @keyframes tlSkillFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Step 3: Level Cards */
        .tl-skill-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 4px;
          margin-bottom: 12px;
        }

        .tl-skill-card-option {
          background: var(--chip-blue);
          border: 1px solid var(--border);
          color: var(--white);
          border-radius: 11px;
          padding: 15px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease, transform .12s ease, color .18s ease;
          box-sizing: border-box;
        }

        .tl-skill-card-option:hover {
          background: var(--lime);
          color: #000f45;
          border-color: var(--lime);
        }

        .tl-skill-card-option:hover .tl-skill-code-block {
          color: #000f45;
        }

        .tl-skill-card-option:hover p {
          color: #1e293b;
        }

        .tl-skill-card-option:active {
          transform: scale(.98);
        }

        .tl-skill-card-option.selected {
          background: #000f45;
          color: var(--navy);
          border-color: var(--border-hover);
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-card-option.selected {
          background: var(--lime);
          color: #000f45;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-card-option.selected .tl-skill-code-block,
        .tl-skill-page-wrapper.dark-mode .tl-skill-card-option.selected p {
          color: #000f45;
        }

        .tl-skill-code-block {
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.82rem;
          font-weight: 700;
          color: inherit;
          margin-bottom: 6px;
          white-space: pre;
          transition: color .18s ease;
        }

        .tl-skill-card-option h3 {
          font-size: 1.02rem;
          font-weight: 700;
          margin-bottom: 5px;
          color: inherit;
        }

        .tl-skill-card-option p {
          font-size: 0.8rem;
          color: var(--muted-light);
          line-height: 1.35;
          transition: color .18s ease;
        }

        /* Mismatch Notice */
        .tl-skill-mismatch-notice {
          background: none;
          border: none;
          border-radius: 0;
          padding: 0;
          margin-bottom: 24px;
          text-align: center;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        .tl-skill-mismatch-notice span {
          display: block;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }

        /* Actions */
        .tl-skill-actions {
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

        .tl-skill-btn {
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

        .tl-skill-btn:hover {
          transform: translateY(-1px);
        }

        .tl-skill-btn:active {
          transform: scale(.99);
        }

        .tl-skill-btn-back {
          width: 30%;
          background: rgba(88, 90, 95, .22) !important;
          color: var(--white) !important;
          border: 1px solid var(--border) !important;
        }

        .tl-skill-btn-back:hover {
          background: rgba(88, 90, 95, .35) !important;
        }

        .tl-skill-btn-primary {
          width: 70%;
          background: var(--lime) !important;
          color: #07101b !important;
        }

        .tl-skill-btn-primary:hover {
          background: var(--lime-hover) !important;
        }

        .tl-skill-btn:disabled {
          opacity: .4 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* Recommendation Match Card */
        .tl-skill-rec-container {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 10px;
        }

        .tl-skill-card {
          width: 100%;
          max-width: 380px;
          background: var(--card-white);
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #eaeaea;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.25s ease;
          box-sizing: border-box;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-card {
          border-color: var(--card-border);
        }

        .tl-skill-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .tl-skill-card-banner {
          position: relative;
          width: 100%;
          height: 180px;
          background-color: #2d2d2d;
          background-image: radial-gradient(circle at 50% 50%, #3a3a3a 0%, #1a1a1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tl-skill-banner-badge-top {
          position: absolute;
          top: 16px;
          right: 16px;
          background-color: #fdf0a6;
          color: #111111;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tl-skill-card-logo {
          position: absolute;
          bottom: -20px;
          left: 20px;
          width: 56px;
          height: 56px;
          background-color: #ffffff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          font-size: 28px;
          font-weight: 800;
          color: #00599c;
          z-index: 2;
        }

        .tl-skill-card-body {
          padding: 30px 20px 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }

        .tl-skill-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .tl-skill-card-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--white);
          line-height: 1.25;
          margin: 0;
        }

        .tl-skill-tag-badge {
          border: 1px solid #e0e0e0;
          color: var(--white);
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-tag-badge {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .tl-skill-card-description {
          font-size: 13px;
          color: var(--muted-light);
          line-height: 1.45;
          margin: 0;
        }

        .tl-skill-divider {
          height: 1px;
          background-color: #eeeeee;
          margin: 4px 0;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-divider {
          background-color: var(--card-border);
        }

        .tl-skill-pricing-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .tl-skill-price-main {
          font-size: 26px;
          font-weight: 800;
          color: var(--white);
        }

        .tl-skill-price-subtext {
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }

        .tl-skill-trainer-badge {
          font-family: "Press Start 2P", monospace;
          font-size: 9px;
          color: var(--lime);
          letter-spacing: 0.5px;
        }

        /* Saved Box (No Program Found) */
        .tl-skill-saved-box {
          background: var(--chip-blue);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          margin-top: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .tl-skill-saved-box-icon {
          font-size: 42px;
          color: var(--lime);
          margin-bottom: 16px;
        }

        .tl-skill-saved-box h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          color: var(--white);
        }

        .tl-skill-saved-box p {
          font-size: 14px;
          color: var(--muted-light);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .tl-skill-saved-pref-chip {
          display: inline-block;
          background: rgba(5, 10, 91, .15);
          border: 1px solid var(--border);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--white);
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-saved-pref-chip {
          background: rgba(255, 255, 255, .1);
        }

        .tl-skill-error-text {
          margin-top: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--danger);
        }

        .tl-skill-other-textarea {
          width: 100%;
          height: 80px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--input-bg);
          color: var(--white);
          padding: 12px;
          font-size: 13px;
          outline: none;
          resize: none;
          transition: background .2s ease, border-color .2s ease;
          box-sizing: border-box;
        }

        .tl-skill-other-textarea::placeholder {
          color: var(--muted);
        }

        .tl-skill-other-textarea:focus {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(140, 191, 74, .12);
        }

        /* Before You Go Exit Feedback Screen Sizing (Laptops and Tablets) */
        .tl-skill-feedback-screen .tl-skill-eyebrow {
          margin-top: 14px;
          margin-bottom: 22px;
        }

        .tl-skill-feedback-screen h1 {
          font-size: clamp(30px, 2.5vw, 46px);
          line-height: 1.1;
          letter-spacing: -1.4px;
          margin-bottom: 36px;
        }

        .tl-skill-feedback-screen .tl-skill-chips-50centered {
          gap: 16px;
        }

        .tl-skill-feedback-screen .tl-skill-chips-50centered .tl-skill-chip {
          width: 78%;
          max-width: 480px;
          min-height: 52px;
          font-size: 14.5px;
          padding: 12px 18px;
          border-radius: 10px;
        }

        /* Media Queries */
        @media (min-width: 701px) and (max-width: 1200px) {
          .tl-skill-page {
            width: 75vw;
            max-width: 850px;
            min-width: 580px;
            padding-top: 86px;
          }
          .tl-skill-actions {
            width: 75vw;
            max-width: 850px;
            min-width: 580px;
          }
          .tl-skill-page h1 {
            font-size: clamp(34px, 3.2vw, 48px);
          }
          .tl-skill-chips-50centered .tl-skill-chip {
            width: 85%;
            max-width: 520px;
            min-height: 56px;
            font-size: 15.5px;
            padding: 14px 20px;
          }
          /* Keep Before You Go heading same as other steps on tablets with ample option spacing */
          .tl-skill-feedback-screen h1 {
            font-size: clamp(34px, 3.2vw, 48px);
            margin-bottom: 32px;
          }
          .tl-skill-feedback-screen .tl-skill-chips-50centered {
            gap: 15px;
          }
          .tl-skill-feedback-screen .tl-skill-chips-50centered .tl-skill-chip {
            width: 85%;
            max-width: 500px;
            min-height: 52px !important;
            font-size: 15px !important;
            padding: 12px 18px !important;
          }
          .tl-skill-chip {
            font-size: 14px;
            min-height: 48px;
            padding: 10px 14px;
          }
          .tl-skill-card-option {
            padding: 18px 18px;
          }
          .tl-skill-card-option h3 {
            font-size: 1.15rem;
          }
          .tl-skill-card-option p {
            font-size: 0.88rem;
          }
        }

        @media (max-width: 700px) {
          .tl-skill-theme-toggle {
            top: 15px;
            right: 16px;
            width: 38px;
            height: 38px;
            font-size: 13px;
          }
          .tl-skill-page {
            width: 100%;
            max-width: none;
            padding: 82px 16px 0;
          }
          .tl-skill-actions {
            width: 100%;
            left: 0;
            transform: none;
            padding: 14px 16px 20px;
          }
          .tl-skill-chips-50centered .tl-skill-chip {
            width: 100%;
          }
          .tl-skill-chip {
            font-size: 12px;
            padding: 9px 8px;
            min-height: 44px;
          }
          .tl-skill-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .tl-skill-card-option {
            padding: 10px 8px;
            border-radius: 9px;
          }
          .tl-skill-code-block {
            height: 30px;
            font-size: 0.72rem;
            margin-bottom: 3px;
          }
          .tl-skill-card-option h3 {
            font-size: 0.88rem;
            margin-bottom: 3px;
          }
          .tl-skill-card-option p {
            font-size: 0.72rem;
            line-height: 1.25;
          }
          .tl-skill-feedback-screen h1 {
            font-size: clamp(30px, 2.5vw, 46px);
            margin-bottom: 28px;
          }
          .tl-skill-feedback-screen .tl-skill-chips-50centered {
            gap: 14px;
          }
          .tl-skill-feedback-screen .tl-skill-chips-50centered .tl-skill-chip {
            min-height: 48px;
            font-size: 13px;
            padding: 11px 12px;
          }
          .tl-skill-btn {
            height: 46px;
            font-size: 8px;
          }
          .tl-skill-progress-wrapper {
            margin-top: 4px;
            margin-bottom: 16px;
            display: block;
            position: relative;
            z-index: 10;
          }
        }
      `}</style>

      {/* Main Page Container */}
      <div className="tl-skill-page">
        {/* Progress Bar (4 steps) */}
        {!isFeedbackOpen && step < 5 && (
          <div className="tl-skill-progress-wrapper">
            <div className="tl-skill-progress-steps">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`tl-skill-progress-step ${step >= i ? "active" : ""}`}
                />
              ))}
            </div>
          </div>
        )}

        {isFeedbackOpen ? (
          /* Before You Go Exit Feedback Screen */
          <div className="tl-skill-screen tl-skill-feedback-screen">
            <div className="tl-skill-screen-body">
              <div className="tl-skill-eyebrow">BEFORE YOU GO...</div>
              <h1>
                What made you want to <i>go back?</i>
              </h1>

              <div className="tl-skill-field">
                <div className="tl-skill-chips-50centered">
                  {[
                    "I want to change my skill",
                    "I'm not sure what I want to learn",
                    "I couldn't find what I was looking for",
                    "I need more information",
                    "I'm just exploring",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`tl-skill-chip ${feedbackReason === item ? "selected" : ""}`}
                      onClick={() => {
                        setFeedbackReason(item);
                        setError("");
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="tl-skill-error-text" style={{ textAlign: "center", marginTop: 12, color: "var(--danger)" }}>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Feedback Screen Action Buttons */}
            <div className="tl-skill-actions">
              <button
                type="button"
                className="tl-skill-btn tl-skill-btn-primary"
                onClick={handleFeedbackExit}
              >
                SUBMIT
              </button>
              <button
                type="button"
                className="tl-skill-btn tl-skill-btn-back"
                onClick={() => {
                  setError("");
                  setIsFeedbackOpen(false);
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : step < 5 ? (
          <div className={`tl-skill-screen tl-skill-step-${step}`}>
            <div className="tl-skill-screen-body">
              <div className="tl-skill-eyebrow">STEP {step} OF 4</div>

              <h1>
                {step === 1 ? (
                  <>What do you want to <i>learn?</i></>
                ) : step === 2 ? (
                  <>What do you want to <i>do</i> with this skill?</>
                ) : step === 3 ? (
                  <>What level of programming are you <i>currently at?</i></>
                ) : (
                  <>How would you like to <i>learn?</i></>
                )}
              </h1>

              {/* Step 1: Skill */}
              {step === 1 && (
                <div className="tl-skill-field">
                  <div className="tl-skill-chips tl-skill-chips-2col">
                    {skillCatalog.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`tl-skill-chip ${skill === item ? "selected" : ""}`}
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
                    <div className="tl-skill-other-wrapper">
                      <label
                        className="tl-skill-field-label"
                        style={{ fontSize: 14, marginBottom: 8 }}
                      >
                        What skill do you want to learn?
                      </label>
                      <input
                        type="text"
                        className="tl-skill-other-input"
                        placeholder="Enter a skill, e.g. Rust, Kotlin, Go..."
                        maxLength={60}
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Goal */}
              {step === 2 && (
                <div className="tl-skill-field">
                  <div className="tl-skill-chips-50centered">
                    {["Learn the basics", "Build projects", "Master the skill"].map((title) => (
                      <button
                        key={title}
                        type="button"
                        className={`tl-skill-chip ${goal === title ? "selected" : ""}`}
                        onClick={() => {
                          setGoal(title);
                          setError("");
                        }}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Current Level */}
              {step === 3 && (
                <div className="tl-skill-cards-grid">
                  {skillLevelCards.map(([title, code, description]) => (
                    <div
                      key={title}
                      className={`tl-skill-card-option ${level === title ? "selected" : ""}`}
                      onClick={() => {
                        setLevel(title);
                        setError("");
                      }}
                    >
                      <div className="tl-skill-code-block">{code}</div>
                      <h3>{title}</h3>
                      <p>{description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 4: Learning Mode */}
              {step === 4 && (
                <div className="tl-skill-field">
                  <div className="tl-skill-chips-50centered">
                    {[
                      ["Self-Paced", "Learn at my own pace"],
                      ["Trainer-Led", "Learn with a trainer"],
                      ["ANY", "I'm not sure"],
                    ].map(([value, title]) => (
                      <button
                        key={value}
                        type="button"
                        className={`tl-skill-chip ${learningMode === value ? "selected" : ""}`}
                        onClick={() => {
                          setLearningMode(value);
                          setError("");
                        }}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <div className="tl-skill-error-text">{error}</div>}
            </div>

            {/* Step Action Buttons */}
            <div className="tl-skill-actions">
              <button
                type="button"
                className="tl-skill-btn tl-skill-btn-back"
                onClick={goBack}
              >
                BACK
              </button>
              <button
                type="button"
                className="tl-skill-btn tl-skill-btn-primary"
                disabled={
                  loading ||
                  (step === 1 && (!requestedSkill || (skill === "Other" && !customSkill.trim()))) ||
                  (step === 2 && !goal) ||
                  (step === 3 && !level) ||
                  (step === 4 && !learningMode)
                }
                onClick={continueStep}
              >
                {loading ? "FINDING..." : "CONTINUE →"}
              </button>
            </div>
          </div>
        ) : (
          /* Step 5: Recommendation / Match Screen */
          <div className="tl-skill-screen">
            <div className="tl-skill-screen-body">
              <div className="tl-skill-eyebrow">YOUR MATCH</div>

              <h1>
                {result?.matchType === "none" ? (
                  <>We don't have this program <i>yet.</i></>
                ) : (
                  <>Here's what fits <i>you.</i></>
                )}
              </h1>

              {/* Mismatch Warning Notice */}
              {result?.matchType === "closest" && (
                <div className="tl-skill-mismatch-notice">
                  <span>We couldn’t find a Perfect Match but here’s what we found for you</span>
                </div>
              )}

              {/* Card or Saved Box */}
              {result?.matchType === "none" ? (
                <div className="tl-skill-saved-box">
                  <div className="tl-skill-saved-box-icon">✓</div>
                  <h2>We don't have this program yet.</h2>
                  <p>
                    We don't currently have a {requestedSkill} program available, but we've saved your request.
                  </p>
                  <div className="tl-skill-saved-pref-chip">
                    {skill === "Other"
                      ? `${requestedSkill} · ${goal} · ${level} · ${learningMode}`
                      : `${requestedSkill} Requested`}
                  </div>
                </div>
              ) : (
                <div className="tl-skill-rec-container">
                  <div className="tl-skill-card">
                    {/* Top Image/Banner */}
                    <div className="tl-skill-card-banner">
                      <div className="tl-skill-banner-badge-top">
                        YOUR MATCH
                      </div>
                      <div className="tl-skill-card-logo">
                        {requestedSkill ? requestedSkill.charAt(0).toUpperCase() : "S"}
                      </div>
                    </div>

                    {/* Main Content Body */}
                    <div className="tl-skill-card-body">
                      <div className="tl-skill-title-row">
                        <h2 className="tl-skill-card-title">
                          {result?.program?.name || `${requestedSkill} Programming`}
                        </h2>
                        <span className="tl-skill-tag-badge">SKILL</span>
                      </div>

                      <p className="tl-skill-card-description">
                        {result?.program?.description ||
                          `Learn ${requestedSkill} through structured lessons, practice, challenges, and projects.`}
                      </p>

                      <div className="tl-skill-divider" />

                      {result?.programMode === "Trainer-Led" ? (
                        <div className="tl-skill-trainer-badge">
                          TRAINER-LED PROGRAM
                        </div>
                      ) : (
                        <div className="tl-skill-pricing-row">
                          <div>
                            <div className="tl-skill-price-main">
                              {result?.program?.price ? `₹${result.program.price}` : "₹399"}
                            </div>
                            <div className="tl-skill-price-subtext">
                              One-time payment · 1 year access
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendation Screen Actions */}
            <div className="tl-skill-actions">
              <button
                type="button"
                className="tl-skill-btn tl-skill-btn-back"
                onClick={() => {
                  setError("");
                  setIsFeedbackOpen(true);
                }}
              >
                BACK
              </button>
              <button
                type="button"
                className="tl-skill-btn tl-skill-btn-primary"
                onClick={
                  result?.matchType === "none"
                    ? () => navigate("/learn/courses")
                    : result?.programMode === "Trainer-Led" && !result?.program?.isPublished
                    ? joinWaitlist
                    : startProgram
                }
              >
                {result?.matchType === "none"
                  ? "EXPLORE SKILLS →"
                  : result?.programMode === "Trainer-Led"
                  ? (result?.waitlisted ? "WAITLISTED ✓" : "JOIN WAITLIST →")
                  : "START LEARNING →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContextualOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, setSession } = useAuth();
  const { refetchUserData } = useUser();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const intent = searchParams.get("intent") || location.state?.intent || "placement";

  const initial = useMemo(
    () => ({
      role: "",
      opportunity: "",
      companies: [],
      skill: "",
      skillLevel: "",
      learningOutcome: "",
      // Only retain stored answers if coming from explicit state (e.g. back navigation or prefilled state)
      ...(location.state?.answers || {}),
    }),
    [location.state]
  );

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(initial.role || "");
  const [otherRole, setOtherRole] = useState(initial.otherRole || "");
  const [opportunity, setOpportunity] = useState(initial.opportunity || "");
  const [selectedCompanies, setSelectedCompanies] = useState(
    Array.isArray(initial.companies) ? initial.companies : []
  );

  // Skill intent fields
  const [selectedSkill, setSelectedSkill] = useState(initial.skill || "");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState(initial.skillLevel || "");
  const [selectedLearningOutcome, setSelectedLearningOutcome] = useState(initial.learningOutcome || "");

  // Feedback screen state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");

  const [savingPlan, setSavingPlan] = useState(null); // 'placement' | 'free_assessment' | null
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (intent !== "assessment") return;
    sessionStorage.setItem(
      "pending_assessment",
      JSON.stringify({
        intent: "assessment",
        programId: location.state?.programId || null,
        requiresSetup: true,
      })
    );
    navigate("/signup/contextual?intent=assessment", { replace: true });
  }, [intent, location.state?.programId, navigate]);

  // Derived available companies based on opportunity selection
  const availableCompanies = useMemo(() => {
    if (opportunity === "Campus") return companyCatalog.campus;
    if (opportunity === "Off-campus") return companyCatalog.offCampus;
    return [...new Set([...companyCatalog.campus, ...companyCatalog.offCampus])];
  }, [opportunity]);

  const effectiveRole = (role === OTHER_ROLE ? otherRole : role).trim();

  const isStep1Valid =
    intent === "skill"
      ? !!selectedSkill && !!effectiveRole
      : !!effectiveRole && !!opportunity;

  const isStep2Valid =
    intent === "skill"
      ? !!selectedSkillLevel && !!selectedLearningOutcome
      : selectedCompanies.length > 0;

  if (intent === "skill") return <SkillOnboardingFlow />;

  const handleRoleSelect = (r) => {
    setError("");
    setRole(r);
  };

  const handleOpportunitySelect = (opp) => {
    setError("");
    setOpportunity(opp);
    // Keep only companies that belong to the new opportunity category
    const validList =
      opp === "Campus"
        ? companyCatalog.campus
        : opp === "Off-campus"
        ? companyCatalog.offCampus
        : [...new Set([...companyCatalog.campus, ...companyCatalog.offCampus])];
    setSelectedCompanies((prev) => prev.filter((c) => validList.includes(c)));
  };

  const handleCompanyToggle = (company) => {
    setError("");
    setSelectedCompanies((prev) => {
      if (prev.includes(company)) {
        return prev.filter((c) => c !== company);
      }
      if (prev.length >= MAX_COMPANIES) {
        return prev;
      }
      return [...prev, company];
    });
  };

  const buildPayload = (selectedPlan = "placement") => {
    return {
      learningGoal: intent === "skill" ? "Learn New Skills" : "Get Placed",
      targetRole: effectiveRole,
      targetRoleOther: role === OTHER_ROLE ? otherRole.trim() : "",
      targetCompanies: selectedCompanies,
      placementCategory: opportunity,
      placementTimeline: "",
      skills: intent === "skill" && selectedSkill ? [selectedSkill] : [],
      learningPath: selectedPlan === "free_assessment" ? "Free" : "Member",
      programSelection: intent === "skill" ? "Full Stack Project Program" : "Placement Sprint",
      personalizedDetail: selectedSkillLevel || selectedLearningOutcome || "",
      onboardingIntent: intent,
      onboardingAnswers: {
        role: effectiveRole,
        otherRole: role === OTHER_ROLE ? otherRole.trim() : "",
        opportunity,
        companies: selectedCompanies,
        skill: selectedSkill,
        skillLevel: selectedSkillLevel,
        learningOutcome: selectedLearningOutcome,
        selectedPlan,
      },
    };
  };

  const finish = async (selectedPlan = "placement") => {
    const payload = buildPayload(selectedPlan);
    try {
      setSavingPlan(selectedPlan);
      setError("");
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, ...payload }));

      // Synchronize draft for legacy/modal signup flow compatibility
      const draftPayload = {
        learningGoal: intent === "skill" ? "Learn New Skills" : "Get Placed",
        targetRole: effectiveRole,
        targetRoleOther: role === OTHER_ROLE ? otherRole.trim() : "",
        placementCategory: opportunity,
        targetCompanies: selectedCompanies,
        skills: intent === "skill" && selectedSkill ? [selectedSkill] : [],
        learningPath: selectedPlan === "free_assessment" ? "Free" : "Member",
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("techlearn-onboarding-draft", JSON.stringify(draftPayload));
      } catch (e) {
        console.warn("Could not save onboarding draft:", e);
      }

      if (!isAuthenticated || !user) {
        if (selectedPlan === "free_assessment") {
          sessionStorage.setItem(
            "pending_assessment",
            JSON.stringify({
              intent: "assessment",
              targetRole: payload.targetRole,
              targetCompany: payload.targetCompanies[0] || "",
              placementCategory: opportunity === "campus" ? "On-Campus" : "Off-Campus",
              requiresSetup: true,
            })
          );
        }
        // Redirect to the existing signup card
        navigate("/signup", { state: payload });
        return;
      }

      const response = await API.put("/api/users/preferences", {
        ...payload,
        completeOnboarding: true,
      });
      const updatedUser = response.data?.profile || response.data?.user;
      if (updatedUser && setSession) {
        setSession(updatedUser, localStorage.getItem("token"));
      }
      if (refetchUserData) await refetchUserData();
      sessionStorage.removeItem(STORAGE_KEY);

      if (selectedPlan === "free_assessment" || intent === "assessment") {
        sessionStorage.setItem(
          "pending_assessment",
          JSON.stringify({
            targetRole: payload.targetRole,
            targetCompany: payload.targetCompanies[0] || "",
            placementCategory: opportunity === "campus" ? "On-Campus" : "Off-Campus",
          })
        );
        navigate("/free-assessment/setup", {
          state: {
            targetRole: payload.targetRole,
            targetCompany: payload.targetCompanies[0] || "",
            placementType: opportunity === "campus" ? "On-Campus" : "Off-Campus",
          },
        });
      } else {
        navigate("/onboarding/programs", { state: payload });
      }
    } catch (saveError) {
      setError(saveError.response?.data?.message || saveError.message || "Could not save your preferences.");
    } finally {
      setSavingPlan(null);
    }
  };

  const handleStep1Continue = () => {
    if (intent === "skill") {
      if (!effectiveRole) {
        setError("Please choose your target role.");
        return;
      }
      if (!selectedSkill) {
        setError("Please select the skill you want to learn.");
        return;
      }
    } else {
      if (!effectiveRole) {
        setError("Please choose or enter your target role.");
        return;
      }
      if (!opportunity) {
        setError("Please choose your target opportunity.");
        return;
      }
    }
    setError("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStep2Continue = () => {
    if (intent === "skill") {
      if (!selectedSkillLevel || !selectedLearningOutcome) {
        setError("Please answer all questions to continue.");
        return;
      }
    } else {
      if (selectedCompanies.length === 0) {
        setError("Please select at least one target company.");
        return;
      }
    }
    setError("");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (isFeedbackOpen) {
      setIsFeedbackOpen(false);
      return;
    }
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else {
      navigate("/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackReason) {
      setError("Please select an option before submitting.");
      return;
    }

    setSavingFeedback(true);
    setError("");
    try {
      const feedbackData = {
        reason: feedbackReason,
        role: effectiveRole,
        opportunity,
        companies: selectedCompanies,
        skill: selectedSkill,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("techlearn_exit_feedback", JSON.stringify(feedbackData));

      // Keep a server-side record as well. This route accepts guests, so a
      // visitor's reason is not lost before signup; authenticated feedback is
      // linked to the existing User/Student and appears in the Leads table.
      await API.post("/api/payments/exit-feedback", {
        programId: location.state?.programId || null,
        reason: feedbackReason,
        source: "contextual_onboarding",
        targetRole: effectiveRole,
        opportunity,
        targetCompanies: selectedCompanies,
        skill: selectedSkill,
      });
    } catch (feedbackError) {
      // localStorage remains a best-effort compatibility fallback if the API
      // is temporarily unavailable; do not block the visitor from leaving.
      console.warn("Could not persist contextual exit feedback:", feedbackError);
    } finally {
      setSavingFeedback(false);
    }
    navigate("/");
  };

  const totalSteps = 2;

  return (
    <div className={`tl-onboarding-page-root ${isDarkMode ? "dark-mode" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .tl-onboarding-page-root {
          --navy: #bceaff;
          --navy-dark: #02052e;
          --chip-blue: #a5d8f4;
          --lime: #b2e96a;
          --lime-hover: #c4f385;
          --white: #050a5b;
          --muted: #6f7894;
          --muted-light: #59657d;
          --border: rgba(5,10,91,.14);
          --border-hover: rgba(5,10,91,.30);
          --card-white: #ffffff;
          --card-border: #e2e5eb;
          --danger: #d83b52;
          --toggle-bg: rgba(255,255,255,.55);
          --toggle-border: rgba(5,10,91,.16);
          --toggle-icon: #02052e;
          --input-bg: rgba(255,255,255,.28);

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

        .tl-onboarding-page-root.dark-mode {
          background: var(--navy);
          --navy: #080d25;
          --navy-dark: #020416;
          --chip-blue: #031553;
          --lime: #9bd45a;
          --lime-hover: #afe56b;
          --white: #f5f7ff;
          --muted: #9da7c2;
          --muted-light: #b7bfd4;
          --border: rgba(255,255,255,.12);
          --border-hover: rgba(255,255,255,.25);
          --card-white: #11172d;
          --card-border: #252d46;
          --danger: #ff8f9d;
          --toggle-bg: rgba(255,255,255,.08);
          --toggle-border: rgba(255,255,255,.16);
          --toggle-icon: #f5f7ff;
          --input-bg: rgba(255,255,255,.05);
        }

        .tl-onboarding-page-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: "Inter", sans-serif;
        }

        .tl-page-container {
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

        .tl-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          padding-bottom: 110px;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .tl-screen::-webkit-scrollbar {
          width: 5px;
        }

        .tl-screen::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
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
          grid-template-columns: repeat(${totalSteps}, 1fr);
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

        .tl-onboarding-page-root.dark-mode .tl-progress-step {
          background: rgba(255, 255, 255, .15);
        }

        .tl-progress-step.active {
          background: var(--lime) !important;
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

        .tl-description {
          display: none;
        }

        .tl-field {
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .tl-field:first-of-type {
          margin-top: 0;
        }

        .tl-field-label {
          display: block;
          font-size: 16px;
          line-height: 1.3;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 14px;
          letter-spacing: -.2px;
        }

        .tl-field-label i,
        .tl-field-label em {
          font-style: italic;
        }

        .tl-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .tl-chip {
          appearance: none;
          border: 1px solid var(--border);
          background: var(--chip-blue);
          color: var(--white);
          border-radius: 10px;
          padding: 8px 13px;
          min-height: 34px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          transition: background .18s ease, border-color .18s ease, transform .12s ease, color .18s ease;
        }

        .tl-chip:hover {
          background: var(--lime);
          border-color: var(--lime);
          color: #07101b;
        }

        .tl-chip:active {
          transform: scale(.97);
        }

        .tl-chip.selected {
          background: var(--navy-dark);
          border-color: var(--lime);
          color: var(--navy);
        }

        .tl-onboarding-page-root.dark-mode .tl-chip.selected {
          background: var(--lime);
          border-color: var(--lime);
          color: #07101b;
        }

        .tl-chip.disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .tl-chip.disabled:hover {
          background: var(--chip-blue);
          border-color: var(--border);
          color: var(--white);
        }

        .tl-other-role-wrapper {
          margin-top: 12px;
          animation: tlFadeIn .2s ease;
        }

        @keyframes tlFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tl-other-role-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 6px;
        }

        .tl-other-role-input {
          width: 100%;
          height: 40px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--input-bg);
          color: var(--white);
          padding: 0 13px;
          font-size: 13px;
          outline: none;
          transition: background .2s ease, border-color .2s ease;
        }

        .tl-other-role-input::placeholder {
          color: var(--muted);
        }

        .tl-other-role-input:focus {
          border-color: var(--lime);
          box-shadow: 0 0 0 3px rgba(140,191,74,.12);
        }

        .tl-helper {
          font-size: 11px;
          line-height: 1.45;
          color: var(--muted);
          margin-top: 6px;
        }

        .tl-selected-count {
          font-size: 11px;
          color: var(--muted);
          margin-top: 7px;
        }

        .tl-selected-count.limit {
          color: var(--white);
          font-weight: 700;
        }

        .tl-error {
          color: var(--danger);
          background: rgba(255,80,100,.08);
          border: 1px solid rgba(255,80,100,.18);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 11px;
          line-height: 1.4;
          margin-bottom: 10px;
          margin-top: 6px;
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

        .tl-close-step {
          position: absolute;
          top: 6px;
          right: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: rgba(255,255,255,.06);
          color: var(--white);
          font-size: 18px;
          font-weight: 400;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: .18s ease;
          z-index: 10;
        }

        .tl-close-step:hover {
          background: rgba(255,255,255,.12);
          border-color: var(--border-hover);
          transform: rotate(5deg);
        }

        .tl-screen.tl-plan-screen {
          overflow-y: auto !important;
          max-height: calc(100vh - 100px);
          padding-bottom: 50px;
          scrollbar-width: thin;
          padding-right: 4px;
        }

        .tl-plan-screen .tl-plan-screen-subtitle,
        .tl-plan-screen p.tl-plan-screen-subtitle {
          display: block !important;
          visibility: visible !important;
          font-size: 14px;
          line-height: 1.5;
          color: var(--muted-light);
          margin-top: -16px;
          margin-bottom: 20px !important;
        }

        .tl-plan-card .tl-plan-description,
        .tl-plan-card p.tl-plan-description {
          display: block !important;
          visibility: visible !important;
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--muted-light);
          margin-top: 0 !important;
          margin-bottom: 10px !important;
        }

        .tl-plans {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          width: 100%;
          align-items: stretch;
          margin-top: 18px;
        }

        .tl-plan-card {
          border-radius: 14px;
          padding: 18px 20px 16px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          transition: background .25s ease, border-color .25s ease;
        }

        .tl-plan-card.free {
          background: var(--navy);
          color: var(--white);
        }

        .tl-plan-card.paid {
          background: var(--card-white);
          color: var(--white);
          border-color: var(--card-border);
        }

        .tl-plan-badge {
          align-self: flex-start;
          padding: 5px 9px;
          border-radius: 6px;
          font-size: 7.5px;
          font-weight: 800;
          letter-spacing: .1px;
          margin-bottom: 10px;
        }

        .tl-plan-card.free .tl-plan-badge {
          background: var(--lime);
          color: #07101b;
        }

        .tl-plan-card.paid .tl-plan-badge {
          background: var(--navy);
          color: var(--white);
        }

        .tl-onboarding-page-root.dark-mode .tl-plan-card.paid .tl-plan-badge {
          background: var(--lime);
          color: #07101b;
        }

        .tl-plan-title {
          font-size: 19px;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: -.5px;
          margin-bottom: 3px;
        }

        .tl-plan-subtitle {
          font-size: 11.5px;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--white);
        }

        .tl-plan-description {
          font-size: 11.5px;
          line-height: 1.4;
          margin-bottom: 10px;
          color: var(--muted-light);
        }

        .tl-plan-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 8px;
        }

        .tl-plan-price strong {
          font-size: 24px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.8px;
        }

        .tl-plan-price span {
          font-size: 10px;
          color: var(--muted);
        }

        .tl-onboarding-page-root.dark-mode .tl-plan-price strong {
          color: #ffffff;
        }

        .tl-onboarding-page-root.dark-mode .tl-plan-price span {
          color: #9da7c2;
        }

        .tl-plan-divider {
          height: 1px;
          width: 100%;
          margin-bottom: 10px;
          background: var(--border);
        }

        .tl-features {
          list-style: none;
          flex: 1;
          margin-bottom: 12px;
        }

        .tl-features li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 10.5px;
          line-height: 1.35;
          margin-bottom: 5px;
        }

        .tl-features li:last-child {
          margin-bottom: 0;
        }

        .tl-feature-check {
          flex-shrink: 0;
          font-weight: 800;
          color: var(--lime);
        }

        .tl-plan-card.free .tl-features li {
          color: var(--muted-light);
        }

        .tl-plan-card.paid .tl-features li {
          color: var(--white);
        }

        .tl-plan-cta {
          width: 100%;
          height: 40px;
          border: none;
          border-radius: 10px;
          font-family: "Press Start 2P", monospace !important;
          font-size: 8.5px;
          letter-spacing: .01em;
          background: var(--lime);
          color: #07101b;
          cursor: pointer;
          transition: .18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tl-plan-cta:hover:not(:disabled) {
          background: var(--lime-hover);
          transform: translateY(-1px);
        }

        .tl-plan-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .tl-feedback-screen {
          min-height: 70vh;
          justify-content: center;
          align-items: center;
          text-align: center;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .tl-feedback-options {
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 0 auto;
        }

        .tl-feedback-option {
          width: 100%;
          min-height: 44px;
          padding: 10px 15px;
          border-radius: 11px;
          border: 1px solid var(--border);
          background: var(--chip-blue);
          color: var(--white);
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: .18s ease;
        }

        .tl-feedback-option:hover {
          border-color: var(--border-hover);
        }

        .tl-feedback-option.selected {
          background: var(--lime);
          border-color: var(--lime);
          color: #07101b;
          font-weight: 700;
        }

        .tl-feedback-actions {
          width: 100%;
          max-width: 560px;
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }

        .tl-feedback-actions .tl-btn {
          width: 50%;
        }

        /* Responsive Breakpoints */
        @media (min-width: 701px) and (max-width: 1200px) {
          .tl-page-container {
            width: 75vw;
            max-width: 850px;
            min-width: 580px;
            padding-top: 86px;
          }
          .tl-actions {
            width: 75vw;
            max-width: 850px;
            min-width: 580px;
          }
          .tl-title {
            font-size: clamp(34px, 3.2vw, 48px);
          }
          .tl-plans { gap: 15px; }
          .tl-plan-card { padding: 19px; }
          .tl-plan-title { font-size: 20px; }
          .tl-features li { font-size: 10px; }
        }

        @media (max-width: 700px) {
          .tl-page-container {
            width: 100%;
            max-width: none;
            padding: 82px 16px 0;
          }
          .tl-actions {
            width: 100%;
            left: 0;
            transform: none;
            padding: 14px 16px 20px;
          }
          .tl-screen {
            min-height: 0;
          }
          .tl-eyebrow { font-size: 8px; }
          .tl-title { font-size: clamp(26px, 6vw, 32px); letter-spacing: -1.2px; }
          .tl-field:first-of-type { margin-top: 10px; }
          .tl-chip { font-size: 11px; padding: 10px 13px; min-height: 38px; }
          .tl-btn { height: 50px; font-size: 8px; }
          .tl-progress-wrapper {
            margin-top: 4px;
            margin-bottom: 16px;
            display: block;
            position: relative;
            z-index: 10;
          }
          .tl-plans {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 0;
          }
          .tl-plan-card { min-height: auto; width: 80vw; justify-self: center; padding: 23px; }
          .tl-plan-card.paid { order: 1; }
          .tl-plan-card.free { order: 2; }
          .tl-plan-description { min-height: auto; }
          .tl-feedback-title { font-size: 28px; }
          .tl-feedback-description { margin-bottom: 24px; }
          .tl-feedback-actions { flex-direction: column; }
          .tl-feedback-actions .tl-btn { width: 100%; }
        }
      `}</style>

      <div className="tl-page-container">
        {/* Progress bar */}
        {!isFeedbackOpen && step < 3 && (
          <div className="tl-progress-wrapper">
            <div className="tl-progress-steps">
              <div className={`tl-progress-step ${step >= 1 ? "active" : ""}`}></div>
              <div className={`tl-progress-step ${step >= 2 ? "active" : ""}`}></div>
            </div>
          </div>
        )}

        {/* FEEDBACK SCREEN */}
        {isFeedbackOpen ? (
          <section className="tl-feedback-screen">
            <div className="tl-eyebrow">QUICK FEEDBACK</div>
            <h1 className="tl-title tl-feedback-title">Before you go…</h1>
            <p className="tl-description tl-feedback-description" style={{ margin: "0 auto 48px auto" }}>
              What made you want to go back?
            </p>

            <div className="tl-feedback-options">
              {[
                "Price is too high",
                "I'm looking for a different program",
                "I'm not ready yet",
                "I need more information",
                "I want to choose a different role/company",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className={`tl-feedback-option ${feedbackReason === reason ? "selected" : ""}`}
                  onClick={() => setFeedbackReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>

            {error && <div className="tl-error">{error}</div>}

            <div className="tl-feedback-actions" style={{ margin: "24px auto 0 auto" }}>
              <button
                type="button"
                className="tl-btn tl-btn-back"
                onClick={() => setIsFeedbackOpen(false)}
              >
                GO BACK
              </button>
              <button
                type="button"
                className="tl-btn tl-btn-primary"
                onClick={handleFeedbackSubmit}
                disabled={savingFeedback}
              >
                {savingFeedback ? "SAVING..." : "SUBMIT"}
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* STEP 1 */}
            {step === 1 && (
              <section className="tl-screen">
                <div className="tl-eyebrow">STEP 1 OF {totalSteps}</div>
                <h1 className="tl-title">
                  What are <i>you</i> preparing for?
                </h1>
                <p className="tl-description">
                  {intent === "skill"
                    ? "Choose your target role and the skill you want to turn into real capability."
                    : "Tell us what kind of role you're targeting and the opportunity you're aiming for."}
                </p>

                {intent === "skill" ? (
                  <>
                    <div className="tl-field">
                      <label className="tl-field-label">Target Role <span aria-hidden="true">*</span></label>
                      <div className="tl-chips">
                        {placementRoleOptions.map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={`tl-chip ${role === r ? "selected" : ""}`}
                            onClick={() => handleRoleSelect(r)}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      {role === OTHER_ROLE && (
                        <div className="tl-other-role-wrapper">
                          <label className="tl-other-role-label" htmlFor="other-role-skill">Enter your desired role <span aria-hidden="true">*</span></label>
                          <input
                            id="other-role-skill"
                            type="text"
                            className="tl-other-role-input"
                            value={otherRole}
                            onChange={(event) => {
                              setError("");
                              setOtherRole(event.target.value);
                            }}
                            placeholder="e.g. Product Designer"
                            maxLength={100}
                          />
                        </div>
                      )}
                    </div>

                    <div className="tl-field">
                      <label className="tl-field-label">Primary Skill <span aria-hidden="true">*</span></label>
                      <div className="tl-chips">
                        {skillList.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`tl-chip ${selectedSkill === s ? "selected" : ""}`}
                            onClick={() => {
                              setError("");
                              setSelectedSkill(s);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tl-field">
                      <label className="tl-field-label">Pick <i>your</i> Target Role</label>
                      <div className="tl-chips">
                        {placementRoleOptions.map((r) => {
                          return (
                            <button
                              key={r}
                              type="button"
                              className={`tl-chip ${role === r ? "selected" : ""}`}
                              onClick={() => handleRoleSelect(r)}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                      {role === OTHER_ROLE && (
                        <div className="tl-other-role-wrapper">
                          <label className="tl-other-role-label" htmlFor="other-role">Enter your desired role <span aria-hidden="true">*</span></label>
                          <input
                            id="other-role"
                            type="text"
                            className="tl-other-role-input"
                            value={otherRole}
                            onChange={(event) => {
                              setError("");
                              setOtherRole(event.target.value);
                            }}
                            placeholder="e.g. Product Designer"
                            maxLength={100}
                          />
                        </div>
                      )}
                    </div>

                    <div className="tl-field">
                      <label className="tl-field-label">Pick <i>your</i> Target Opportunity</label>
                      <div className="tl-chips">
                        {["Campus", "Off-campus", "Both"].map((opp) => (
                          <button
                            key={opp}
                            type="button"
                            className={`tl-chip ${opportunity === opp ? "selected" : ""}`}
                            onClick={() => handleOpportunitySelect(opp)}
                          >
                            {opp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {error && <div className="tl-error">{error}</div>}

                <div className="tl-actions">
                  <button type="button" className="tl-btn tl-btn-back" onClick={handleBack}>
                    BACK
                  </button>
                  <button
                    type="button"
                    className="tl-btn tl-btn-primary"
                    disabled={!isStep1Valid}
                    onClick={handleStep1Continue}
                  >
                    CONTINUE →
                  </button>
                </div>
              </section>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <section className="tl-screen">
                <div className="tl-eyebrow">STEP 2 OF {totalSteps}</div>
                <h1 className="tl-title">
                  {intent === "skill" ? (
                    <>Where are you <i>starting from?</i></>
                  ) : (
                    <>Where do you want to <i>get hired?</i></>
                  )}
                </h1>
                <p className="tl-description">
                  {intent === "skill"
                    ? "This helps us set the right difficulty and pace for your learning path."
                    : "Your assessment and preparation will use these targets."}
                </p>

                {intent === "skill" ? (
                  <>
                    <div className="tl-field">
                      <label className="tl-field-label">Experience Level</label>
                      <div className="tl-chips">
                        {skillLevels.map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            className={`tl-chip ${selectedSkillLevel === lvl ? "selected" : ""}`}
                            onClick={() => {
                              setError("");
                              setSelectedSkillLevel(lvl);
                            }}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tl-field">
                      <label className="tl-field-label">Primary Goal</label>
                      <div className="tl-chips">
                        {learningGoals.map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={`tl-chip ${selectedLearningOutcome === g ? "selected" : ""}`}
                            onClick={() => {
                              setError("");
                              setSelectedLearningOutcome(g);
                            }}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="tl-field">
                    <label className="tl-field-label">
                      Pick <i>your</i> Target Companies (select up to 3)
                    </label>
                    <div className="tl-chips">
                      {availableCompanies.map((c) => {
                        const isSelected = selectedCompanies.includes(c);
                        const isLimitReached = selectedCompanies.length >= MAX_COMPANIES && !isSelected;
                        return (
                          <button
                            key={c}
                            type="button"
                            className={`tl-chip ${isSelected ? "selected" : ""} ${isLimitReached ? "disabled" : ""}`}
                            disabled={isLimitReached}
                            onClick={() => handleCompanyToggle(c)}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    <div
                      className={`tl-selected-count ${
                        selectedCompanies.length === MAX_COMPANIES ? "limit" : ""
                      }`}
                    >
                      {selectedCompanies.length} of {MAX_COMPANIES} selected
                    </div>
                    <div className="tl-helper">You can change your targets later.</div>
                  </div>
                )}

                {error && <div className="tl-error">{error}</div>}

                <div className="tl-actions">
                  <button type="button" className="tl-btn tl-btn-back" onClick={handleBack}>
                    BACK
                  </button>
                  <button
                    type="button"
                    className="tl-btn tl-btn-primary"
                    disabled={!isStep2Valid}
                    onClick={handleStep2Continue}
                  >
                    CONTINUE →
                  </button>
                </div>
              </section>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <section className="tl-screen tl-plan-screen" style={{ position: "relative" }}>
                <button
                  type="button"
                  className="tl-close-step"
                  aria-label="Close"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  ×
                </button>

                <h1 className="tl-title">
                  Here's your <i>plan.</i>
                </h1>
                <p className="tl-description tl-plan-screen-subtitle">
                  {intent === "skill"
                    ? "Start with our core learning track or unlock full project mastery."
                    : "Start with a focused assessment or go all in with the complete TechLearn placement program."}
                </p>

                {error && <div className="tl-error">{error}</div>}

                <div className="tl-plans">
                  {/* PAID PLAN */}
                  <article className="tl-plan-card paid">
                    <div className="tl-plan-badge">RECOMMENDED</div>
                    <div className="tl-plan-title">
                      {intent === "skill" ? "Full Stack Project Track" : "Placement Program"}
                    </div>
                    <div className="tl-plan-subtitle">Go all in</div>
                    <p className="tl-plan-description">
                      {intent === "skill"
                        ? `Follow a comprehensive practical curriculum built around ${selectedSkill || "modern development"} with end-to-end projects and mentor support.`
                        : `Follow a complete job-ready preparation system built around your target role and the companies you want to get hired by.`}
                    </p>

                    <div className="tl-plan-price">
                      <strong>₹799</strong>
                      <span>/year</span>
                    </div>

                    <div className="tl-plan-divider"></div>

                    <ul className="tl-features">
                      {intent === "skill" ? (
                        <>
                          <li><span className="tl-feature-check">✓</span><span>Complete {selectedSkill || "skill"} curriculum</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Hands-on production projects</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Code reviews & expert mentoring</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Industry verified certificate</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Interview & system design prep</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Full community access</span></li>
                        </>
                      ) : (
                        <>
                          <li><span className="tl-feature-check">✓</span><span>Structured DSA practice</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Aptitude & Core CS preparation</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Company & role-based questions</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Daily placement tasks & challenges</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Mock interviews & feedback</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Jobs & internships board</span></li>
                        </>
                      )}
                    </ul>

                    <button
                      type="button"
                      className="tl-plan-cta"
                      disabled={savingPlan !== null}
                      onClick={() => finish("placement")}
                    >
                      START NOW →
                    </button>
                  </article>

                  {/* FREE PLAN */}
                  <article className="tl-plan-card free">
                    <div className="tl-plan-badge">START FOR FREE</div>
                    <div className="tl-plan-title">
                      {intent === "skill" ? "Free Starter Track" : "Start Free Assessment"}
                    </div>
                    <div className="tl-plan-subtitle">Try it Out</div>
                    <p className="tl-plan-description">
                      {intent === "skill"
                        ? "Get immediate access to foundational exercises and practice questions to evaluate your readiness."
                        : `See where you stand before committing to a preparation plan. Get a focused assessment based on your target role and selected companies.`}
                    </p>

                    <div className="tl-plan-price">
                      <strong>Free</strong>
                      <span>· one-time</span>
                    </div>

                    <div className="tl-plan-divider"></div>

                    <ul className="tl-features">
                      {intent === "skill" ? (
                        <>
                          <li><span className="tl-feature-check">✓</span><span>Introductory skill modules</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Interactive code exercises</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Instant feedback on solutions</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Core concepts revision</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Identify your learning gaps</span></li>
                        </>
                      ) : (
                        <>
                          <li><span className="tl-feature-check">✓</span><span>30-minute placement assessment</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Questions based on your target role</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Company-specific questions</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Aptitude & technical questions</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Instant performance overview</span></li>
                          <li><span className="tl-feature-check">✓</span><span>Identify your preparation gaps</span></li>
                        </>
                      )}
                    </ul>

                    <button
                      type="button"
                      className="tl-plan-cta"
                      disabled={savingPlan !== null}
                      onClick={() => finish("free_assessment")}
                    >
                      START FREE →
                    </button>
                  </article>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
