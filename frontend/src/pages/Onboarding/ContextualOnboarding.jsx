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
  const goBack = () => step === 1 ? navigate("/") : setStep((current) => current - 1);
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700;1,800&family=Press+Start+2P&display=swap');

        .tl-skill-page-wrapper {
          --bg-page: #bceaff;
          --text-main: #050a5b;
          --eyebrow-color: #050a5b;
          --bar-bg: rgba(5, 10, 91, 0.13);
          --bar-active: #b2e96a;
          --chip-bg: #98d1f2;
          --chip-border: #7bbfe8;
          --chip-text: #020738;
          --chip-selected-bg: #03082a;
          --chip-selected-text: #ffffff;
          --chip-selected-border: #03082a;
          --btn-back-bg: #9ecce8;
          --btn-back-text: #020738;
          --btn-continue-bg: #b2e96a;
          --btn-continue-text: #07101b;
          --btn-continue-hover: #c4f385;
          --header-btn-bg: rgba(255, 255, 255, 0.5);
          --header-btn-border: rgba(5, 10, 91, 0.15);
          --header-btn-icon: #02052e;
          --card-white: #ffffff;
          --card-border: rgba(2, 7, 56, 0.12);
          --muted: #53647b;

          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          background: var(--bg-page);
          color: var(--text-main);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0 20px;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .tl-skill-page-wrapper.dark-mode {
          --bg-page: #080d25;
          --text-main: #f5f7ff;
          --eyebrow-color: #f5f7ff;
          --bar-bg: rgba(255, 255, 255, 0.15);
          --bar-active: #9bd45a;
          --chip-bg: #141f42;
          --chip-border: #23315e;
          --chip-text: #dce4fc;
          --chip-selected-bg: #9bd45a;
          --chip-selected-text: #020738;
          --chip-selected-border: #9bd45a;
          --btn-back-bg: rgba(88, 90, 95, 0.22);
          --btn-back-text: #f0f4ff;
          --btn-continue-bg: #9bd45a;
          --btn-continue-text: #07101b;
          --btn-continue-hover: #afe56b;
          --header-btn-bg: rgba(255, 255, 255, 0.08);
          --header-btn-border: rgba(255, 255, 255, 0.18);
          --header-btn-icon: #f5f7ff;
          --card-white: #0f1738;
          --card-border: #23315e;
          --muted: #9fa9c4;
        }

        .tl-skill-header-logo {
          position: absolute;
          top: 20px;
          left: 28px;
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          z-index: 10;
        }

        .tl-skill-header-logo img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .tl-skill-center-container {
          width: 50vw;
          max-width: 1050px;
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          margin: 0 auto;
          box-sizing: border-box;
          padding-top: 84px;
          padding-bottom: 24px;
          overflow: hidden;
        }

        .tl-skill-progress-wrapper {
          width: 100%;
          margin-bottom: 14px;
          flex-shrink: 0;
        }

        .tl-skill-progress-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          width: 100%;
        }

        .tl-skill-progress-step {
          height: 4px;
          min-height: 4px;
          border-radius: 10px;
          background: rgba(5, 10, 91, 0.16);
          transition: background 0.25s ease;
          display: block;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-progress-step {
          background: rgba(255, 255, 255, 0.15);
        }

        .tl-skill-progress-step.active {
          background: #b2e96a !important;
        }

        .tl-skill-page-wrapper.dark-mode .tl-skill-progress-step.active {
          background: #9bd45a !important;
        }

        .tl-skill-step-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .tl-skill-eyebrow {
          font-family: "Press Start 2P", monospace !important;
          font-size: 8px;
          line-height: 1.3;
          color: var(--eyebrow-color);
          letter-spacing: .7px;
          margin-bottom: 6px;
          flex-shrink: 0;
        }

        .tl-skill-title {
          font-size: clamp(24px, 2.1vw, 32px);
          line-height: 1.12;
          letter-spacing: -1.2px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 6px;
          flex-shrink: 0;
        }

        .tl-skill-title em,
        .tl-skill-title i {
          font-style: italic;
        }

        .tl-skill-subhead {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 10px;
          letter-spacing: -0.01em;
          flex-shrink: 0;
        }

        .tl-skill-subhead em {
          font-style: italic;
          font-weight: 700;
        }

        .tl-skill-grid-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          width: 100%;
        }

        .tl-skill-choice-btn {
          border-radius: 9px;
          border: 1px solid var(--chip-border);
          background: var(--chip-bg);
          color: var(--chip-text);
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.16s ease;
          user-select: none;
          outline: none;
          box-sizing: border-box;
          text-align: center;
          padding: 0 14px;
        }

        .tl-skill-choice-btn:hover {
          filter: brightness(0.96);
          transform: translateY(-1px);
        }

        .tl-skill-choice-btn.selected {
          background: var(--chip-selected-bg);
          color: var(--chip-selected-text);
          border-color: var(--chip-selected-border);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
        }

        .tl-skill-nav-row {
          display: flex;
          gap: 10px;
          margin-top: auto;
          padding-top: 14px;
          width: 100%;
          flex-shrink: 0;
        }

        .tl-skill-action-btn {
          height: 44px;
          border-radius: 11px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Press Start 2P", monospace !important;
          font-size: 8px;
          letter-spacing: .02em;
          cursor: pointer;
          transition: .18s ease;
          box-sizing: border-box;
        }

        .tl-skill-action-btn:hover {
          transform: translateY(-1px);
        }

        .tl-skill-action-btn:active {
          transform: scale(0.99);
        }

        .tl-skill-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .tl-skill-btn-back {
          width: 30%;
          background: rgba(88, 90, 95, 0.22);
          color: var(--text-main);
          border: 1px solid var(--chip-border);
        }

        .tl-skill-btn-back:hover {
          background: rgba(88, 90, 95, 0.35);
        }

        .tl-skill-btn-continue {
          width: 70%;
          background: var(--bar-active);
          color: #07101b;
        }

        .tl-skill-btn-continue:hover {
          background: var(--btn-continue-hover);
        }

        .tl-skill-error-text {
          margin-top: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
        }

        .tl-skill-custom-input {
          width: 100%;
          height: 44px;
          margin-top: 10px;
          border-radius: 9px;
          border: 1px solid var(--chip-border);
          background: rgba(255, 255, 255, 0.4);
          color: var(--text-main);
          padding: 0 16px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        }

        .dark-mode .tl-skill-custom-input {
          background: rgba(255, 255, 255, 0.06);
        }

        .tl-skill-custom-input:focus {
          border-color: var(--bar-active);
          box-shadow: 0 0 0 2px rgba(149, 212, 51, 0.3);
        }

        /* Step 2 & 4 Goal Option Cards */
        .tl-skill-goal-card {
          border-radius: 10px;
          border: 1px solid var(--chip-border);
          background: var(--chip-bg);
          color: var(--chip-text);
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.16s ease;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .tl-skill-goal-card.selected {
          background: var(--chip-selected-bg);
          color: var(--chip-selected-text);
          border-color: var(--chip-selected-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
        }

        .tl-skill-goal-card strong {
          font-size: 15.5px;
          font-weight: 700;
        }

        .tl-skill-goal-card small {
          font-size: 13px;
          opacity: 0.85;
        }

        /* Step 3 Level Cards */
        .tl-skill-level-card {
          border-radius: 10px;
          border: 1px solid var(--chip-border);
          background: var(--chip-bg);
          color: var(--chip-text);
          padding: 18px 14px;
          text-align: center;
          cursor: pointer;
          transition: all 0.16s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .tl-skill-level-card.selected {
          background: var(--chip-selected-bg);
          color: var(--chip-selected-text);
          border-color: var(--chip-selected-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
        }

        .tl-skill-level-card strong {
          font-size: 15px;
          font-weight: 700;
        }

        .tl-skill-level-code {
          font-family: monospace;
          font-size: 12.5px;
          min-height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
          white-space: pre-line;
        }

        /* Recommendation Card (Step 5) */
        .tl-skill-rec-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          padding: 24px 28px;
          text-align: left;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .dark-mode .tl-skill-rec-card {
          background: #0f1738;
          border-color: #23315e;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .tl-skill-rec-badge {
          background: #95d433;
          color: #07101b;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
        }

        .tl-skill-rec-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin: 0;
        }

        .tl-skill-rec-meta {
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
          margin-top: -2px;
        }

        .tl-skill-rec-desc {
          font-size: 13.5px;
          color: var(--text-main);
          line-height: 1.5;
          margin: 0;
        }

        .tl-skill-rec-desc strong {
          font-weight: 700;
        }

        @media (max-width: 700px) {
          .tl-skill-center-container {
            width: 100%;
            max-width: none;
            margin: 0;
            padding-top: 76px;
            padding-bottom: 16px;
          }
          .tl-skill-page-wrapper {
            padding: 0 16px;
            justify-content: flex-start;
          }
          .tl-skill-header-logo {
            top: 16px;
            left: 18px;
          }
          .tl-skill-title {
            font-size: 24px;
            letter-spacing: -1.2px;
          }
          .tl-skill-grid-2col {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
          .tl-skill-choice-btn {
            height: 38px;
            font-size: 12.5px;
          }
          .tl-skill-nav-row {
            padding-top: 10px;
          }
        }

        @media (max-width: 430px) {
          .tl-skill-title {
            font-size: 22px;
          }
          .tl-skill-grid-2col {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      {/* Top Left TLS Logo */}
      <div
        className="tl-skill-header-logo"
        onClick={() => navigate("/")}
        title="Return to Home"
      >
        <img
          src={isDarkMode ? "/logoo2-small.webp" : "/logoo-small.webp"}
          alt="TechLearn Solutions"
        />
      </div>

      {/* Centered Content Container */}
      <div className="tl-skill-center-container">
        {/* Progress Bar (4 steps) */}
        {step < 5 && (
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

        {step < 5 ? (
          <div className="tl-skill-step-content">
            <div className="tl-skill-eyebrow">STEP {step} OF 4</div>

            <h1 className="tl-skill-title">
              {step === 1 ? (
                <>What do you want to <em>learn?</em></>
              ) : step === 2 ? (
                <>What do you want to <em>do</em> with this skill?</>
              ) : step === 3 ? (
                <>What level of programming are you <em>currently at?</em></>
              ) : (
                <>How would you like to <em>learn?</em></>
              )}
            </h1>

            {/* Step 1: Pick your skill */}
            {step === 1 && (
              <>
                <div className="tl-skill-subhead">
                  Pick <em>your</em> skill
                </div>

                <div className="tl-skill-grid-2col">
                  {skillCatalog.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`tl-skill-choice-btn ${skill === item ? "selected" : ""}`}
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
                  <input
                    type="text"
                    className="tl-skill-custom-input"
                    placeholder="Enter a skill, e.g. Rust, Kotlin, Go..."
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    autoFocus
                  />
                )}
              </>
            )}

            {/* Step 2: Choose your goal */}
            {step === 2 && (
              <>
                <div className="tl-skill-subhead">
                  Choose <em>your</em> goal
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {skillGoals.map(([title, description]) => (
                    <button
                      key={title}
                      type="button"
                      className={`tl-skill-goal-card ${goal === title ? "selected" : ""}`}
                      onClick={() => setGoal(title)}
                    >
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 3: Choose programming level */}
            {step === 3 && (
              <>
                <div className="tl-skill-subhead">
                  Choose <em>your</em> current level
                </div>
                <div className="tl-skill-grid-2col">
                  {skillLevelCards.map(([title, code, description]) => (
                    <button
                      key={title}
                      type="button"
                      className={`tl-skill-level-card ${level === title ? "selected" : ""}`}
                      onClick={() => setLevel(title)}
                    >
                      <div className="tl-skill-level-code">{code}</div>
                      <strong>{title}</strong>
                      <small style={{ opacity: 0.85, fontSize: 12 }}>{description}</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 4: Learning style */}
            {step === 4 && (
              <>
                <div className="tl-skill-subhead">
                  Choose <em>your</em> learning style
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    ["Self-Paced", "Learn at my own pace"],
                    ["Trainer-Led", "Learn with a trainer"],
                    ["ANY", "I'm not sure"],
                  ].map(([value, title]) => (
                    <button
                      key={value}
                      type="button"
                      className={`tl-skill-goal-card ${learningMode === value ? "selected" : ""}`}
                      onClick={() => setLearningMode(value)}
                    >
                      <strong>{title}</strong>
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && <div className="tl-skill-error-text">{error}</div>}

            {/* Bottom Back and Continue Actions */}
            <div className="tl-skill-nav-row">
              <button
                type="button"
                className="tl-skill-action-btn tl-skill-btn-back"
                onClick={goBack}
              >
                BACK
              </button>
              <button
                type="button"
                className="tl-skill-action-btn tl-skill-btn-continue"
                disabled={loading || (step === 1 && (!requestedSkill || (skill === "Other" && !customSkill.trim()))) || (step === 2 && !goal) || (step === 3 && !level) || (step === 4 && !learningMode)}
                onClick={continueStep}
              >
                {loading
                  ? "FINDING..."
                  : step === 4
                  ? "CONTINUE →"
                  : "CONTINUE →"}
              </button>
            </div>
          </div>
        ) : (
          /* Step 5: Result Match */
          <div className="tl-skill-step-content" style={{ justifyContent: "flex-start" }}>
            <div className="tl-skill-eyebrow">YOUR MATCH</div>
            <h1 className="tl-skill-title" style={{ marginBottom: 20 }}>
              Here's what fits <em>you.</em>
            </h1>

            {result?.matchType === "none" ? (
              <div className="tl-skill-rec-card">
                <div className="tl-skill-rec-badge">NOT AVAILABLE YET</div>
                <h2 className="tl-skill-rec-title">
                  We don't have this program yet.
                </h2>
                <div className="tl-skill-rec-meta">
                  Level: {level || "All"} | Mode: {learningMode || "Self-Paced"}
                </div>
                <p className="tl-skill-rec-desc">
                  We don't currently have a {requestedSkill} program available, but we've saved your request.
                </p>
              </div>
            ) : (
              <div className="tl-skill-rec-card">
                <div className="tl-skill-rec-badge">
                  {result?.matchType === "exact" ? "RECOMMENDED FOR YOU" : "RECOMMENDED FOR YOU"}
                </div>
                <h2 className="tl-skill-rec-title">
                  {result?.program?.name || `${requestedSkill} Masterclass`}
                </h2>
                <div className="tl-skill-rec-meta">
                  Level: {level || "Beginner"} | Mode: {result?.programMode || "Self-Paced"}
                </div>
                <p className="tl-skill-rec-desc">
                  Designed specifically to help you reach your goal: <strong>"{goal || "Learn the basics"}"</strong>.
                </p>
              </div>
            )}

            <div className="tl-skill-nav-row">
              <button
                type="button"
                className="tl-skill-action-btn tl-skill-btn-back"
                onClick={() => setStep(1)}
              >
                CHANGE
              </button>
              <button
                type="button"
                className="tl-skill-action-btn tl-skill-btn-continue"
                onClick={result?.matchType === "none" ? () => navigate("/learn/courses") : startProgram}
              >
                {result?.matchType === "none"
                  ? "EXPLORE SKILLS →"
                  : result?.programMode === "Trainer-Led" && !result?.program?.isPublished
                  ? "JOIN WAITLIST →"
                  : "VIEW PROGRAM →"}
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
      ...readStoredAnswers(),
      ...(location.state?.answers || {}),
    }),
    [location.state]
  );

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(initial.role || initial.targetRole || "");
  const [otherRole, setOtherRole] = useState(initial.otherRole || initial.targetRoleOther || "");
  const [opportunity, setOpportunity] = useState(initial.opportunity || initial.placementCategory || "");
  const [selectedCompanies, setSelectedCompanies] = useState(
    Array.isArray(initial.companies) ? initial.companies : initial.targetCompanies || []
  );

  // Skill intent fields
  const [selectedSkill, setSelectedSkill] = useState(initial.skill || "");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState(initial.skillLevel || "");
  const [selectedLearningOutcome, setSelectedLearningOutcome] = useState(initial.learningOutcome || "");

  // Feedback screen state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");

  const [saving, setSaving] = useState(false);
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
      setSaving(true);
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
      setSaving(false);
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

    setSaving(true);
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
      setSaving(false);
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
          max-width: 1050px;
          height: 100vh;
          max-height: 100vh;
          margin: auto;
          padding: 84px 0 24px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: hidden;
        }

        .tl-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .tl-progress-wrapper {
          width: 100%;
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .tl-progress-steps {
          display: grid;
          grid-template-columns: repeat(${totalSteps}, 1fr);
          gap: 8px;
        }

        .tl-progress-step {
          height: 4px;
          border-radius: 10px;
          background: rgba(5,10,91,.13);
          transition: .25s ease;
        }

        .tl-onboarding-page-root.dark-mode .tl-progress-step {
          background: rgba(255,255,255,.10);
        }

        .tl-progress-step.active {
          background: var(--lime) !important;
        }

        .tl-eyebrow {
          font-family: "Press Start 2P", monospace !important;
          font-size: 8.5px;
          line-height: 1.4;
          color: var(--white);
          letter-spacing: .7px;
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .tl-title {
          font-size: clamp(26px, 2.3vw, 36px);
          line-height: 1.1;
          letter-spacing: -1.5px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
          flex-shrink: 0;
        }

        .tl-description {
          width: 100%;
          max-width: 700px;
          font-size: 13.5px;
          line-height: 1.4;
          color: var(--navy-dark);
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .tl-onboarding-page-root.dark-mode .tl-description {
          color: #b9c1d7;
        }

        .tl-field {
          margin-bottom: 20px;
        }

        .tl-field:first-of-type {
          margin-top: 14px;
        }

        .tl-field-label {
          display: block;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 10px;
          letter-spacing: -.2px;
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
          width: 100%;
          display: flex;
          gap: 10px;
          margin-top: auto;
          padding-top: 14px;
          flex-shrink: 0;
        }

        .tl-btn {
          height: 44px;
          border: none;
          border-radius: 11px;
          font-family: "Press Start 2P", monospace !important;
          font-size: 8px;
          letter-spacing: .02em;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: .18s ease;
        }

        .tl-btn:hover {
          transform: translateY(-1px);
        }

        .tl-btn:active {
          transform: scale(.99);
        }

        .tl-btn-back {
          width: 30%;
          background: rgba(88,90,95,.22);
          color: var(--white);
          border: 1px solid var(--border);
        }

        .tl-btn-back:hover {
          background: rgba(88,90,95,.35);
        }

        .tl-btn-primary {
          width: 70%;
          background: var(--lime);
          color: #07101b;
        }

        .tl-btn-primary:hover {
          background: var(--lime-hover);
        }

        .tl-btn:disabled {
          opacity: .4;
          cursor: not-allowed;
          transform: none;
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

        .tl-plan-cta:hover {
          background: var(--lime-hover);
          transform: translateY(-1px);
        }

        .tl-plan-cta:hover {
          background: var(--lime-hover);
          transform: translateY(-1px);
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
            width: 50vw;
            min-width: 500px;
            min-height: 580px;
            padding-top: 30px;
          }
          .tl-title { font-size: 42px; }
          .tl-description { font-size: 14px; }
          .tl-plans { gap: 15px; }
          .tl-plan-card { padding: 19px; }
          .tl-plan-title { font-size: 20px; }
          .tl-features li { font-size: 10px; }
        }

        @media (max-width: 700px) {
          .tl-page-container {
            width: 100%;
            max-width: none;
            min-height: 100vh;
            margin: 0;
            padding: 15vh 20px 35px;
            justify-content: flex-start;
          }
          .tl-progress-wrapper {
            margin-bottom: 55px;
            padding-right: 0;
          }
          .tl-screen {
            min-height: calc(85vh - 120px);
            display: flex;
            flex-direction: column;
          }
          .tl-eyebrow { font-size: 8px; }
          .tl-title { font-size: 34px; letter-spacing: -1.7px; }
          .tl-description {
            font-size: 14px;
            visibility: hidden;
            margin-bottom: 32px !important;
          }
          .tl-plan-screen .tl-description {
            height: auto;
            line-height: 1.4;
            visibility: visible;
            margin-bottom: 24px !important;
          }
          .tl-plan-screen { margin-top: -32px; }
          .tl-field:first-of-type { margin-top: 48px; }
          .tl-chip { font-size: 11px; padding: 10px 13px; min-height: 38px; }
          .tl-onboarding-page-root { --chip-blue: #a5d8f4; }
          .tl-onboarding-page-root.dark-mode { --chip-blue: #031553; }
          .tl-chip.selected { background: #000f45; }
          .tl-onboarding-page-root.dark-mode .tl-chip.selected { background: var(--lime); }
          .tl-helper { display: none; }
          .tl-selected-count { margin-top: 22px; }
          .tl-actions { margin-top: auto; padding-top: 32px; }
          .tl-btn { height: 50px; font-size: 8px; }
          .tl-plans {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 0;
          }
          .tl-plan-card { min-height: auto; width: 80vw; justify-self: center; padding: 23px; }
          .tl-plan-card.paid { order: 1; }
          .tl-plan-card.free { order: 2; }
          .tl-plan-description { min-height: auto; }
          .tl-feedback-title { font-size: 32px; }
          .tl-feedback-description { margin-bottom: 40px; }
          .tl-feedback-actions { flex-direction: column; }
          .tl-feedback-actions .tl-btn { width: 100%; }
        }

        @media (max-width: 430px) {
          .tl-page-container { padding: 15vh 17px 30px; }
          .tl-title { font-size: 30px; }
          .tl-description { font-size: 13px; }
          .tl-chip { font-size: 11px; padding: 9px 11px; min-height: 36px; }
          .tl-plan-title { font-size: 21px; }
          .tl-plan-description { font-size: 12px; }
          .tl-features li { font-size: 11px; }
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
                disabled={saving}
              >
                {saving ? "SAVING..." : "SUBMIT"}
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* STEP 1 */}
            {step === 1 && (
              <section className="tl-screen">
                <div className="tl-eyebrow">STEP 1 OF {totalSteps}</div>
                <h1 className="tl-title">What role are you preparing for?</h1>
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
                      <label className="tl-field-label">Target Role <span aria-hidden="true">*</span></label>
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
                      <label className="tl-field-label">Target Opportunity <span aria-hidden="true">*</span></label>
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
                  {intent === "skill" ? "Where are you starting from?" : "Where do you want to get hired?"}
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
                      Target Companies (select up to three).
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

                <h1 className="tl-title">Here's your plan.</h1>
                <p className="tl-description tl-plan-description">
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
                      disabled={saving}
                      onClick={() => finish("placement")}
                    >
                      {saving ? "SAVING..." : "START NOW →"}
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
                      disabled={saving}
                      onClick={() => finish("free_assessment")}
                    >
                      {saving ? "SAVING..." : "START FREE →"}
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
