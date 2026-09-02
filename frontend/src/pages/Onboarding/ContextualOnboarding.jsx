import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import API from "../../api/client";

const STORAGE_KEY = "techlearn-contextual-onboarding";
const MAX_COMPANIES = 3;

const roleOptions = [
  "Software Developer",
  "Full Stack Developer",
  "Data Analyst",
  "AI / ML Engineer",
  "Web Developer",
  "QA Engineer",
  "Other",
];

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
  const [otherRoleValue, setOtherRoleValue] = useState(
    initial.role && !roleOptions.slice(0, -1).includes(initial.role) ? initial.role : ""
  );
  const [isOtherRoleActive, setIsOtherRoleActive] = useState(
    initial.role && !roleOptions.slice(0, -1).includes(initial.role)
  );
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

  const effectiveRole = isOtherRoleActive ? otherRoleValue.trim() : role;

  const isStep1Valid =
    intent === "skill"
      ? !!selectedSkill
      : !!effectiveRole && !!opportunity;

  const isStep2Valid =
    intent === "skill"
      ? !!selectedSkillLevel && !!selectedLearningOutcome
      : selectedCompanies.length > 0;

  const handleRoleSelect = (r) => {
    setError("");
    if (r === "Other") {
      setIsOtherRoleActive(true);
      setRole("Other");
    } else {
      setIsOtherRoleActive(false);
      setRole(r);
      setOtherRoleValue("");
    }
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
        targetRoleOther: isOtherRoleActive ? otherRoleValue.trim() : "",
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
          })
        );
        navigate("/free-assessment/setup", {
          state: {
            targetRole: payload.targetRole,
            targetCompany: payload.targetCompanies[0] || "",
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

  const handleFeedbackSubmit = () => {
    if (!feedbackReason) {
      setError("Please select an option before submitting.");
      return;
    }
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
    } catch {
      // storage helper
    }
    navigate("/");
  };

  const totalSteps = 3;

  return (
    <div className={`tl-onboarding-page-root ${isDarkMode ? "dark-mode" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .tl-onboarding-page-root {
          --navy: #b6d6e7;
          --navy-dark: #02052e;
          --chip-blue: #c7e6f5;
          --lime: #8cbf4a;
          --lime-hover: #a2d354;
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
          background: var(--navy);
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
          --navy: #080d25;
          --navy-dark: #020416;
          --chip-blue: #151d3a;
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
          min-height: auto;
          margin: auto;
          padding: 24px 0 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .tl-progress-wrapper {
          width: 100%;
          margin-bottom: 24px;
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
          margin-bottom: 10px;
        }

        .tl-title {
          font-size: clamp(28px, 2.4vw, 38px);
          line-height: 1.1;
          letter-spacing: -1.5px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
        }

        .tl-description {
          width: 100%;
          max-width: 700px;
          font-size: 13.5px;
          line-height: 1.4;
          color: var(--navy-dark);
          margin-bottom: 24px;
        }

        .tl-onboarding-page-root.dark-mode .tl-description {
          color: #b9c1d7;
        }

        .tl-field {
          margin-bottom: 24px;
        }

        .tl-field:first-of-type {
          margin-top: 24px;
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
          margin-top: 24px;
          padding-top: 12px;
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
          top: -4px;
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
            padding: 28px 20px 35px;
          }
          .tl-progress-wrapper {
            margin-bottom: 55px;
            padding-right: 50px;
          }
          .tl-eyebrow { font-size: 8px; }
          .tl-title { font-size: 34px; letter-spacing: -1.7px; }
          .tl-description { font-size: 14px; }
          .tl-field:first-of-type { margin-top: 48px; }
          .tl-chip { font-size: 11px; padding: 10px 13px; min-height: 38px; }
          .tl-actions { padding-top: 32px; }
          .tl-btn { height: 50px; font-size: 8px; }
          .tl-plans {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 40px;
          }
          .tl-plan-card { min-height: auto; padding: 23px; }
          .tl-plan-card.paid { order: 1; }
          .tl-plan-card.free { order: 2; }
          .tl-plan-description { min-height: auto; }
          .tl-feedback-title { font-size: 32px; }
          .tl-feedback-description { margin-bottom: 40px; }
          .tl-feedback-actions { flex-direction: column; }
          .tl-feedback-actions .tl-btn { width: 100%; }
        }

        @media (max-width: 430px) {
          .tl-page-container { padding: 24px 17px 30px; }
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
        {!isFeedbackOpen && (
          <div className="tl-progress-wrapper">
            <div className="tl-progress-steps">
              <div className={`tl-progress-step ${step >= 1 ? "active" : ""}`}></div>
              <div className={`tl-progress-step ${step >= 2 ? "active" : ""}`}></div>
              <div className={`tl-progress-step ${step >= 3 ? "active" : ""}`}></div>
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
              >
                SUBMIT
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
                  {intent === "skill" ? "What do you want to learn?" : "What are you preparing for?"}
                </h1>
                <p className="tl-description">
                  {intent === "skill"
                    ? "Pick the skill and domain you want to turn into real capability."
                    : "Tell us what kind of role you're targeting and the opportunity you're aiming for."}
                </p>

                {intent === "skill" ? (
                  <div className="tl-field">
                    <label className="tl-field-label">Primary Skill</label>
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
                ) : (
                  <>
                    <div className="tl-field">
                      <label className="tl-field-label">Target Role</label>
                      <div className="tl-chips">
                        {roleOptions.map((r) => {
                          const isSelected = r === "Other" ? isOtherRoleActive : role === r && !isOtherRoleActive;
                          return (
                            <button
                              key={r}
                              type="button"
                              className={`tl-chip ${isSelected ? "selected" : ""}`}
                              onClick={() => handleRoleSelect(r)}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>

                      {isOtherRoleActive && (
                        <div className="tl-other-role-wrapper">
                          <label className="tl-other-role-label" htmlFor="otherRoleInput">
                            Enter your target role
                          </label>
                          <input
                            type="text"
                            id="otherRoleInput"
                            className="tl-other-role-input"
                            placeholder="e.g. Backend Developer"
                            maxLength={60}
                            value={otherRoleValue}
                            onChange={(e) => {
                              setOtherRoleValue(e.target.value);
                              setError("");
                            }}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    <div className="tl-field">
                      <label className="tl-field-label">Target Opportunity</label>
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
              <section className="tl-screen" style={{ position: "relative" }}>
                <button
                  type="button"
                  className="tl-close-step"
                  aria-label="Close"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  ×
                </button>

                <div className="tl-eyebrow">STEP 3 OF {totalSteps}</div>
                <h1 className="tl-title">Here's your plan.</h1>
                <p className="tl-description" style={{ marginBottom: 0 }}>
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
