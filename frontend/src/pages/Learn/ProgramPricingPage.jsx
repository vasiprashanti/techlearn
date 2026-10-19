import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuthModalContext } from "../../context/AuthModalContext";
import { programLearningAPI } from "../../services/programLearningApi";
import { courseAPI } from "../../services/api";
import { initiateRazorpayPayment } from "../../utils/razorpayCheckout";
import API from "../../api/client";
import LoadingScreen from "../../components/LoadingScreen";

const EXIT_FEEDBACK_OPTIONS = [
  "Fees are too high / Feels expensive",
  "Looking for free courses first",
  "Need more details / Want to speak with counselor",
  "Payment or UPI issue",
  "Just exploring for now",
  "Something else",
];

export default function ProgramPricingPage() {
  const { programId, courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const { user, isAuthenticated } = useAuth();
  const { refetchUserData } = useUser();
  const { openLogin } = useAuthModalContext();

  const [item, setItem] = useState(null);
  const [itemType, setItemType] = useState("program");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingPlanKey, setPayingPlanKey] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [customFeedbackReason, setCustomFeedbackReason] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const effectiveProgramId = programId || location.state?.programId;
  const effectiveCourseId = courseId || location.state?.courseId;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const fetchData = async () => {
      try {
        if (effectiveProgramId) {
          setItemType("program");
          const res = await programLearningAPI.getPublicProgramPreview(effectiveProgramId);
          if (cancelled) return;
          if (res?.program) {
            setItem(res.program);
          } else {
            setError("Program details could not be loaded.");
          }
        } else if (effectiveCourseId) {
          setItemType("course");
          const res = await courseAPI.getCourse(effectiveCourseId);
          if (cancelled) return;
          const courseData = res?.course || res;
          if (courseData?._id) {
            setItem(courseData);
          } else {
            setError("Course details could not be loaded.");
          }
        } else {
          setError("No program or course specified for pricing.");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || "Failed to load pricing information.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [effectiveProgramId, effectiveCourseId]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#050b2e] text-white" : "bg-[#dff5ff] text-[#050a3b]"}`}>
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? "bg-[#050b2e] text-white" : "bg-[#dff5ff] text-[#050a3b]"}`}>
        <h1 className="text-2xl font-bold mb-3">{error || "Pricing Not Found"}</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-[#050a3b] text-white dark:bg-white dark:text-[#050a3b] text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Derive pricing cards based on configured options
  let cards = [];

  const defaultFocusedBenefits = [
    "One complete skill program",
    "Structured learning roadmap",
    "Hands-on practice and challenges",
    "Quizzes and skill assessments",
    "Progress tracking",
    "Certificate upon successful completion",
  ];

  const defaultFlexibleBenefits = [
    "Everything in Focused",
    "More time for hands-on practice",
    "Revisit challenging concepts",
    "Strengthen skills through repetition",
    "Flexible schedule with clear progress goals",
    "Certificate upon successful completion",
  ];

  if (itemType === "program") {
    const rawPlans = (item.pricingPlans || []).filter(
      (p) => p.active !== false && Number(p.price) > 0
    );

    const isMonthly = (p) => {
      const period = String(p.billingPeriod || "").toLowerCase();
      const unit = String(p.accessDurationUnit || "").toLowerCase();
      const key = String(p.key || "").toLowerCase();
      const title = String(p.title || "").toLowerCase();
      return period === "monthly" || unit === "months" || key.includes("month") || title.includes("month");
    };

    const isAnnual = (p) => {
      const period = String(p.billingPeriod || "").toLowerCase();
      const unit = String(p.accessDurationUnit || "").toLowerCase();
      const key = String(p.key || "").toLowerCase();
      const title = String(p.title || "").toLowerCase();
      return period === "annual" || unit === "years" || key.includes("annual") || key.includes("year") || title.includes("annual") || title.includes("year");
    };

    const monthlyPlan = rawPlans.find(isMonthly);
    const annualPlan = rawPlans.find(isAnnual);

    const monthlyPrice = monthlyPlan?.price ?? item.monthlyStructuredFee ?? item.monthlyTrainerLedFee ?? null;
    const annualPrice = annualPlan?.price ?? item.annualStructuredFee ?? item.annualTrainerLedFee ?? item.programFee ?? null;

    if (rawPlans.length > 0) {
      cards = rawPlans.slice(0, 2).map((plan, idx) => {
        const isFeatured = idx === 1 || isAnnual(plan);
        const periodText = isMonthly(plan) ? "per month" : isAnnual(plan) ? "per year" : (plan.billingPeriod ? `per ${plan.billingPeriod.toLowerCase()}` : "one-time");

        const features = (Array.isArray(plan.benefits) && plan.benefits.length >= 4)
          ? plan.benefits
          : (isFeatured ? defaultFlexibleBenefits : defaultFocusedBenefits);

        return {
          planKey: plan.key,
          label: isFeatured ? "FLEXIBLE" : "FOCUSED",
          badge: isFeatured ? "MORE FLEXIBILITY" : null,
          price: Number(plan.price),
          periodText,
          description: isFeatured
            ? "The same learning path, with more room to practise, revisit concepts, and improve while staying on track."
            : "A defined timeline. A structured path. Learn with focus, practise with purpose, and work towards your certificate.",
          features,
          isFeatured,
        };
      });
    } else {
      if (monthlyPrice && Number(monthlyPrice) > 0) {
        cards.push({
          planKey: `${item.programType?.toLowerCase() || "skill"}-monthly-structured`,
          label: "FOCUSED",
          badge: null,
          price: Number(monthlyPrice),
          periodText: "per month",
          description: "A defined timeline. A structured path. Learn with focus, practise with purpose, and work towards your certificate.",
          features: defaultFocusedBenefits,
          isFeatured: false,
        });
      }
      if (annualPrice && Number(annualPrice) > 0) {
        cards.push({
          planKey: `${item.programType?.toLowerCase() || "skill"}-annual-structured`,
          label: "FLEXIBLE",
          badge: "MORE FLEXIBILITY",
          price: Number(annualPrice),
          periodText: "per year",
          description: "The same learning path, with more room to practise, revisit concepts, and improve while staying on track.",
          features: defaultFlexibleBenefits,
          isFeatured: true,
        });
      }
    }
  } else {
    const priceNum = Number(item.price ?? item.programFee ?? 0);
    cards = [
      {
        courseId: item._id,
        label: "COURSE ACCESS",
        badge: "FULL ACCESS",
        price: priceNum,
        periodText: "one-time",
        description: item.description || "Full curriculum access with all interactive lessons, code playgrounds, and quizzes.",
        features: [
          "Complete course curriculum and topics",
          "Interactive coding compiler & exercises",
          "Self-paced learning with verified quizzes",
          "Progress tracking",
          "Certificate upon successful completion",
        ],
        isFeatured: true,
      },
    ];
  }

  const handleSelectPlan = async (card) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("pending_enroll_program_id", String(item._id));
      openLogin();
      return;
    }

    setPaymentError("");
    const planKey = card.planKey || "course";
    setPayingPlanKey(planKey);

    initiateRazorpayPayment({
      programId: itemType === "program" ? item._id : undefined,
      courseId: itemType === "course" ? item._id : undefined,
      planId: card.planKey,
      programType: item.programType,
      user,
      onSuccess: async (resData) => {
        setPayingPlanKey("");
        if (typeof refetchUserData === "function") {
          await refetchUserData();
        }
        navigate("/dashboard");
      },
      onPending: (data) => {
        setPayingPlanKey("");
        navigate("/payment-status", {
          state: {
            status: "pending",
            programId: item._id,
            programName: item.name || item.title,
            amount: card.price,
            message: data?.message || "Payment is pending confirmation. Your access will activate once verification completes.",
          },
        });
      },
      onFailure: (err) => {
        setPayingPlanKey("");
        setPaymentError(err?.response?.data?.message || err?.message || "Payment processing failed. Please try again.");
      },
      onCancel: () => {
        setPayingPlanKey("");
      },
    });
  };

  const targetProgramDetailsUrl = itemType === "program" && item?._id
    ? `/learn/programs/${item._id}`
    : effectiveProgramId
    ? `/learn/programs/${effectiveProgramId}`
    : effectiveCourseId
    ? `/learn/courses/${effectiveCourseId}`
    : "/learn";

  const handleBackToProgram = () => {
    navigate(targetProgramDetailsUrl);
  };

  const handleBackClick = () => {
    setFeedbackError("");
    setIsFeedbackOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackReason) {
      setFeedbackError("Please select an option before submitting.");
      return;
    }

    if (feedbackReason === "Need more details / Want to speak with counselor") {
      window.open(
        'https://api.whatsapp.com/send/?phone=919000663666&text=Hey%2C+I+need+more+information+before+joining+the+program.+Can+you+help+me%3F&type=phone_number&app_absent=0',
        '_blank'
      );
    }

    setIsSubmittingFeedback(true);
    try {
      await API.post('/api/payments/exit-feedback', {
        programId: item?._id,
        selectedPlan: cards[0]?.planKey,
        reason: feedbackReason,
        customReason: feedbackReason === "Something else" ? customFeedbackReason.trim() : "",
      });
    } catch (err) {
      console.error("Failed to submit exit feedback:", err);
    } finally {
      setIsSubmittingFeedback(false);
      handleBackToProgram();
    }
  };

  if (isFeedbackOpen) {
    return (
      <div className={`tl-unified-onboarding-root ${isDarkMode ? "dark-mode" : ""}`}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

          .tl-unified-onboarding-root {
            --navy: #bceaff;
            --navy-dark: #02052e;
            --chip-blue: rgba(255, 255, 255, 0.45);
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
            --input-bg: rgba(255, 255, 255, .45);

            min-height: 100vh;
            background: linear-gradient(135deg, #daf0fa 0%, #bceaff 45%, #bceaff 100%);
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
            background: #080d25;
            --navy: #080d25;
            --navy-dark: #020416;
            --chip-blue: rgba(255, 255, 255, 0.05);
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

          .tl-feedback-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
          }

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
            width: 100%;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
          }

          .tl-other-input {
            width: 100%;
            height: 42px;
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
          <div className="tl-screen">
            <div className="tl-screen-body">
              <div className="tl-eyebrow">BEFORE YOU GO...</div>
              <h1 className="tl-title">
                What made you want to <i>leave pricing?</i>
              </h1>

              <div className="tl-field">
                <div className="tl-feedback-options">
                  {EXIT_FEEDBACK_OPTIONS.map((itemOption) => (
                    <button
                      key={itemOption}
                      type="button"
                      className={`tl-chip ${feedbackReason === itemOption ? "selected" : ""}`}
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setFeedbackReason(itemOption);
                        setFeedbackError("");
                      }}
                    >
                      {itemOption}
                    </button>
                  ))}
                </div>

                {feedbackReason === "Something else" && (
                  <div className="tl-other-wrapper">
                    <input
                      type="text"
                      className="tl-other-input"
                      placeholder="Please share what made you want to leave..."
                      value={customFeedbackReason}
                      onChange={(e) => setCustomFeedbackReason(e.target.value)}
                      maxLength={150}
                      autoFocus
                    />
                  </div>
                )}

                {feedbackError && (
                  <div className="tl-error-text" style={{ textAlign: "center", maxWidth: "500px", margin: "12px auto 0" }}>
                    {feedbackError}
                  </div>
                )}
              </div>
            </div>

            <div className="tl-actions">
              <button
                type="button"
                className="tl-btn tl-btn-back"
                disabled={isSubmittingFeedback}
                onClick={() => {
                  setFeedbackError("");
                  setIsFeedbackOpen(false);
                }}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="tl-btn tl-btn-primary"
                disabled={isSubmittingFeedback}
                onClick={handleFeedbackSubmit}
              >
                {isSubmittingFeedback ? "SUBMITTING..." : "SUBMIT"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode
          ? "bg-[#080d25] text-white"
          : "bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] text-[#050a3b]"
      }`}
      style={{
        "--light-bg": isDarkMode ? "#080d25" : "#bceaff",
        "--card-navy": isDarkMode ? "#0c1438" : "#ffffff",
        "--featured-bg": isDarkMode ? "#0c1438" : "#050a3b",
        "--border-color": isDarkMode ? "rgba(255, 255, 255, 0.10)" : "rgba(4,16,61,.13)",
        "--muted-color": isDarkMode ? "#c0cbe2" : "#65708c",
        "--green-color": isDarkMode ? "#89c638" : "#b5e959",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .pp-pixel {
          font-family: "Press Start 2P", monospace;
        }

        .pp-price-card {
          position: relative;
          min-width: 0;
          padding: 27px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }

        .pp-price-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 40px ${isDarkMode ? "rgba(0,0,0,.25)" : "rgba(4,16,61,.06)"};
        }

        .pp-check::before {
          content: "";
          flex: 0 0 14px;
          width: 14px;
          height: 14px;
          margin-top: 1px;
          border-radius: 50%;
          background-color: ${isDarkMode ? "#89c638" : "#b5e959"};
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.2 6.7 10.8 12 5.5' fill='none' stroke='%23050a3b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-size: 10px 10px;
          background-position: center;
          background-repeat: no-repeat;
          display: inline-block;
        }

        @media (max-width: 700px) {
          .pp-price-card {
            padding: 22px 19px;
            border-radius: 15px;
          }
        }
      `}</style>

      {/* Back Button Container */}
      <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackClick}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isDarkMode
              ? "bg-[#0a1238] border-[#222e55] text-[#c0cbe2] hover:text-white hover:border-[#89c638]"
              : "bg-white border-[rgba(4,16,61,.13)] text-[#65708c] hover:text-[#050a3b] hover:border-[#050a3b]"
          }`}
          title="Back to Program Details"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Program</span>
        </button>
      </div>

      {/* Main Pricing Section */}
      <main className="flex-1 w-full max-w-[1000px] mx-auto px-[14px] pt-4 sm:pt-6 pb-[clamp(52px,5.6vw,74px)] flex flex-col">
        {/* Header from programpricing.html */}
        <header className="text-center mx-auto mb-[38px] max-w-[610px]">
          <div
            className={`pp-pixel text-[7px] leading-[1.8] tracking-[.3px] uppercase mb-[17px] ${
              isDarkMode ? "text-white" : "text-[rgba(4,16,61,.48)]"
            }`}
          >
            CHOOSE YOUR PLAN
          </div>

          <h1
            className={`text-[clamp(28px,5vw,44px)] font-extrabold tracking-[-.065em] leading-[1.08] m-0 ${
              isDarkMode ? "text-white" : "text-[#050a3b]"
            }`}
          >
            One <i>Program.</i> {cards.length > 1 ? "Two ways" : "One goal"}
          </h1>

          <p
            className={`mt-[10px] text-[12px] leading-[1.7] max-w-[990px] mx-auto ${
              isDarkMode ? "text-[#c0cbe2]" : "text-[#65708c]"
            }`}
          >
            Choose a focused timeline or give yourself more room to practise,
            improve, and build skills.
          </p>

          {paymentError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-600 dark:text-red-300">
              {paymentError}
            </div>
          )}
        </header>

        {/* Pricing Cards Grid */}
        <div
          className={`grid gap-4 mx-auto items-stretch w-full ${
            cards.length === 1
              ? "grid-cols-1 max-w-[400px]"
              : "grid-cols-1 md:grid-cols-2 max-w-[800px]"
          }`}
        >
          {cards.map((card, idx) => {
            const isPaying = payingPlanKey === (card.planKey || "course");
            const isRightCard = idx === 1 || card.isFeatured;

            // Card styling
            // Dark mode:
            // Left Card (Focused/Blur Card): bg #0a1238, border #222e55, text white
            // Right Card (Flexible): bg #0a1238, border #222e55, text white
            // Light mode:
            // Left Card: bg white, border rgba(4,16,61,.13), text #050a3b
            // Right Card (Featured): bg #050a3b, border #050a3b, text white
            const cardBg = isDarkMode
              ? "bg-[#0a1238] border-[#222e55] text-white"
              : isRightCard
              ? "bg-[#050a3b] border-[#050a3b] text-white"
              : "bg-white border-[rgba(4,16,61,.13)] text-[#050a3b]";

            // Button styling according to explicit instructions:
            // "keep the right side card's button color as lime in Dark Mode and white button for Blur Card in Dark mode"
            // In Light Mode:
            // Left Card button: navy bg (#050a3b) with white text
            // Right Card button: lime bg (#b5e959) with navy text (#050a3b)
            let btnStyle = "";
            if (isDarkMode) {
              if (isRightCard) {
                // Right side card: lime button
                btnStyle = "bg-[#89c638] hover:bg-[#a2dc59] text-[#17230c] border border-[#89c638]";
              } else {
                // Left side (Blur Card): white button
                btnStyle = "bg-white hover:bg-slate-100 text-[#050b2e] border border-white";
              }
            } else {
              if (isRightCard) {
                btnStyle = "bg-[#b5e959] hover:bg-[#c8f477] text-[#050a3b] border border-[#b5e959]";
              } else {
                btnStyle = "bg-[#050a3b] hover:bg-[#111b58] text-white border border-[#050a3b]";
              }
            }

            return (
              <article
                key={card.planKey || idx}
                className={`pp-price-card border ${cardBg}`}
              >
                <div>
                  {/* Badge for right card */}
                  {card.badge && (
                    <div
                      className="popular absolute top-[18px] right-[18px] px-[8px] py-[6px] rounded-full pp-pixel text-[5px] uppercase tracking-wider font-bold leading-[1.6]"
                      style={{
                        backgroundColor: isDarkMode ? "#89c638" : "#b5e959",
                        color: isDarkMode ? "#17230c" : "#050a3b",
                      }}
                    >
                      {card.badge}
                    </div>
                  )}

                  {/* Price Label */}
                  <div
                    className={`pp-pixel text-[7px] tracking-[.2px] leading-[1.8] uppercase mb-[19px] ${
                      isDarkMode
                        ? "text-white"
                        : isRightCard
                        ? "text-white"
                        : "text-[#050a3b]"
                    }`}
                  >
                    {card.label}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline flex-wrap gap-[6px] text-[clamp(34px,4vw,45px)] font-extrabold tracking-[-.065em] leading-[1.05]">
                    ₹{card.price.toLocaleString("en-IN")}{" "}
                    <small
                      className={`text-[10px] font-medium tracking-normal ${
                        isDarkMode
                          ? "text-[#c0cbe2]"
                          : isRightCard
                          ? "text-white/65"
                          : "text-[#65708c]"
                      }`}
                    >
                      {card.periodText}
                    </small>
                  </div>

                  {/* Description */}
                  <p
                    className={`min-h-[50px] mt-[14px] text-[11px] leading-[1.65] ${
                      isDarkMode
                        ? "text-[#c0cbe2]"
                        : isRightCard
                        ? "text-white/72"
                        : "text-[#65708c]"
                    }`}
                  >
                    {card.description}
                  </p>

                  {/* CTA Button */}
                  <button
                    type="button"
                    disabled={Boolean(payingPlanKey)}
                    onClick={() => handleSelectPlan(card)}
                    className={`pp-pixel w-full min-h-[40px] mt-[20px] py-[10px] px-[14px] rounded-[8px] text-[10px] tracking-[1px] font-light transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${btnStyle}`}
                  >
                    <span>{isPaying ? "PROCESSING…" : "ENROLL NOW"}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>

                {/* Features List */}
                <ul
                  className={`p-0 mt-[24px] list-none border-t ${
                    isDarkMode
                      ? "border-white/15"
                      : isRightCard
                      ? "border-white/15"
                      : "border-[rgba(4,16,61,.10)]"
                  }`}
                >
                  {card.features.map((feat, fIdx) => (
                    <li
                      key={fIdx}
                      className={`pp-check flex items-start gap-[8px] py-[10px] border-b text-[10px] leading-[1.6] ${
                        isDarkMode
                          ? "border-white/15 text-white"
                          : isRightCard
                          ? "border-white/15 text-white/86"
                          : "border-[rgba(4,16,61,.10)] text-[#303c5d]"
                      }`}
                    >
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
