import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Target, ArrowDown, ShieldCheck, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import API from '../../api/client';
import { initiateRazorpayPayment } from '../../utils/razorpayCheckout';
import PricingExitFeedbackModal from '../../components/PricingExitFeedbackModal';

export default function OnboardingPrograms() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {};

  const { user: authUser } = useAuth();
  const { user: contextUser, refetchUserData } = useUser();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSkillReturningUser, setIsSkillReturningUser] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const storedUserData = (() => {
    try {
      return JSON.parse(localStorage.getItem('userData')) || {};
    } catch {
      return {};
    }
  })();

  const currentUser = {
    ...storedUserData,
    ...authUser,
    ...contextUser,
    ...locationState,
  };

  const goal = currentUser?.learningGoal || 'Get Placed';
  const isPlacement = goal === 'Get Placed' || !goal;

  const targetRole = currentUser?.targetRole || 'Software Developer';

  const userSkills = Array.isArray(currentUser?.skills) && currentUser.skills.length > 0 
    ? currentUser.skills 
    : (currentUser?.skill ? [currentUser.skill] : ['Java']);
  const selectedSkill = userSkills[0];
  const displaySkills = userSkills.join(', ');

  // Fetch Skill eligibility from backend on mount
  useEffect(() => {
    let isMounted = true;
    const checkEligibility = async () => {
      try {
        const res = await API.get('/api/payments/eligibility?programType=Skill');
        if (isMounted && res.data?.success) {
          setIsSkillReturningUser(!!res.data.isReturningUser);
        }
      } catch (err) {
        console.error('Error fetching payment eligibility:', err);
      }
    };
    checkEligibility();
    return () => { isMounted = false; };
  }, []);

  const handleEnrollNow = async (planId) => {
    if (loading) return;
    setSelectedPlanId(planId);
    setLoading(true);

    initiateRazorpayPayment({
      planId,
      programId: currentUser?.programId || null,
      user: currentUser,
      onSuccess: async (resData) => {
        console.log('Payment successful & verified:', resData);
        try {
          await API.post('/api/users/update-program-tier', {
            planId,
            learningGoal: goal,
            targetRole,
            selectedSkill,
          }).catch(() => {});

          if (typeof refetchUserData === 'function') {
            await refetchUserData();
          }
        } catch (err) {
          console.error('Post-payment sync error:', err);
        } finally {
          setLoading(false);
          navigate('/dashboard');
        }
      },
      onFailure: (error) => {
        console.error('Payment failed or error:', error);
        alert(error.message || 'Payment processing failed. Please try again.');
        setLoading(false);
      },
      onCancel: () => {
        console.log('User cancelled checkout modal');
        setLoading(false);
      },
    });
  };

  // Placement Plans: ONLY ₹799 and ₹999 cards (No Free/₹0 card)
  const placementPlans = [
    {
      id: 'placement_season_pass',
      title: 'Placement Season Pass',
      price: '₹799',
      subtitle: '90 Days Total Access',
      badge: 'MOST POPULAR',
      highlight: true,
      icon: Sparkles,
      color: 'border-[#a3e635] bg-[#f7fee7]/60 dark:bg-[#1a2e05]/40 shadow-xl shadow-[#a3e635]/15 ring-2 ring-[#a3e635]',
      btnStyle: 'bg-[#a3e635] text-black font-extrabold hover:bg-[#86efac] shadow-lg shadow-[#a3e635]/25',
      features: [
        `30-Day Structured Placement Program for ${targetRole}`,
        '60 additional days of platform access (90 days total)',
        'Daily learning tasks & structured progression',
        'Interactive coding challenges & assessments',
        'Company-wise interview preparation',
        'Placement readiness & mock prep'
      ],
      refundNotice: 'Cancel anytime. Get refunded if you cancel within 5 days.',
    },
    {
      id: 'placement_season_pass_pro',
      title: 'Placement Season Pass Pro',
      price: '₹999',
      subtitle: '120 Days Total Access',
      badge: 'BEST VALUE',
      highlight: false,
      icon: Sparkles,
      color: 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-xl shadow-blue-500/10',
      btnStyle: 'bg-[#3c83f6] text-white font-extrabold hover:bg-blue-600 shadow-lg shadow-blue-500/25',
      features: [
        `30-Day Structured Placement Program for ${targetRole}`,
        '90 additional days of platform access (120 days total)',
        'Same core 30-day program + extended practice',
        'Daily learning, tasks & challenges',
        'Company-wise preparation & assessments',
        'Longer period to prepare post-program'
      ],
      refundNotice: 'Cancel anytime. Get refunded if you cancel within 5 days.',
    }
  ];

  // Skill Plans: Server eligibility determines whether user pays ₹499 or ₹199
  const skillPlans = [
    {
      id: isSkillReturningUser ? 'skill_membership' : 'skill_program',
      title: isSkillReturningUser ? 'Returning Paid User' : 'First-Time Paid User',
      price: isSkillReturningUser ? '₹199' : '₹499',
      subtitle: '30 Days Access',
      badge: isSkillReturningUser ? 'RETURNING OFFER' : '30-DAY ACCESS',
      highlight: true,
      icon: Sparkles,
      color: 'border-[#a3e635] bg-[#f7fee7]/60 dark:bg-[#1a2e05]/40 shadow-xl shadow-[#a3e635]/15 ring-2 ring-[#a3e635]',
      btnStyle: 'bg-[#a3e635] text-black font-extrabold hover:bg-[#86efac] shadow-lg shadow-[#a3e635]/25',
      features: [
        `Full 30-Day ${displaySkills} Program`,
        'Complete learning roadmap & course content',
        'Daily tasks & coding challenges',
        'Practice questions & notes',
        isSkillReturningUser ? 'Discounted returning learner price (₹199)' : 'First-time paid learner access (₹499)',
      ],
      refundNotice: null,
    }
  ];

  const plans = isPlacement ? placementPlans : skillPlans;

  const handleCheckPricing = (e) => {
    e.preventDefault();
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`relative isolate min-h-screen overflow-x-clip font-sans antialiased text-[#00113b] dark:text-[#8fd9ff] selection:bg-[#3c83f6]/20 ${
      isDarkMode 
        ? "dark bg-gradient-to-br from-[#020b23] via-[#001233] to-[#0a1128]" 
        : "light bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff]"
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .ob-pixel-heading {
          font-family: 'Press Start 2P', cursive !important;
        }
      `}</style>

      {/* Global Ambient Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent dark:from-blue-600/15"
      />

      {/* Exit Feedback Modal */}
      <PricingExitFeedbackModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onSubmitted={() => navigate(-1)}
        programId={currentUser?.programId}
        selectedPlan={selectedPlanId}
      />

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[calc(100vh-64px)] flex flex-col items-center px-4 pt-24 pb-12">
        <div className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-start px-2">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-[#0e1a30]/90 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-extrabold shadow-md cursor-pointer z-20"
          >
            <svg className="w-4 h-4 text-[#3c83f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-white/80 dark:bg-[#0e1a30]/80 backdrop-blur-sm px-4 py-2 text-sm shadow-sm"
          >
            <Target className="h-4 w-4 text-[#3c83f6]" aria-hidden />
            <span className="text-slate-500 dark:text-slate-400">
              {isPlacement ? 'Target Role:' : 'Selected Skill(s):'}
            </span>
            <span className="font-semibold text-[#3c83f6] dark:text-[#60a5fa]">
              {isPlacement ? targetRole : displaySkills}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="ob-pixel-heading mt-8 flex flex-col items-center gap-2.5 text-[clamp(1.15rem,4.2vw,2.2rem)] leading-[1.4] bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] bg-clip-text text-transparent uppercase tracking-wider"
          >
            <span>{isPlacement ? 'PLACEMENT PROGRAM' : 'SKILL PROGRAM'}</span>
            <span>PRICING</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-lg"
          >
            Based on your onboarding preferences, we matched you with the following learning
            programs. Choose your plan to complete enrollment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex w-full max-w-xl items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0e1a30]/80 p-5 text-left shadow-md backdrop-blur-sm"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {isPlacement ? (
                <>
                  Your selected target role (
                  <span className="font-semibold text-slate-900 dark:text-white">{targetRole}</span>) will
                  personalize your daily tasks, challenges &amp; learning content.
                </>
              ) : (
                <>
                  Your selected skill(s) (
                  <span className="font-semibold text-slate-900 dark:text-white">{displaySkills}</span>) will
                  personalize your learning path, practice questions &amp; course content.
                </>
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10"
          >
            <button
              type="button"
              onClick={handleCheckPricing}
              className="group inline-flex h-12 items-center justify-center rounded-xl bg-[#a3e635] hover:bg-[#86efac] text-slate-950 px-8 text-[10px] sm:text-xs tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-[#a3e635]/25 active:scale-95 cursor-pointer ob-pixel-heading font-normal"
            >
              <span>CHECK PRICING</span>
              <ArrowDown className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-y-1" />
            </button>
          </motion.div>

        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section id="pricing" className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          
          <div className="text-center space-y-1.5">
            <h2 className="ob-pixel-heading text-base sm:text-lg uppercase tracking-wider text-slate-900 dark:text-white">
              Choose Your Plan
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Select the plan that fits your preparation goals. Upgrades are available anytime.
            </p>
          </div>

          <div className={`grid grid-cols-1 ${plans.length > 1 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'max-w-md mx-auto'} gap-6 pt-2`}>
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 border transition-all duration-300 ${plan.color}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm ${
                        plan.highlight
                          ? 'bg-[#a3e635] text-black'
                          : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                        {plan.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {plan.subtitle}
                      </p>
                    </div>

                    <div className="py-2 border-y border-slate-200/80 dark:border-slate-800 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                    </div>

                    <ul className="space-y-2.5 pt-1">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 space-y-3 text-center">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleEnrollNow(plan.id)}
                      className={`w-full py-3.5 px-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-200 ${plan.btnStyle} disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ob-pixel-heading font-normal`}
                    >
                      {loading && isSelected ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>PROCESSING...</span>
                        </>
                      ) : (
                        <span>ENROLL NOW</span>
                      )}
                    </button>

                    {plan.refundNotice && (
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
                        {plan.refundNotice}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
