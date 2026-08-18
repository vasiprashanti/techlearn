import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Crown, RefreshCw } from 'lucide-react';
import API from '../../api/client';
import { initiateRazorpayPayment } from '../../utils/razorpayCheckout';

export default function PricingCards({ goal, selectedSkill, onSelectPlan, currentPlan, isBusy, user }) {
  const isPlacement = goal === 'Get Placed' || !goal;
  const [isSkillReturningUser, setIsSkillReturningUser] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState('');

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

  const handleEnroll = async (planId) => {
    if (isBusy || loadingPlanId) return;
    setLoadingPlanId(planId);

    initiateRazorpayPayment({
      planId,
      programId: user?.programId || null,
      user,
      onSuccess: async (resData) => {
        setLoadingPlanId('');
        if (onSelectPlan) {
          await onSelectPlan(planId, resData);
        } else {
          window.location.href = '/dashboard';
        }
      },
      onFailure: (err) => {
        setLoadingPlanId('');
        alert(err.message || 'Payment failed. Please try again.');
      },
      onCancel: () => {
        setLoadingPlanId('');
      },
    });
  };

  // Placement Learners Cards (Only ₹799 and ₹999)
  const placementPlans = [
    {
      id: 'placement_season_pass',
      title: 'Placement Season Pass',
      price: '₹799',
      subtitle: '90 Days Total Access',
      badge: 'MOST POPULAR',
      highlight: true,
      icon: Zap,
      color: 'border-[#a3e635] bg-[#f7fee7]/40 dark:bg-[#1a2e05]/30 shadow-xl shadow-[#a3e635]/15 ring-2 ring-[#a3e635]',
      btnStyle: 'bg-[#a3e635] text-black font-extrabold hover:bg-[#86efac]',
      features: [
        '30-Day Structured Placement Program',
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
      icon: Crown,
      color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg',
      btnStyle: 'bg-blue-600 text-white font-extrabold hover:bg-blue-700',
      features: [
        '30-Day Structured Placement Program',
        '90 additional days of platform access (120 days total)',
        'Same core 30-day program + extended practice',
        'Daily learning, tasks & challenges',
        'Company-wise preparation & assessments',
        'Longer period to prepare post-program'
      ],
      refundNotice: 'Cancel anytime. Get refunded if you cancel within 5 days.',
    }
  ];

  // Skill Learners Cards
  const skillPlans = [
    {
      id: isSkillReturningUser ? 'skill_membership' : 'skill_program',
      title: isSkillReturningUser ? 'Returning Paid User' : 'First-Time Paid User',
      price: isSkillReturningUser ? '₹199' : '₹499',
      subtitle: '30 Days Access',
      badge: isSkillReturningUser ? 'RETURNING OFFER' : '30-DAY ACCESS',
      highlight: true,
      icon: Sparkles,
      color: 'border-[#a3e635] bg-[#f7fee7]/40 dark:bg-[#1a2e05]/30 shadow-xl shadow-[#a3e635]/15 ring-2 ring-[#a3e635]',
      btnStyle: 'bg-[#a3e635] text-black font-extrabold hover:bg-[#86efac]',
      features: [
        `Full 30-Day ${selectedSkill || 'Skill'} Program`,
        'Complete learning roadmap & course content',
        'Daily tasks & coding challenges',
        'Practice questions & notes',
        isSkillReturningUser ? 'Discounted returning learner price (₹199)' : 'First-time paid learner access (₹499)',
      ],
      refundNotice: null,
    }
  ];

  const plans = isPlacement ? placementPlans : skillPlans;

  return (
    <div className="w-full space-y-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .ob-pixel-heading {
          font-family: 'Press Start 2P', cursive !important;
        }
      `}</style>
      <div className={`grid grid-cols-1 ${plans.length > 1 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'max-w-md mx-auto'} gap-6`}>
        {plans.map((plan) => {
          const isSelected = currentPlan === plan.id;
          const isLoading = loadingPlanId === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 border transition-all duration-300 ${plan.color}`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 right-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${
                    plan.highlight
                      ? 'bg-[#a3e635] text-black'
                      : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  }`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {plan.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {plan.subtitle}
                    </p>
                  </div>
                </div>

                <div className="py-2 border-y border-slate-100 dark:border-slate-800/80 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                </div>

                <ul className="space-y-2 pt-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-2 text-center">
                <button
                  type="button"
                  disabled={isBusy || !!loadingPlanId}
                  onClick={() => handleEnroll(plan.id)}
                  className={`w-full py-3 px-4 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all shadow-md ${plan.btnStyle} disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 ob-pixel-heading font-normal`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>PROCESSING...</span>
                    </>
                  ) : isSelected ? (
                    <span>CURRENT PLAN</span>
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
  );
}
