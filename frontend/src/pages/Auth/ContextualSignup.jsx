import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import API from "../../api/client";
import { useAuthModalContext } from "../../context/AuthModalContext";

const STORAGE_KEY = "techlearn-contextual-onboarding";

const readAnswers = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
};

const readPendingAssessment = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem("pending_assessment") || "null");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
};

export default function ContextualSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, setSession } = useAuth();
  const { refetchUserData } = useUser();
  const { openLogin } = useAuthModalContext();
  const stored = useMemo(() => readAnswers(), []);
  const pendingAssessment = useMemo(() => readPendingAssessment(), []);
  const intent = searchParams.get("intent") || stored.intent || "placement";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      navigate(
        intent === "assessment" ? "/free-assessment/setup" : "/onboarding/programs",
        intent === "assessment"
          ? { replace: true, state: { programId: pendingAssessment.programId || stored.programId || null } }
          : { replace: true }
      );
    }
  }, [authLoading, intent, isAuthenticated, navigate, pendingAssessment.programId, stored.programId, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim()) return setError("Enter your name and email.");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return setError("Use at least 8 characters, one uppercase letter, one number, and one symbol.");
    }
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    setError("");
    try {
      const response = await API.post("/api/users/register", {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        completeOnboarding: true,
        ...stored,
        onboardingIntent: intent,
      });
      const payload = response.data;
      if (!payload?.token || !payload?.user) throw new Error(payload?.message || "Account creation failed.");
      setSession(payload.user, payload.token);
      localStorage.setItem("userData", JSON.stringify(payload.user));
      if (refetchUserData) {
        void refetchUserData().catch((refreshError) => {
          console.warn("Could not refresh the profile before navigation:", refreshError);
        });
      }
      sessionStorage.removeItem(STORAGE_KEY);

      if (intent === "assessment") {
        sessionStorage.removeItem("pending_assessment");
        navigate("/free-assessment/setup", {
          state: { programId: pendingAssessment.programId || stored.programId || null },
        });
      } else {
        navigate("/onboarding/programs", { state: stored });
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    if (intent === "assessment") {
      sessionStorage.setItem("pending_assessment", JSON.stringify({
        intent: "assessment",
        programId: pendingAssessment.programId || stored.programId || null,
        requiresSetup: true,
      }));
    }
    openLogin();
  };

  if (authLoading || isAuthenticated) return <div className="flex min-h-screen items-center justify-center bg-[#daf0fa] text-sm dark:bg-[#04083d]">Preparing your account...</div>;

  return (
    <div className="min-h-screen bg-[#daf0fa] px-5 py-8 text-[#00113b] dark:bg-[#04083d] dark:text-white md:px-10">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_430px] lg:items-center">
          <div>
            <button type="button" onClick={() => navigate(-1)} className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-black/55 hover:text-black dark:text-white/60 dark:hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</button>
            <p className="font-press-start text-[9px] uppercase tracking-[0.16em] text-[#3c83f6] dark:text-[#bceaff]">YOUR PATH IS READY</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Create your account and keep going.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-black/60 dark:text-white/65">We’ll use the answers you just gave us to set up your {intent === "skill" ? "skill-learning" : intent === "assessment" ? "assessment" : "placement"} experience.</p>
          </div>

          <form onSubmit={handleSubmit} className="dashboard-surface p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-[#3c83f6]/10 p-3 text-[#3c83f6] dark:text-[#bceaff]"><LockKeyhole className="h-5 w-5" /></div><div><h2 className="font-bold">Start with the essentials</h2><p className="text-xs text-black/55 dark:text-white/55">You can complete the rest of your profile later.</p></div></div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold">Name<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="dashboard-input-surface mt-2" placeholder="Your name" autoComplete="name" /></label>
              <label className="block text-sm font-semibold">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="dashboard-input-surface mt-2" placeholder="you@example.com" autoComplete="email" /></label>
              <label className="block text-sm font-semibold">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="dashboard-input-surface mt-2" placeholder="Create a strong password" autoComplete="new-password" /></label>
              <label className="block text-sm font-semibold">Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="dashboard-input-surface mt-2" placeholder="Repeat your password" autoComplete="new-password" /></label>
            </div>
            {error && <p className="mt-4 text-sm font-semibold text-red-600 dark:text-red-300">{error}</p>}
            <button type="submit" disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3c83f6] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? "Creating account..." : "Continue"}<ArrowRight className="h-4 w-4" /></button>
            <p className="mt-5 text-center text-sm text-black/55 dark:text-white/55">Already have an account? <button type="button" onClick={handleLoginClick} className="font-bold text-[#2563eb] dark:text-[#bceaff]">Log in</button></p>
            <p className="mt-4 text-center text-[11px] leading-5 text-black/45 dark:text-white/45">By continuing, you agree to use TechLearn for your personal learning journey.</p>
            <Link to="/" className="mt-5 block text-center text-xs font-semibold text-black/45 hover:text-black dark:text-white/45 dark:hover:text-white">Return home</Link>
          </form>
        </div>
      </main>
    </div>
  );
}
