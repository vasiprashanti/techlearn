import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import API from "../../api/client";

const STORAGE_KEY = "techlearn-contextual-onboarding";

const placementSteps = [
  {
    key: "targetRole",
    eyebrow: "YOUR DIRECTION",
    title: "What role are you preparing for?",
    description: "We’ll use this to shape your placement path.",
    options: ["Full Stack Developer", "Backend Developer", "Frontend Developer", "Data Analyst", "Cloud / DevOps Engineer"],
  },
  {
    key: "placementCategory",
    eyebrow: "YOUR SEARCH",
    title: "What kind of opportunity are you targeting?",
    description: "Choose the path that best matches your current goal.",
    options: ["On-Campus", "Off-Campus", "Both"],
  },
  {
    key: "targetCompany",
    eyebrow: "YOUR TARGET",
    title: "Which company pattern should we prepare for?",
    description: "You can change this later from your profile.",
    options: ["TCS", "Infosys", "Wipro", "Accenture", "Product company", "Any company"],
  },
  {
    key: "placementTimeline",
    eyebrow: "YOUR TIMELINE",
    title: "When are you hoping to be ready?",
    description: "This helps us set a realistic starting point.",
    options: ["0–3 months", "3–6 months", "6+ months", "I’m exploring"],
  },
];

const skillSteps = [
  {
    key: "skill",
    eyebrow: "YOUR DIRECTION",
    title: "What do you want to learn?",
    description: "Pick the skill you want to turn into real ability.",
    options: ["JavaScript", "React", "Java", "Python", "SQL", "Data Structures & Algorithms", "Generative AI"],
  },
  {
    key: "skillLevel",
    eyebrow: "YOUR STARTING POINT",
    title: "Where are you starting from?",
    description: "There’s no wrong answer — this only changes the starting point.",
    options: ["I’m a beginner", "I know the basics", "I’m building projects", "I’m preparing for interviews"],
  },
  {
    key: "learningOutcome",
    eyebrow: "YOUR OUTCOME",
    title: "What would make this useful for you?",
    description: "We’ll carry this goal into your profile.",
    options: ["Build projects", "Prepare for interviews", "Explore a career", "Strengthen fundamentals"],
  },
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
  const intent = searchParams.get("intent") || location.state?.intent || "placement";
  const steps = useMemo(
    () => (intent === "skill" ? skillSteps : placementSteps),
    [intent]
  );
  const initial = useMemo(() => ({ ...readStoredAnswers(), ...(location.state?.answers || {}) }), [location.state]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(initial);
  const [customValue, setCustomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (intent !== "assessment") return;
    sessionStorage.setItem("pending_assessment", JSON.stringify({
      intent: "assessment",
      programId: location.state?.programId || null,
      requiresSetup: true,
    }));
    navigate("/signup/contextual?intent=assessment", { replace: true });
  }, [intent, location.state?.programId, navigate]);

  const currentStep = steps[stepIndex];
  const selectedValue = answers[currentStep.key] || "";
  const value = customValue.trim() || selectedValue;

  const updateAnswer = (nextValue) => {
    setCustomValue("");
    setAnswers((current) => ({ ...current, [currentStep.key]: nextValue }));
    setError("");
  };

  const buildPayload = (sourceAnswers = answers) => {
    const selectedSkill = sourceAnswers.skill || "";
    return {
      learningGoal: intent === "skill" ? "Learn New Skills" : "Get Placed",
      targetRole: sourceAnswers.targetRole || "",
      targetCompanies: sourceAnswers.targetCompany ? [sourceAnswers.targetCompany] : sourceAnswers.targetCompanies || [],
      placementCategory: sourceAnswers.placementCategory || "",
      placementTimeline: intent === "assessment" ? "" : sourceAnswers.placementTimeline || "",
      skills: intent === "skill" && selectedSkill ? [selectedSkill] : [],
      learningPath: intent === "skill" ? "Skill" : "Placement",
      programSelection: intent === "skill" ? "Full Stack Project Program" : "Placement Sprint",
      personalizedDetail: sourceAnswers.skillLevel || sourceAnswers.learningOutcome || "",
      onboardingIntent: intent,
      onboardingAnswers: sourceAnswers,
    };
  };

  const finish = async (completedAnswers = answers) => {
    const payload = buildPayload(completedAnswers);
    try {
      setSaving(true);
      setError("");
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ intent, ...payload }));

      if (!isAuthenticated || !user) {
        navigate(`/signup/contextual?intent=${encodeURIComponent(intent)}`);
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

      if (intent === "assessment") {
        sessionStorage.setItem("pending_assessment", JSON.stringify({
          targetRole: payload.targetRole,
          targetCompany: payload.targetCompanies[0] || "",
        }));
        navigate("/free-assessment");
      } else {
        navigate("/onboarding/programs", { state: payload });
      }
    } catch (saveError) {
      setError(saveError.response?.data?.message || saveError.message || "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (!value) {
      setError("Choose an option or enter your own answer to continue.");
      return;
    }
    const nextAnswers = { ...answers, [currentStep.key]: value };
    setAnswers(nextAnswers);
    setCustomValue("");
    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }
    finish(nextAnswers);
  };

  return (
    <div className="min-h-screen bg-[#daf0fa] px-5 py-8 text-[#00113b] dark:bg-[#04083d] dark:text-white md:px-10">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center">
        <button type="button" onClick={() => navigate(-1)} className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-black/55 hover:text-black dark:text-white/60 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-press-start text-[9px] uppercase tracking-[0.16em] text-[#3c83f6] dark:text-[#bceaff]">{intent === "skill" ? "LEARN A SKILL" : intent === "assessment" ? "FREE ASSESSMENT" : "GET JOB-READY"}</p>
            <p className="mt-3 text-sm text-black/50 dark:text-white/55">A few quick questions. No long form.</p>
          </div>
          <span className="text-sm font-bold text-black/50 dark:text-white/55">{stepIndex + 1} / {steps.length}</span>
        </div>

        <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full bg-[#3c83f6] transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>

        <section className="dashboard-surface p-6 sm:p-10">
          <Sparkles className="h-6 w-6 text-[#3c83f6] dark:text-[#bceaff]" />
          <p className="mt-6 font-press-start text-[9px] uppercase tracking-[0.14em] text-[#3c83f6] dark:text-[#bceaff]">{currentStep.eyebrow}</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">{currentStep.title}</h1>
          <p className="mt-4 text-sm leading-6 text-black/60 dark:text-white/65">{currentStep.description}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {currentStep.options.map((option) => (
              <button key={option} type="button" onClick={() => updateAnswer(option)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selectedValue === option && !customValue ? "border-[#3c83f6] bg-[#3c83f6]/10 text-[#2563eb] dark:border-[#bceaff] dark:text-[#bceaff]" : "border-black/10 bg-white/40 hover:border-[#3c83f6]/50 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#bceaff]/50"}`}>
                {option}
                {selectedValue === option && !customValue && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>

          {intent !== "assessment" && (
            <input value={customValue} onChange={(event) => { setCustomValue(event.target.value); setError(""); }} placeholder="Or enter your own answer" className="mt-4 h-12 w-full rounded-xl border border-black/10 bg-white/50 px-4 text-sm outline-none focus:border-[#3c83f6] dark:border-white/10 dark:bg-white/5" />
          )}

          {error && <p className="mt-4 text-sm font-semibold text-red-600 dark:text-red-300">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" disabled={stepIndex === 0 || saving} onClick={() => setStepIndex((current) => current - 1)} className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-bold disabled:opacity-40 dark:border-white/10"><ArrowLeft className="h-4 w-4" /> Previous</button>
            <button type="button" disabled={saving} onClick={handleNext} className="inline-flex items-center gap-2 rounded-xl bg-[#3c83f6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50">{saving ? "Saving..." : stepIndex === steps.length - 1 ? "Continue to sign up" : "Continue"}<ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      </main>
    </div>
  );
}
