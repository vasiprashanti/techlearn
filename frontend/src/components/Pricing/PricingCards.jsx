import React from 'react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

export default function PricingCards({ goal, selectedSkill, onSelectPlan, currentPlan, isBusy }) {
  const isPlacement = goal === 'Get Placed' || !goal;

  // Placement Learners Cards
  const placementPlans = [
    {
      id: 'placement_free_trial',
      title: 'Free Trial',
      price: '₹0',
      subtitle: '5 Days Free Access',
      badge: 'EXPLORE PLATFORM',
      highlight: false,
      icon: Sparkles,
      color: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1a30]',
      btnStyle: 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900',
      features: [
        '5 days free access',
        'Limited access to placement experience',
        'Preview learning roadmap & curriculum',
        'Explore daily learning platform content',
        'Personalized for your target role'
      ],
    },
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
    }
  ];

  // Skill Learners Cards
  const skillPlans = [
    {
      id: 'skill_free',
      title: 'Free',
      price: '₹0',
      subtitle: 'Basic Skill Learning',
      badge: 'STARTER',
      highlight: false,
      icon: Sparkles,
      color: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1a30]',
      btnStyle: 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900',
      features: [
        `Access to selected ${selectedSkill || 'skill'} course`,
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
      icon: Zap,
      color: 'border-[#a3e635] bg-[#f7fee7]/40 dark:bg-[#1a2e05]/30 shadow-xl shadow-[#a3e635]/15 ring-2 ring-[#a3e635]',
      btnStyle: 'bg-[#a3e635] text-black font-extrabold hover:bg-[#86efac]',
      features: [
        `Full 30-Day ${selectedSkill || 'Skill'} Program`,
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
      icon: Crown,
      color: 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-lg',
      btnStyle: 'bg-purple-600 text-white font-extrabold hover:bg-purple-700',
      features: [
        'Available after purchasing a ₹499 Skill Program',
        'Access multiple skill programs (Java, Python, Full Stack, AI/ML)',
        'Monthly recurring subscription',
        'Full access to tasks, challenges & notes',
        'Continuous skill expansion'
      ],
    }
  ];

  const plans = isPlacement ? placementPlans : skillPlans;

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isSelected = currentPlan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 border transition-all duration-300 ${plan.color}`}
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
                  {plan.billing && (
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {plan.billing}
                    </span>
                  )}
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

              <div className="pt-6">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onSelectPlan(plan.id)}
                  className={`w-full py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all shadow-md ${plan.btnStyle} disabled:opacity-50`}
                >
                  {isBusy && isSelected ? 'Processing...' : isSelected ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


