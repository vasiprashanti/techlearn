import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import ScrollProgress from "../../components/ScrollProgress";
import LoadingScreen from "../../components/LoadingScreen";
import { programLearningAPI } from "../../services/programLearningApi";
import { placementLearningAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { useAuthModalContext } from "../../context/AuthModalContext";
import { initiateRazorpayPayment } from "../../utils/razorpayCheckout";
import { FiChevronDown, FiBookOpen } from "react-icons/fi";
import "../../styles/courseDetails.css";

const formatPhaseName = (phaseKey) => {
  if (!phaseKey) return "";
  const map = {
    day_0_readiness: "Phase 1: Day 0 Readiness",
    core_learning: "Phase 2: Core Learning",
    revision: "Phase 3: Revision",
    company_preparation: "Phase 4: Company Preparation",
    final_assessment: "Phase 5: Final Assessment",
  };
  return map[phaseKey] || phaseKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function ProgramPreview() {
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { refetchUserData } = useUser();
  const { openLogin } = useAuthModalContext();
  const { programId } = useParams();
  const navigate = useNavigate();

  const isDarkMode = theme === "dark";

  const [activeTab, setActiveTab] = useState("curriculum");
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState("Monthly"); // 'Monthly' or 'Annual'
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Enrolled status & learning progression
  const [placementLearning, setPlacementLearning] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedCourseIds, setExpandedCourseIds] = useState(new Set());

  const [searchParams] = useSearchParams();
  const autoEnrollAttempted = useRef(false);

  const toggleCourseExpand = (cId) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(cId))) {
        next.delete(String(cId));
      } else {
        next.add(String(cId));
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (isAuthenticated) {
      Promise.allSettled([
        placementLearningAPI.getDashboard(),
        programLearningAPI.getAssignedPrograms(),
      ]).then(([placementRes, assignedRes]) => {
        if (cancelled) return;
        let userIsEnrolled = false;

        if (placementRes.status === 'fulfilled' && placementRes.value?.hasPlacementLearning) {
          setPlacementLearning(placementRes.value);
          const activeProgId = String(placementRes.value.program?.id || placementRes.value.program?._id || "");
          if (activeProgId === String(programId)) {
            userIsEnrolled = true;
          }
        }

        if (assignedRes.status === 'fulfilled' && Array.isArray(assignedRes.value?.programs)) {
          if (assignedRes.value.programs.some(p => String(p._id || p.id) === String(programId))) {
            userIsEnrolled = true;
          }
        }

        if (userIsEnrolled) {
          setIsEnrolled(true);
        }
      }).catch(() => {});
    } else {
      setIsEnrolled(false);
      setPlacementLearning(null);
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, programId]);

  // Auto-enroll if returning from auth redirect with autoEnroll=true or pending sessionStorage
  useEffect(() => {
    if (autoEnrollAttempted.current) return;
    const pendingProgId = sessionStorage.getItem('pending_enroll_program_id');
    const matchesPending = Boolean(pendingProgId && program && String(program._id) === String(pendingProgId));
    const shouldAutoEnroll = searchParams.get('autoEnroll') === 'true' || matchesPending;

    if (shouldAutoEnroll && isAuthenticated && program && !isEnrolled && !isPaying) {
      autoEnrollAttempted.current = true;
      sessionStorage.removeItem('pending_enroll_program_id');
      const isProgramPaid = Boolean(program?.isPaid || (Array.isArray(program?.pricingPlans) && program.pricingPlans.length > 0));
      if (!isProgramPaid) {
        setIsPaying(true);
        setPaymentMessage("");
        programLearningAPI.enrollFreeProgram(program._id)
          .then(async () => {
            if (typeof refetchUserData === 'function') {
              await refetchUserData();
            }
            navigate('/dashboard');
          })
          .catch((error) => {
            setPaymentMessage(error.message || 'Could not complete enrollment.');
            setIsPaying(false);
          });
      }
    }
  }, [searchParams, isAuthenticated, program, isEnrolled, isPaying, refetchUserData, navigate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    programLearningAPI
      .getPublicProgramPreview(programId)
      .then((payload) => {
        if (!cancelled) {
          const prog = payload.program || null;
          if (!prog || !prog._id) {
            throw new Error("No valid program data received from backend");
          }
          setProgram(prog);

          // Initialize selected billing strictly based on configured pricing options
          const configuredPlans = (prog.pricingPlans || []).filter((plan) => plan.active !== false && Number(plan.price) > 0);
          const hasMonthly = configuredPlans.some((p) => {
            const period = String(p.billingPeriod || "").toLowerCase();
            const unit = String(p.accessDurationUnit || "").toLowerCase();
            const key = String(p.key || "").toLowerCase();
            const title = String(p.title || "").toLowerCase();
            return period === "monthly" || unit === "months" || key.includes("month") || title.includes("month");
          }) || (prog.billingOptions?.includes("Monthly") && (prog.monthlyStructuredFee || prog.monthlyTrainerLedFee));

          const hasAnnual = configuredPlans.some((p) => {
            const period = String(p.billingPeriod || "").toLowerCase();
            const unit = String(p.accessDurationUnit || "").toLowerCase();
            const key = String(p.key || "").toLowerCase();
            const title = String(p.title || "").toLowerCase();
            return period === "annual" || unit === "years" || key.includes("annual") || key.includes("year") || title.includes("annual") || title.includes("year");
          }) || (prog.billingOptions?.includes("Annual") && (prog.annualStructuredFee || prog.annualTrainerLedFee));

          if (hasMonthly && hasAnnual) {
            setSelectedBilling("Monthly");
          } else if (hasMonthly) {
            setSelectedBilling("Monthly");
          } else if (hasAnnual) {
            setSelectedBilling("Annual");
          } else if (configuredPlans.length > 0) {
            setSelectedBilling(configuredPlans[0].billingPeriod || "Monthly");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "This program is not available.");
          setProgram(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return (
      <>
        <ScrollProgress />
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </>
    );
  }

  if (error || !program) {
    return (
      <div
        className={`course-details-page ${
          isDarkMode ? "dark-mode" : "light-mode"
        } flex min-h-screen items-center justify-center`}
      >
        <div className="page text-center py-20">
          <h1 className="course-title mb-4">
            {error ? "Program not available" : "Program Not Found"}
          </h1>
          {error && <p className="course-description mb-6 mx-auto">{error}</p>}
          <button
            onClick={() => navigate("/learn")}
            className="start-button mx-auto"
            type="button"
          >
            <span>BACK TO LEARN</span>
            <span className="button-arrow">←</span>
          </button>
        </div>
      </div>
    );
  }

  const isPaid = program.pricingType === "Paid";
  const intent = program.programType === "Skill" ? "skill" : "placement";
  const materials = Array.isArray(program.materials) ? program.materials : [];
  const phases = Array.isArray(program.phases) ? program.phases : [];
  const attachedCourses = Array.isArray(program.courseIds) && program.courseIds.length > 0
    ? program.courseIds
    : materials.filter((m) => m.type === "Course");
  const learningGoals = Array.isArray(program.learningGoals) && program.learningGoals.length > 0
    ? program.learningGoals
    : [];

  const currentProgramDay = placementLearning?.batch?.currentDay || placementLearning?.todayTopic?.day || 1;
  const isDay1 = currentProgramDay <= 1;

  // Determine pricing strictly based on configured pricing options
  const pricingPlans = (program.pricingPlans || []).filter((plan) => plan.active !== false && Number(plan.price) > 0);
  
  // Helper to test if a plan is Monthly
  const isMonthlyPlan = (p) => {
    const period = String(p.billingPeriod || "").toLowerCase();
    const unit = String(p.accessDurationUnit || "").toLowerCase();
    const key = String(p.key || "").toLowerCase();
    const title = String(p.title || "").toLowerCase();
    return period === "monthly" || unit === "months" || key.includes("month") || title.includes("month");
  };

  // Helper to test if a plan is Annual
  const isAnnualPlan = (p) => {
    const period = String(p.billingPeriod || "").toLowerCase();
    const unit = String(p.accessDurationUnit || "").toLowerCase();
    const key = String(p.key || "").toLowerCase();
    const title = String(p.title || "").toLowerCase();
    return period === "annual" || unit === "years" || key.includes("annual") || key.includes("year") || title.includes("annual") || title.includes("year");
  };

  const monthlyPlanCandidate = pricingPlans.find(isMonthlyPlan) || null;
  const annualPlanCandidate = pricingPlans.find(isAnnualPlan) || null;

  const monthlyDisplayPrice = monthlyPlanCandidate?.price 
    ?? program.monthlyStructuredFee 
    ?? program.monthlyTrainerLedFee 
    ?? null;

  const annualDisplayPrice = annualPlanCandidate?.price 
    ?? program.annualStructuredFee 
    ?? program.annualTrainerLedFee 
    ?? null;

  // An option is truly available only if a fee or active plan exists for that period
  const hasMonthlyOption = monthlyPlanCandidate !== null || (Number(monthlyDisplayPrice) > 0);
  const hasAnnualOption = annualPlanCandidate !== null || (Number(annualDisplayPrice) > 0);

  // If selectedBilling is invalid or points to an unavailable option, normalize it
  const effectiveBilling = (selectedBilling === "Monthly" && hasMonthlyOption)
    ? "Monthly"
    : (selectedBilling === "Annual" && hasAnnualOption)
    ? "Annual"
    : (hasMonthlyOption ? "Monthly" : (hasAnnualOption ? "Annual" : (pricingPlans[0]?.billingPeriod || "Monthly")));

  // Find plan strictly matching the active billing period, falling back to configured pricing plans
  const selectedPlan = (effectiveBilling.toLowerCase() === "monthly"
    ? monthlyPlanCandidate
    : annualPlanCandidate) || pricingPlans[0] || null;

  // Resolve current active price strictly for the effective billing
  let currentPrice = 0;
  if (selectedPlan && typeof selectedPlan.price === "number") {
    currentPrice = selectedPlan.price;
  } else if (effectiveBilling === "Monthly" && monthlyDisplayPrice !== null) {
    currentPrice = Number(monthlyDisplayPrice);
  } else if (effectiveBilling === "Annual" && annualDisplayPrice !== null) {
    currentPrice = Number(annualDisplayPrice);
  } else if (pricingPlans.length > 0 && typeof pricingPlans[0].price === "number") {
    currentPrice = pricingPlans[0].price;
  } else {
    currentPrice = Number(program.programFee) || 0;
  }


  // Handle Checkout / Payment
  const handlePayment = async () => {
    if (!isAuthenticated) {
      // Preserve the program and intended enrollment action across login/signup
      sessionStorage.setItem('pending_enroll_program_id', String(program?._id || programId));
      openLogin();
      return;
    }

    if (isPaying) return;

    if (isEnrolled) {
      if (isDay1) {
        navigate("/dashboard");
      } else {
        const todayTopicHref = placementLearning?.todayTopic?.href || (
          placementLearning?.course?.id
            ? `/learn/courses/${placementLearning.course.id}/topics?day=${currentProgramDay}`
            : "/dashboard"
        );
        navigate(todayTopicHref);
      }
      return;
    }

    if (!isPaid) {
      setIsPaying(true);
      setPaymentMessage("");
      try {
        await programLearningAPI.enrollFreeProgram(program._id);
        if (typeof refetchUserData === 'function') {
          await refetchUserData();
        }
        navigate('/dashboard');
      } catch (error) {
        setPaymentMessage(error.message || 'Could not enroll in this Program.');
      } finally {
        setIsPaying(false);
      }
      return;
    }

    if (!selectedPlan) {
      setPaymentMessage('This Program has no available pricing plan.');
      return;
    }

    setIsPaying(true);
    setPaymentMessage("");

    initiateRazorpayPayment({
      programId: program._id,
      planId: selectedPlan.key,
      programType: program.programType,
      user,
      onSuccess: async () => {
        setIsPaying(false);
        setPaymentSuccess(true);
        if (typeof refetchUserData === 'function') {
          await refetchUserData();
        }
        navigate('/dashboard');
      },
      onPending: (data) => {
        setIsPaying(false);
        navigate("/payment-status", {
          state: {
            status: "pending",
            programId: program._id,
            programName: program.name,
            amount: currentPrice,
            message: data?.message || "Payment is pending confirmation. Your access will activate once verification completes.",
          },
        });
      },
      onFailure: (err) => {
        setIsPaying(false);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Payment was not completed. Please retry checkout.";
        setPaymentMessage(errMsg);
      },
      onCancel: () => {
        setIsPaying(false);
        setPaymentMessage("Checkout was closed. You can retry anytime.");
      },
    });
  };

  return (
    <div
      className={`course-details-page ${
        isDarkMode ? "dark-mode" : "light-mode"
      }`}
    >
      <ScrollProgress />

      <main className="page">
        {/* =======================================
             HERO
        ======================================== */}
        <section className="hero">
          <div className="hero-left">
            <div className="course-type">
              {program.programType?.toUpperCase() || "SKILL"} PROGRAM
            </div>

            <h1 className="course-title">{program.name}</h1>

            <p className="course-description">
              {program.description ||
                "Explore the comprehensive structured curriculum, hands-on practice, and verified learning milestones."}
            </p>

            {/* PROGRAM META */}
            <div className="course-meta">
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">
                  {program.duration || `${program.durationDays || "—"} Days`}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Mode</span>
                <span className="meta-value">
                  {program.availability || "Structured"}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Access</span>
                <span className="meta-value">
                  {isPaid ? `₹${currentPrice} (${effectiveBilling})` : "Free"}
                </span>
              </div>
            </div>

            {/* BILLING SELECTION (Only when BOTH Monthly and Annual are configured) */}
            {isPaid && hasMonthlyOption && hasAnnualOption && (
              <div className="mt-4 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2 font-mono">
                  SELECT BILLING OPTION:
                </p>
                <div className="inline-flex rounded-xl p-1 bg-black/10 dark:bg-white/10 gap-1 border border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBilling("Monthly");
                      setPaymentMessage("");
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      effectiveBilling === "Monthly"
                        ? "bg-[#3c83f6] text-white shadow"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    Pay Monthly {monthlyDisplayPrice ? `(₹${monthlyDisplayPrice})` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBilling("Annual");
                      setPaymentMessage("");
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      effectiveBilling === "Annual"
                        ? "bg-[#3c83f6] text-white shadow"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    Pay Annually {annualDisplayPrice ? `(₹${annualDisplayPrice})` : ""}
                  </button>
                </div>
              </div>
            )}

            {/* SKILLS */}
            {program.skillTags && program.skillTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 mb-2">
                {program.skillTags.map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3C83F6]/15 text-[#3C83F6] dark:bg-blue-500/20 dark:text-blue-300"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            )}

            {/* TARGET COMPANIES (Placement programs) */}
            {program.targetCompanies && program.targetCompanies.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 mb-2 text-xs opacity-80">
                <span className="font-semibold uppercase tracking-wider text-[9px] opacity-60">
                  Target Companies:
                </span>
                {program.targetCompanies.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded border border-black/10 dark:border-white/10 text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* ACTION / CHECKOUT BUTTON */}
            <button
              className="start-button"
              id="startButton"
              type="button"
              disabled={isPaying}
              onClick={handlePayment}
            >
              <span>
                {isPaying
                  ? "ENROLLING…"
                  : isEnrolled
                  ? (isDay1 ? "START LEARNING" : "RESUME LEARNING")
                  : isPaid
                  ? `PAY ₹${currentPrice} WITH RAZORPAY`
                  : "START FREE PROGRAM"}
              </span>
              <span className="button-arrow">→</span>
            </button>

            {/* PAYMENT RESULT / STATUS MESSAGE */}
            {paymentMessage && (
              <p
                className={`mt-4 text-sm font-semibold max-w-lg ${
                  paymentSuccess ? "text-emerald-500" : "text-amber-500 dark:text-amber-400"
                }`}
                role="status"
                aria-live="polite"
              >
                {paymentMessage}
              </p>
            )}
          </div>

          {/* HERO VISUAL */}
          <div className="hero-visual">
            <div className="code-card">
              <div className="code-top">
                <div className="code-label">
                  {(program.name || "PROGRAM").toUpperCase()} / {isPaid ? "ENROLLMENT" : "CURRICULUM"}
                </div>
                <div className="code-progress-label">
                  {phases.length > 0 ? `01 / ${String(phases.length).padStart(2, "0")}` : "ACTIVE"}
                </div>
              </div>

              <div className="code-window">
                <div className="code-line">
                  <span className="code-number">01</span>
                  <span>
                    <span className="code-keyword">const</span> program = &#123;
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">02</span>
                  <span>
                    &nbsp;&nbsp;type: <span className="code-accent">"{program.programType}"</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">03</span>
                  <span>
                    &nbsp;&nbsp;duration: <span className="code-accent">"{program.duration || `${program.durationDays || 30} Days`}"</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">04</span>
                  <span>
                    &nbsp;&nbsp;billing: <span className="code-accent">"{effectiveBilling}"</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">05</span>
                  <span>
                    &nbsp;&nbsp;fee: <span className="code-accent">{isPaid ? `"₹${currentPrice}"` : '"Free"'}</span>,
                  </span>
                </div>

                <div className="code-line">
                  <span className="code-number">06</span>
                  <span>&#125;;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================
             TABS
        ======================================== */}
        <section className="tabs-section">
          <div className="tabs">
            <button
              className={`tab ${activeTab === "curriculum" ? "active" : ""}`}
              data-tab="curriculum"
              type="button"
              onClick={() => setActiveTab("curriculum")}
            >
              Curriculum
            </button>

            <button
              className={`tab ${activeTab === "schedule" ? "active" : ""}`}
              data-tab="schedule"
              type="button"
              onClick={() => setActiveTab("schedule")}
            >
              Schedule
            </button>

            <button
              className={`tab ${activeTab === "outcomes" ? "active" : ""}`}
              data-tab="outcomes"
              type="button"
              onClick={() => setActiveTab("outcomes")}
            >
              Outcomes
            </button>
          </div>

          {/* =====================================
               TAB 1: CURRICULUM (ATTACHED COURSES)
          ====================================== */}
          <div
            className={`tab-content ${
              activeTab === "curriculum" ? "active" : ""
            }`}
            id="curriculum"
          >
            <div className="section-eyebrow">CURRICULUM</div>

            <h2 className="section-title">What you'll learn.</h2>

            {attachedCourses.length > 0 ? (
              <div className="space-y-4">
                {attachedCourses.map((course, idx) => {
                  const cId = String(course._id || course.id || idx);
                  const isExpanded = expandedCourseIds.has(cId);
                  const topics = Array.isArray(course.topicIds) ? course.topicIds : [];
                  const topicCount = course.numTopics || topics.length;

                  return (
                    <div
                      key={cId}
                      className="rounded-2xl border border-[var(--border)] overflow-hidden transition-all duration-200 bg-[rgba(255,255,255,0.02)] dark:bg-[rgba(255,255,255,0.02)]"
                    >
                      {/* Course Header Bar (Clickable) */}
                      <button
                        type="button"
                        onClick={() => toggleCourseExpand(cId)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[rgba(255,255,255,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="chapter-number text-[8px] font-mono opacity-50 shrink-0">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-[var(--navy)] truncate group-hover:text-[#3c83f6] transition-colors">
                              {course.title || "Untitled Course"}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted)]">
                              {course.level && <span>{course.level}</span>}
                              {course.level && <span>•</span>}
                              <span>{topicCount} {topicCount === 1 ? "Topic" : "Topics"}</span>
                              {course.courseType && (
                                <>
                                  <span>•</span>
                                  <span>{course.courseType}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs font-semibold text-[#3c83f6] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                            {isExpanded ? "Collapse" : "View Curriculum"}
                          </span>
                          <div className={`p-1.5 rounded-lg border border-[var(--border)] transition-transform duration-200 ${isExpanded ? "rotate-180 bg-[#3c83f6]/10 text-[#3c83f6]" : "opacity-60"}`}>
                            <FiChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </button>

                      {/* Expandable Course Topics Curriculum List */}
                      {isExpanded && (
                        <div className="px-6 pb-5 pt-2 border-t border-[var(--border)] bg-black/[0.02] dark:bg-black/20 animate-in fade-in duration-200">
                          {course.description && (
                            <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed max-w-3xl">
                              {course.description}
                            </p>
                          )}

                          {topics.length > 0 ? (
                            <div className="curriculum-list border-t-0">
                              {(() => {
                                const mid = Math.ceil(topics.length / 2);
                                const col1 = topics.slice(0, mid);
                                const col2 = topics.slice(mid);

                                return (
                                  <>
                                    <div className="curriculum-col">
                                      {col1.map((topic, tIdx) => {
                                        const cleanTitle = (topic.title || "")
                                          .replace(/^CORE\s+(\w+)\s+NOTES\s*[-–]\s*\d+$/i, "$1")
                                          .replace(/^\d+\.\s*/, "")
                                          .replace(/\s*[-–]\s*\d+$/, "") || `Module ${tIdx + 1}`;
                                        return (
                                          <div className="curriculum-row" key={topic._id || tIdx}>
                                            <div className="chapter-number">{String(tIdx + 1).padStart(2, "0")}</div>
                                            <div className="chapter-name">{cleanTitle}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="curriculum-col">
                                      {col2.map((topic, tIdx) => {
                                        const cleanTitle = (topic.title || "")
                                          .replace(/^CORE\s+(\w+)\s+NOTES\s*[-–]\s*\d+$/i, "$1")
                                          .replace(/^\d+\.\s*/, "")
                                          .replace(/\s*[-–]\s*\d+$/, "") || `Module ${mid + tIdx + 1}`;
                                        return (
                                          <div className="curriculum-row" key={topic._id || tIdx}>
                                            <div className="chapter-number">{String(mid + tIdx + 1).padStart(2, "0")}</div>
                                            <div className="chapter-name">{cleanTitle}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="py-4 text-center text-xs text-[var(--muted)]">
                              Comprehensive curriculum covering foundational concepts through practical projects.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : materials.length > 0 ? (
              <div className="curriculum-list">
                {(() => {
                  const mid = Math.ceil(materials.length / 2);
                  const col1 = materials.slice(0, mid);
                  const col2 = materials.slice(mid);

                  return (
                    <>
                      <div className="curriculum-col">
                        {col1.map((mat, idx) => (
                          <div className="curriculum-row" key={mat.id || idx}>
                            <div className="chapter-number">
                              {String(idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{mat.title}</div>
                              <span className="text-xs opacity-60">
                                {mat.type} {mat.description ? `• ${mat.description}` : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="curriculum-col">
                        {col2.map((mat, idx) => (
                          <div className="curriculum-row" key={mat.id || idx}>
                            <div className="chapter-number">
                              {String(mid + idx + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <div className="chapter-name">{mat.title}</div>
                              <span className="text-xs opacity-60">
                                {mat.type} {mat.description ? `• ${mat.description}` : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="curriculum-col">
                <div className="curriculum-row">
                  <div className="chapter-number">01</div>
                  <div className="chapter-name">Foundations & Structured Learning Modules</div>
                </div>
              </div>
            )}
          </div>

          {/* =====================================
               TAB 2: SCHEDULE (5 LEARNING PHASES IN 1 LEFT-ALIGNED COLUMN)
          ====================================== */}
          <div
            className={`tab-content ${
              activeTab === "schedule" ? "active" : ""
            }`}
            id="schedule"
          >
            <div className="section-eyebrow">PROGRAM SCHEDULE</div>

            <h2 className="section-title">5 Learning Phases.</h2>

            {phases.length > 0 ? (
              <div className="max-w-3xl flex flex-col border-t border-[var(--border)]">
                {phases.map((p, idx) => (
                  <div
                    className="curriculum-row py-4"
                    key={p.phase || idx}
                    style={{ gridTemplateColumns: "56px 1fr" }}
                  >
                    <div className="chapter-number text-xs font-mono">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="chapter-name text-base font-bold text-[var(--navy)]">
                        {formatPhaseName(p.phase)}
                      </div>
                      <span className="text-xs text-[var(--muted)] mt-0.5 inline-block">
                        Day {p.startDay} – Day {p.endDay} ({Number(p.endDay) - Number(p.startDay) + 1} Days)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-3xl flex flex-col border-t border-[var(--border)]">
                {["Day 0 Readiness", "Core Learning", "Revision", "Company Preparation", "Final Assessment"].map((ph, idx) => (
                  <div className="curriculum-row py-4" key={ph} style={{ gridTemplateColumns: "56px 1fr" }}>
                    <div className="chapter-number text-xs font-mono">{String(idx + 1).padStart(2, "0")}</div>
                    <div className="chapter-name text-base font-bold text-[var(--navy)]">Phase {idx + 1}: {ph}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =====================================
               TAB 3: OUTCOMES
          ====================================== */}
          <div
            className={`tab-content ${
              activeTab === "outcomes" ? "active" : ""
            }`}
            id="outcomes"
          >
            <div className="section-eyebrow">AFTER THIS PROGRAM</div>

            <h2 className="section-title">What you'll achieve.</h2>

            {learningGoals.length > 0 ? (
              <div className="outcomes-grid">
                {learningGoals.map((outcome, index) => (
                  <div className="outcome-card" key={index}>
                    <div className="outcome-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="outcome-title">{outcome}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="outcomes-grid">
                {[
                  "Master problem-solving and algorithmic foundations",
                  "Build end-to-end full stack projects with modern stacks",
                  "Crack technical placement interviews and hiring assessments",
                ].map((fallbackGoal, index) => (
                  <div className="outcome-card" key={index}>
                    <div className="outcome-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="outcome-title">{fallbackGoal}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
