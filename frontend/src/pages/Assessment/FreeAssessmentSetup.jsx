import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { programLearningAPI } from '../../services/programLearningApi';

const POPULAR_ROLES = [
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Software Engineer',
  'Data Analyst',
  'Cloud / DevOps Engineer',
];

const POPULAR_COMPANIES = [
  'TCS',
  'Infosys',
  'Wipro',
  'Accenture',
  'Cognizant',
  'Amazon',
  'Google',
  'Microsoft',
  'Product Startup',
];

const INTERVIEW_RULES = [
  'The assessment is strictly timed for 30 minutes. The timer cannot be paused.',
  'Multiple Choice Questions (MCQs) save your responses automatically as you submit.',
  'Coding questions provide a live in-browser compiler with custom test cases.',
  'Switching tabs or minimizing the interview window may invalidate your attempt.',
  'The assessment will automatically submit when the 30-minute timer ends.',
  'A placement readiness evaluation report is generated immediately upon completion.',
];

export default function FreeAssessmentSetup() {
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Step 1: 'role-company', Step 2: 'rules'
  const [step, setStep] = useState('role-company');
  const [selectedRole, setSelectedRole] = useState(
    location.state?.targetRole || user?.targetRole || ''
  );
  const [customRole, setCustomRole] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(
    location.state?.targetCompany || user?.targetCompanies?.[0] || ''
  );
  const [customCompany, setCustomCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalRole = customRole.trim() || selectedRole;
  const finalCompany = customCompany.trim() || selectedCompany;

  const handleContinueToRules = (e) => {
    e.preventDefault();
    if (!finalRole) {
      setError('Please select or enter your target role.');
      return;
    }
    if (!finalCompany) {
      setError('Please select or enter your target company.');
      return;
    }
    setError('');
    setStep('rules');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartInterview = async () => {
    if (!finalRole || !finalCompany) {
      setError('Please ensure your role and company are selected.');
      return;
    }

    const payload = {
      targetRole: finalRole,
      targetCompany: finalCompany,
      programId: location.state?.programId || null,
    };

    if (!user) {
      sessionStorage.setItem('pending_assessment', JSON.stringify({
        intent: 'assessment',
        programId: payload.programId,
        requiresSetup: true,
      }));
      navigate('/signup/contextual?intent=assessment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await programLearningAPI.startFreeAssessment(payload);
      if (response?.success && response?.programId) {
        navigate(`/free-assessment/${response.programId}`);
      } else {
        throw new Error(response?.message || 'Could not generate interview assessment.');
      }
    } catch (err) {
      console.error('Error starting Free Assessment:', err);
      setError(err.message || 'Failed to start Free Assessment. Please try again.');
      setLoading(false);
    }
  };

  const handleGuestContinue = (destination) => {
    sessionStorage.setItem('pending_assessment', JSON.stringify({
      intent: 'assessment',
      programId: location.state?.programId || null,
      requiresSetup: true,
    }));
    navigate(destination);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#daf0fa] text-sm text-[#00113b] dark:bg-[#04083d] dark:text-white">
        Preparing your assessment...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] px-4 py-6 font-sans text-slate-900 dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:text-slate-100">
        <main className="dashboard-surface w-full max-w-lg p-6 text-center sm:p-10">
          <span className="press-start-font text-[8.5px] uppercase tracking-wider text-blue-600 dark:text-[#8fd9ff]">FREE ASSESSMENT</span>
          <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">Create your account first</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            Sign up or log in, then choose your target role and company before starting the diagnostic.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={() => handleGuestContinue('/login')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-5 py-3 text-sm font-bold dark:border-white/10">
              Log in
            </button>
            <button type="button" onClick={() => handleGuestContinue('/signup/contextual?intent=assessment')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3c83f6] px-5 py-3 text-sm font-bold text-white">
              Create account <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] px-3 sm:px-6 py-6 font-sans text-slate-900 dark:text-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .press-start-font {
          font-family: 'Press Start 2P', cursive !important;
        }
      `}</style>

      {/* Top Header Bar */}
      <header className="absolute left-4 top-4 md:left-6 md:top-6 z-20 flex items-center gap-3 select-none">
        <img
          src={theme === 'dark' ? '/logoo2-small.webp' : '/logoo-small.webp'}
          alt="TLS"
          className="h-8 md:h-10 w-auto object-contain shrink-0 cursor-pointer"
          onClick={() => navigate('/')}
        />
        <span className="h-5 w-px bg-black/10 dark:bg-white/10 shrink-0" />
        <span className="press-start-font text-[8.5px] uppercase tracking-wider text-[#00113b]/70 dark:text-[#8fd9ff] md:text-xs whitespace-nowrap shrink-0">
          Interview Assessment
        </span>
      </header>

      {/* STEP 1: DEDICATED ROLE + COMPANY SELECTION (WIDE, COMPACT & CENTERED) */}
      {step === 'role-company' && (
        <div className="w-full max-w-3xl lg:max-w-4xl rounded-2xl border border-black/5 bg-white/50 p-4 sm:p-6 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] my-auto mt-14 md:mt-auto">
          {/* Header Title */}
          <div className="text-center">
            <span className="press-start-font text-[8.5px] uppercase tracking-wider text-blue-600 dark:text-[#8fd9ff]">
              STEP 1 OF 2
            </span>
            <h1 className="press-start-font text-[11px] sm:text-[13px] uppercase tracking-wider text-[#00113b] dark:text-white mt-1.5 leading-relaxed">
              Configure Your Interview
            </h1>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
              Select your target role and company pattern to personalize your 30-minute assessment.
            </p>
          </div>

          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* 2-Column Responsive Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* 1. Target Role Card */}
            <div className="rounded-xl border border-black/5 bg-white/40 p-3.5 sm:p-4 dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                    1. Target Job Role
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[140px]">
                    {finalRole || 'Select a role'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Choose the role you are preparing for:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_ROLES.map((role) => {
                    const isSelected = selectedRole === role && !customRole;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setCustomRole('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#a3e635] text-slate-950 font-bold shadow-xs ring-1 ring-[#a3e635]'
                            : 'bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/5 hover:border-blue-400'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                type="text"
                placeholder="Or custom role (e.g. iOS Developer, AI Engineer)..."
                value={customRole}
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  setSelectedRole(e.target.value);
                }}
                className="mt-2.5 w-full h-8 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 2. Target Company Card */}
            <div className="rounded-xl border border-black/5 bg-white/40 p-3.5 sm:p-4 dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                    2. Target Company Pattern
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[140px]">
                    {finalCompany || 'Select a company'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Select your target company benchmark:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_COMPANIES.map((company) => {
                    const isSelected = selectedCompany === company && !customCompany;
                    return (
                      <button
                        key={company}
                        type="button"
                        onClick={() => {
                          setSelectedCompany(company);
                          setCustomCompany('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#a3e635] text-slate-950 font-bold shadow-xs ring-1 ring-[#a3e635]'
                            : 'bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/5 hover:border-blue-400'
                        }`}
                      >
                        {company}
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                type="text"
                placeholder="Or custom company (e.g. Microsoft, Uber, Startup)..."
                value={customCompany}
                onChange={(e) => {
                  setCustomCompany(e.target.value);
                  setSelectedCompany(e.target.value);
                }}
                className="mt-2.5 w-full h-8 px-3 rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/40 text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Row - Dedicated single forward CTA, NO Cancel button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleContinueToRules}
              disabled={!finalRole || !finalCompany}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#a3e635] hover:bg-[#86efac] px-6 py-2.5 press-start-font text-[9px] font-bold text-[#0a1128] shadow-md shadow-[#a3e635]/25 transition hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>CONTINUE TO RULES</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIRMATION + RULES PAGE (WIDE, 2-COLUMN, COMPACT & CENTERED) */}
      {step === 'rules' && (
        <div className="w-full max-w-4xl lg:max-w-5xl rounded-2xl border border-black/5 bg-white/50 p-4 sm:p-5 shadow-[0_12px_34px_rgba(60,131,246,0.08)] backdrop-blur-xl dark:border-[#15366f]/45 dark:bg-gradient-to-br dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:shadow-[0_12px_34px_rgba(0,0,0,0.24)] my-auto mt-14 md:mt-auto">
          {/* Top Bar with Back Button */}
          <div className="flex items-center justify-between pb-2.5 border-b border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setStep('role-company')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Edit Configuration</span>
            </button>
            <span className="press-start-font text-[8px] uppercase tracking-wider text-blue-600 dark:text-[#8fd9ff]">
              STEP 2 OF 2
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mt-2.5">
            <h1 className="press-start-font text-[11px] sm:text-[13px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff]">
              Interview Rules & Instructions
            </h1>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
              Please review the round details and instructions before beginning your 30-minute session.
            </p>
          </div>

          {error && (
            <div className="mt-2.5 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          {/* 2-Column Main Content Body */}
          <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
            {/* Left Column: Summary Badges + Key Anti-cheat rules */}
            <div className="flex flex-col justify-between space-y-2.5">
              {/* 4-Pill Summary Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-black/5 bg-white/40 p-2 dark:border-white/5 dark:bg-black/20 text-left">
                  <span className="block press-start-font text-[6.5px] uppercase text-[#00113b]/60 dark:text-[#81bde6]">
                    Role
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-[#00113b] dark:text-white truncate">
                    {finalRole}
                  </span>
                </div>

                <div className="rounded-lg border border-black/5 bg-white/40 p-2 dark:border-white/5 dark:bg-black/20 text-left">
                  <span className="block press-start-font text-[6.5px] uppercase text-[#00113b]/60 dark:text-[#81bde6]">
                    Company
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-[#00113b] dark:text-white truncate">
                    {finalCompany}
                  </span>
                </div>

                <div className="rounded-lg border border-black/5 bg-white/40 p-2 dark:border-white/5 dark:bg-black/20 text-left">
                  <span className="block press-start-font text-[6.5px] uppercase text-[#00113b]/60 dark:text-[#81bde6]">
                    Duration
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    30 Minutes
                  </span>
                </div>

                <div className="rounded-lg border border-black/5 bg-white/40 p-2 dark:border-white/5 dark:bg-black/20 text-left">
                  <span className="block press-start-font text-[6.5px] uppercase text-[#00113b]/60 dark:text-[#81bde6]">
                    Mode
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-[#00113b] dark:text-white truncate">
                    Online Round
                  </span>
                </div>
              </div>

              {/* Key Instructions / Anti-cheat Card */}
              <div className="rounded-xl border border-black/5 bg-white/35 p-3 dark:border-white/5 dark:bg-black/20 text-left flex-1 flex flex-col justify-between">
                <h2 className="press-start-font text-[7.5px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff] mb-2">
                  Key Interview Rules
                </h2>
                <ul className="space-y-1.5 text-[11px] leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                  {INTERVIEW_RULES.map((rule, idx) => (
                    <li key={idx} className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500 dark:bg-red-400" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: MCQ, Coding & Evaluation Breakdown Cards */}
            <div className="flex flex-col justify-between space-y-2">
              {/* Technical & MCQ Round */}
              <div className="rounded-xl border border-black/5 bg-white/35 p-2.5 sm:p-3 text-left dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="press-start-font text-[7.5px] uppercase tracking-wide text-blue-600 dark:text-[#8fd9ff]">
                      1. Technical & MCQ Round
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Core Concepts</span>
                  </div>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                    <li className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Single-correct questions tailored to your chosen {finalRole} role.</span>
                    </li>
                    <li className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Instant answer validation and automatic response saving.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Coding Challenge Card */}
              <div className="rounded-xl border border-black/5 bg-white/35 p-2.5 sm:p-3 text-left dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="press-start-font text-[7.5px] uppercase tracking-wide text-blue-600 dark:text-[#8fd9ff]">
                      2. Coding & Problem Solving
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">Live Editor</span>
                  </div>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                    <li className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Write and test solutions in Monaco code editor (Java & Python).</span>
                    </li>
                    <li className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3C83F6] dark:bg-[#8fd9ff]" />
                      <span>Automated compiler run with sample and hidden test case verification.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Evaluation & AI Readiness Report */}
              <div className="rounded-xl border border-black/5 bg-white/35 p-2.5 sm:p-3 text-left dark:border-white/5 dark:bg-black/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="press-start-font text-[7.5px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                      3. Evaluation & Feedback
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Instant Report</span>
                  </div>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-[#00113b]/75 dark:text-[#cdeeff]">
                    <li className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      <span>Topic-wise accuracy score benchmarked for {finalCompany}.</span>
                    </li>
                    <li className="flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                      <span>Personalized recommendations to bridge interview readiness gaps.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Start Interview CTA Row */}
          <div className="mt-4 flex justify-center pt-1">
            <button
              type="button"
              onClick={handleStartInterview}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#a3e635] hover:bg-[#86efac] px-8 py-3 press-start-font text-[9.5px] sm:text-[10.5px] font-bold text-[#0a1128] shadow-lg shadow-[#a3e635]/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{loading ? 'PREPARING INTERVIEW...' : 'START INTERVIEW'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
