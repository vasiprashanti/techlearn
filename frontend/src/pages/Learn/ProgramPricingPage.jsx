import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuthModalContext } from "../../context/AuthModalContext";
import { programLearningAPI } from "../../services/programLearningApi";
import { courseAPI } from "../../services/api";
import { initiateRazorpayPayment } from "../../utils/razorpayCheckout";
import LoadingScreen from "../../components/LoadingScreen";

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
      <div className={`min-h-[calc(100vh-64px)] flex items-center justify-center ${isDarkMode ? "bg-[#050a3b] text-white" : "bg-[#dff5ff] text-[#050a3b]"}`}>
        <LoadingScreen showMessage={false} size={48} duration={800} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className={`min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? "bg-[#050a3b] text-white" : "bg-[#dff5ff] text-[#050a3b]"}`}>
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
        const defaultBenefits = isFeatured
          ? [
              "Everything in Focused",
              "More time for hands-on practice",
              "Revisit challenging concepts",
              "Strengthen skills through repetition",
              "Flexible schedule with clear progress goals",
              "Certificate upon successful completion",
            ]
          : [
              "One complete skill program",
              "Structured learning roadmap",
              "Hands-on practice and challenges",
              "Quizzes and skill assessments",
              "Progress tracking",
              "Certificate upon successful completion",
            ];

        return {
          planKey: plan.key,
          label: isFeatured ? "FLEXIBLE" : "FOCUSED",
          badge: isFeatured ? "MORE FLEXIBILITY" : null,
          price: Number(plan.price),
          periodText,
          description: isFeatured
            ? "The same learning path, with more room to practise, revisit concepts, and improve while staying on track."
            : "A defined timeline. A structured path. Learn with focus, practise with purpose, and work towards your certificate.",
          features: (Array.isArray(plan.benefits) && plan.benefits.length > 0) ? plan.benefits : defaultBenefits,
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
          features: [
            "One complete skill program",
            "Structured learning roadmap",
            "Hands-on practice and challenges",
            "Quizzes and skill assessments",
            "Progress tracking",
            "Certificate upon successful completion",
          ],
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
          features: [
            "Everything in Focused",
            "More time for hands-on practice",
            "Revisit challenging concepts",
            "Strengthen skills through repetition",
            "Flexible schedule with clear progress goals",
            "Certificate upon successful completion",
          ],
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

  return (
    <div className={`w-full min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] flex flex-col justify-center items-center font-sans overflow-y-auto lg:overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "dark bg-[#03092b] text-[#f0f6fc]" : "light bg-[#dff5ff] text-[#050a3b]"
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .programpricing-pixel {
          font-family: "Press Start 2P", monospace;
        }

        .price-card-hover {
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .price-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(4,16,61,.08);
        }

        .feature-item::before {
          content: "";
          flex: 0 0 13px;
          width: 13px;
          height: 13px;
          margin-top: 1px;
          border-radius: 50%;
          background-color: #b5e959;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4 8.2 6.7 10.8 12 5.5' fill='none' stroke='%23050a3b' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-size: 9px 9px;
          background-position: center;
          background-repeat: no-repeat;
          display: inline-block;
        }
      `}</style>

      {/* Main Pricing Section - fits single viewport without scroll */}
      <main className="w-full max-w-[840px] mx-auto px-4 py-4 sm:py-5 flex flex-col justify-center my-auto">
        {/* Header matching exact sizes from HTML reference */}
        <header className="text-center mx-auto mb-3 sm:mb-4 max-w-[610px]">
          <div className="programpricing-pixel text-[7px] leading-[1.8] tracking-[0.3px] uppercase opacity-50 mb-1.5 sm:mb-2 text-[#050a3b] dark:text-[#bceaff]">
            CHOOSE YOUR PLAN
          </div>

          <h1 className="text-[24px] sm:text-[34px] lg:text-[38px] font-extrabold tracking-[-0.065em] text-[#050a3b] dark:text-white leading-[1.08] m-0">
            One <i>Program.</i> {cards.length > 1 ? "Two ways" : "One goal"}
          </h1>

          <p className="mt-1 text-[11px] sm:text-[12px] leading-[1.5] text-[#65708c] dark:text-slate-300 max-w-[500px] mx-auto">
            Choose a focused timeline or give yourself more room to practise, improve, and build skills.
          </p>

          {paymentError && (
            <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-600 dark:text-red-300">
              {paymentError}
            </div>
          )}
        </header>

        {/* Pricing Cards Grid matching HTML reference */}
        <div className={`grid gap-3.5 mx-auto items-stretch w-full ${
          cards.length === 1
            ? "grid-cols-1 max-w-[370px]"
            : "grid-cols-1 md:grid-cols-2 max-w-[760px]"
        }`}>
          {cards.map((card, idx) => {
            const isPaying = payingPlanKey === (card.planKey || "course");
            const isFeatured = card.isFeatured;

            return (
              <article
                key={card.planKey || idx}
                className={`price-card-hover relative min-w-0 p-[18px] sm:p-[20px] rounded-[16px] border flex flex-col justify-between ${
                  isFeatured
                    ? "bg-[#050a3b] text-white border-[#050a3b] dark:border-white/20 shadow-lg"
                    : "bg-white dark:bg-[#071330] text-[#050a3b] dark:text-white border-[rgba(4,16,61,0.13)] dark:border-white/10 shadow-sm"
                }`}
              >
                <div>
                  {/* Popular / Feature Pill */}
                  {card.badge && (
                    <div className="absolute top-[13px] right-[13px] px-[7px] py-[3.5px] rounded-full bg-[#b5e959] text-[#050a3b] programpricing-pixel text-[5px] uppercase tracking-wider font-bold leading-[1.6]">
                      {card.badge}
                    </div>
                  )}

                  {/* Price Label */}
                  <div className="programpricing-pixel text-[7px] tracking-[0.2px] leading-[1.8] uppercase opacity-75 mb-2">
                    {card.label}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline flex-wrap gap-1.5 text-[32px] sm:text-[36px] font-extrabold tracking-[-0.065em] leading-[1.05]">
                    ₹{card.price.toLocaleString("en-IN")}{" "}
                    <small className={`text-[10px] font-medium tracking-normal ${
                      isFeatured ? "text-white/65" : "text-[#65708c] dark:text-slate-400"
                    }`}>
                      {card.periodText}
                    </small>
                  </div>

                  {/* Description */}
                  <p className={`min-h-[34px] sm:min-h-[38px] mt-2 text-[11px] leading-[1.45] ${
                    isFeatured ? "text-white/75" : "text-[#65708c] dark:text-slate-400"
                  }`}>
                    {card.description}
                  </p>

                  {/* CTA Button */}
                  <button
                    type="button"
                    disabled={Boolean(payingPlanKey)}
                    onClick={() => handleSelectPlan(card)}
                    className={`programpricing-pixel w-full min-h-[38px] mt-3 py-2 px-3 rounded-[8px] text-[10px] tracking-[1px] font-normal transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      isFeatured
                        ? "bg-[#b5e959] hover:bg-[#c8f477] text-[#050a3b] border border-[#b5e959]"
                        : "bg-[#050a3b] hover:bg-[#111b58] text-white border border-[#050a3b] dark:bg-[#3c83f6] dark:hover:bg-[#2563eb] dark:border-transparent"
                    }`}
                  >
                    <span>{isPaying ? "PROCESSING…" : "ENROLL NOW"}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>

                {/* Features List */}
                <ul className={`p-0 mt-3 list-none border-t ${
                  isFeatured ? "border-white/15" : "border-[rgba(4,16,61,0.10)] dark:border-white/10"
                }`}>
                  {card.features.slice(0, 6).map((feat, fIdx) => (
                    <li
                      key={fIdx}
                      className={`feature-item flex items-start gap-2 py-1.5 border-b text-[10px] leading-[1.4] ${
                        isFeatured
                          ? "border-white/15 text-white/85"
                          : "border-[rgba(4,16,61,0.10)] dark:border-white/10 text-[#303c5d] dark:text-slate-300"
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
