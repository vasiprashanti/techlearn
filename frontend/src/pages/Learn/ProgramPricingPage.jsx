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
import LoadingScreen from "../../components/LoadingScreen";
import PricingExitFeedbackModal from "../../components/PricingExitFeedbackModal";

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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

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
    setIsFeedbackModalOpen(true);
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode ? "bg-[#050b2e] text-white" : "bg-[#dff5ff] text-[#050a3b]"
      }`}
      style={{
        "--light-bg": isDarkMode ? "#050b2e" : "#dff5ff",
        "--card-navy": isDarkMode ? "#0a1238" : "#ffffff",
        "--featured-bg": isDarkMode ? "#0a1238" : "#050a3b",
        "--border-color": isDarkMode ? "#222e55" : "rgba(4,16,61,.13)",
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

      {/* Pricing Exit Feedback Modal triggered upon clicking arrow back */}
      <PricingExitFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          handleBackToProgram();
        }}
        onSubmitted={() => {
          setIsFeedbackModalOpen(false);
          handleBackToProgram();
        }}
        programId={item?._id}
        selectedPlan={cards[0]?.planKey}
      />
    </div>
  );
}
