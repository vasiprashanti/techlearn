import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Target, ArrowDown, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import API from '../../api/client';

export default function OnboardingPrograms() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state || {};

  const { user: authUser } = useAuth();
  const { user: contextUser, refetchUserData } = useUser();

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSelectPlan = async (planId) => {
    setSelectedPlanId(planId);
    setLoading(true);

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

      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating program tier:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const placementPlans = [
    {
      id: 'placement_free_trial',
      title: 'Free Trial',
      price: '₹0',
      subtitle: '5 Days Free Access',
      badge: 'EXPLORE PLATFORM',
      highlight: false,
      icon: Sparkles,
      color: 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0e1a30]/80 shadow-md',
      btnStyle: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700',
      features: [
        '5 days free access',
        'Limited access to placement experience',
        'Preview learning roadmap & curriculum',
        'Explore daily learning platform content',
        `Personalized for ${targetRole}`
      ],
    },
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
    }
  ];

  const skillPlans = [
    {
      id: 'skill_free',
      title: 'Free',
      price: '₹0',
      subtitle: 'Basic Skill Learning',
      badge: 'STARTER',
      highlight: false,
      icon: Sparkles,
      color: 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0e1a30]/80 shadow-md',
      btnStyle: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700',
      features: [
        `Access to selected ${displaySkills} course(s)`,
        'Day-wise learning materials',
        'Notes released progressively',
        'Practice questions available directly on dashboard',
        'No tasks or challenges'
      ],
    },
    {
      id: 'skill_program',
      title: 'Skill Program',
      price: '₹499',
      subtitle: 'Full 30-Day Program',
      badge: 'RECOMMENDED',
      highlight: true,
      icon: Sparkles,
      color: 'border-[#a3e635] bg-[#f7fee7]/60 dark:bg-[#1a2e05]/40 shadow-xl shadow-[#a3e635]/15 ring-2 ring-[#a3e635]',
      btnStyle: 'bg-[#a3e635] text-black font-extrabold hover:bg-[#86efac] shadow-lg shadow-[#a3e635]/25',
      features: [
        `Full 30-Day ${displaySkills} Program`,
        'Complete learning roadmap',
        'Day-wise notes & course content',
        'Comprehensive practice questions',
        'Daily tasks & coding challenges',
        'Structured progression through program'
      ],
    },
    {
      id: 'skill_membership',
      title: 'Membership',
      price: '₹199',
      billing: '/month',
      subtitle: 'Recurring Access',
      badge: 'ADDITIONAL SKILLS',
      highlight: false,
      icon: Sparkles,
      color: 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 shadow-xl shadow-purple-500/10',
      btnStyle: 'bg-purple-600 text-white font-extrabold hover:bg-purple-700 shadow-lg shadow-purple-500/25',
      features: [
        'Available after purchasing a ₹499 Skill Program',
        `Access multiple skill programs (${displaySkills}, and more)`,
        'Monthly recurring subscription',
        'Full access to tasks, challenges & notes',
        'Continuous skill expansion'
      ],
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d1a] text-[#0f172a] dark:text-[#f1f5f9] font-sans selection:bg-[#3c83f6]/20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .ob-pixel-heading {
          font-family: 'Press Start 2P', cursive !important;
        }
      `}</style>

      {/* VIEWPORT 1: HERO SECTION */}
      <section className="relative isolate overflow-hidden min-h-[calc(100vh-64px)] flex flex-col justify-center items-center">
        {/* Soft background ambient gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent dark:from-blue-600/15"
        />

        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center sm:py-24">
          
          {/* Target Role / Selected Skill Tag Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-white dark:bg-[#0e1a30] px-4 py-2 text-sm shadow-sm"
          >
            <Target className="h-4 w-4 text-[#3c83f6]" aria-hidden />
            <span className="text-slate-500 dark:text-slate-400">
              {isPlacement ? 'Target Role:' : 'Selected Skill(s):'}
            </span>
            <span className="font-semibold text-[#3c83f6] dark:text-[#60a5fa]">
              {isPlacement ? targetRole : displaySkills}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="ob-pixel-heading mt-8 text-[clamp(1.15rem,4.2vw,2.2rem)] leading-[1.6] bg-gradient-to-r from-[#53b6ff] via-[#45a2ff] to-[#3c83f6] bg-clip-text text-transparent uppercase tracking-wider"
          >
            {isPlacement ? 'PLACEMENT PROGRAM TIERS' : 'SKILL PROGRAM TIERS'}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg"
          >
            Based on your onboarding preferences, we matched you with the following learning
            programs. Choose a program to start your journey.
          </motion.p>

          {/* Personalization Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex w-full max-w-xl items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1a30] p-5 text-left shadow-md backdrop-blur-sm"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
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

          {/* Check Pricing Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10"
          >
            <button
              type="button"
              onClick={handleCheckPricing}
              className="group inline-flex h-12 items-center justify-center rounded-full bg-[#3c83f6] hover:bg-blue-600 text-white px-8 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <span>Check Pricing</span>
              <ArrowDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-1" />
            </button>
          </motion.div>

        </div>
      </section>


      {/* VIEWPORT 2: PRICING PLANS SECTION */}
      <section id="pricing" className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-slate-50/50 dark:bg-[#081224]/50 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto w-full space-y-6">
          
          <div className="text-center space-y-1.5">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#3c83f6]">
              Flexible Options
            </span>
            <h2 className="ob-pixel-heading text-base sm:text-lg uppercase tracking-wider text-slate-900 dark:text-white">
              Choose Your Access Pass
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Select the plan duration that fits your schedule. Upgrades and extensions are always available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 border transition-all duration-300 ${plan.color}`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 right-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm ${
                        plan.highlight
                          ? 'bg-[#a3e635] text-black'
                          : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      }`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {plan.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {plan.subtitle}
                      </p>
                    </div>

                    <div className="py-1.5 border-y border-slate-200/80 dark:border-slate-800 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.billing && (
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {plan.billing}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2 pt-1">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-200 ${plan.btnStyle} disabled:opacity-50`}
                    >
                      {loading && isSelected ? 'Processing...' : isSelected ? 'Current Plan' : 'Select Plan'}
                    </button>
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
