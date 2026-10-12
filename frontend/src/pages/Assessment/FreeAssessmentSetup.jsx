import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { programLearningAPI } from '../../services/programLearningApi';

export default function FreeAssessmentSetup() {
  const { isDark } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const ROLE_OPTIONS = ['Software Developer', 'Java Developer', 'Full Stack Developer', 'Python Developer', 'Data Analyst', 'QA / Test Engineer', 'Other'];
  const COMPANY_OPTIONS = ['TCS', 'Infosys', 'Accenture', 'Wipro', 'Cognizant', 'Capgemini', 'Amazon', 'Deloitte', 'Other'];
  const PLACEMENT_OPTIONS = ['On-Campus', 'Off-Campus', 'Both'];

  const stateCompanies = [].concat(location.state?.targetCompanies || location.state?.targetCompany || []).filter(Boolean);
  const initialRole = location.state?.targetRole || user?.targetRole || '';
  const initialCompanies = stateCompanies.length > 0 ? stateCompanies : (user?.targetCompanies || []).filter(Boolean);
  const rawPlacement = location.state?.placementType || location.state?.placementCategory || user?.placementCategory || '';
  const initialPlacementType = PLACEMENT_OPTIONS.find((o) => o.toLowerCase() === String(rawPlacement).toLowerCase()) || '';

  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS.includes(initialRole) || !initialRole ? initialRole : 'Other');
  const [customRole, setCustomRole] = useState(ROLE_OPTIONS.includes(initialRole) ? '' : initialRole);
  const [selectedCompanies, setSelectedCompanies] = useState(initialCompanies);
  const [customCompany, setCustomCompany] = useState('');
  const [placementType, setPlacementType] = useState(initialPlacementType);
  const [confirmed, setConfirmed] = useState(Boolean(initialRole && initialCompanies.length > 0 && initialPlacementType));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pick up saved profile values once the user loads (without overriding choices already made)
  useEffect(() => {
    const savedRole = location.state?.targetRole || user?.targetRole || '';
    if (!selectedRole && savedRole) {
      if (ROLE_OPTIONS.includes(savedRole)) setSelectedRole(savedRole);
      else { setSelectedRole('Other'); setCustomRole(savedRole); }
    }
    const savedCompanies = stateCompanies.length > 0 ? stateCompanies : (user?.targetCompanies || []).filter(Boolean);
    if (selectedCompanies.length === 0 && savedCompanies.length > 0) setSelectedCompanies(savedCompanies);
    if (!placementType && initialPlacementType) setPlacementType(initialPlacementType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const finalRole = selectedRole === 'Other' ? customRole.trim() : selectedRole;
  const finalCompanies = selectedCompanies
    .map((c) => (c === 'Other' ? customCompany.trim() : c))
    .filter(Boolean);
  const finalCompany = finalCompanies.join(', ');

  const toggleCompany = (item) => {
    setError('');
    setSelectedCompanies((prev) => (prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]));
  };

  const handleConfirmDetails = () => {
    if (!finalRole) return setError('Please choose your target role.');
    if (finalCompanies.length === 0) return setError('Please choose at least one target company.');
    if (!placementType) return setError('Please choose your placement type.');
    setError('');
    setConfirmed(true);
  };

  const handleStartInterview = async () => {
    if (!finalRole || finalCompanies.length === 0) {
      setError('Please ensure your role and company are selected.');
      return;
    }

    const payload = {
      targetRole: finalRole,
      targetCompany: finalCompanies,
      placementCategory: placementType,
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
        navigate(`/free-assessment/${response.programId}`, {
          state: {
            assignmentId: response.assignmentId,
            targetRole: finalRole,
            targetCompany: finalCompany,
            targetCompanies: finalCompanies,
            placementType,
          },
        });
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
      <div className="flex min-h-screen items-center justify-center bg-[#c0e9ff] text-sm text-[#050a5b] dark:bg-[#080d25] dark:text-[#f5f7ff]">
        Preparing your assessment...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#daf0fa] via-[#bceaff] to-[#bceaff] px-4 py-6 font-sans text-slate-900 dark:from-[#020b23] dark:via-[#001233] dark:to-[#0a1128] dark:text-slate-100">
        <main className="dashboard-surface w-full max-w-lg p-6 text-center sm:p-10">
          <span className="font-['Press_Start_2P'] text-[8.5px] uppercase tracking-wider text-blue-600 dark:text-[#8fd9ff]">FREE ASSESSMENT</span>
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
    <div className={`tl-pre-assessment-root ${isDark ? 'dark-mode' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Press+Start+2P&display=swap');

        .tl-pre-assessment-root {
          --bg: #c0e9ff;
          --text: #050a5b;
          --muted: #68718b;
          --lime: #8dd035;
          --lime-hover: #a2d354;
          --card: #ffffffba;
          --border: rgba(5, 10, 91, .14);
          --soft-bg: rgba(255, 255, 255, .45);

          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: "Inter", sans-serif;
          transition: background .25s ease, color .25s ease;
          position: relative;
          box-sizing: border-box;
        }

        .tl-pre-assessment-root.dark-mode {
          --bg: #080d25;
          --text: #f5f7ff;
          --muted: #9da7c2;
          --lime: #8dd23f;
          --lime-hover: #afe56b;
          --card: #091233;
          --border: rgba(255, 255, 255, .14);
          --soft-bg: rgba(255, 255, 255, .035);
        }

        .tl-pre-assessment-root .setup-card { background: var(--card); border: 1px solid var(--border); border-radius: 22px; padding: 28px; max-width: 760px; margin-top: 22px; }
        .tl-pre-assessment-root .setup-group { margin-bottom: 26px; }
        .tl-pre-assessment-root .setup-label { font-weight: 700; font-size: 15px; margin-bottom: 12px; }
        .tl-pre-assessment-root .setup-label span { font-weight: 500; color: var(--muted); font-size: 13px; }
        .tl-pre-assessment-root .setup-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .tl-pre-assessment-root .setup-chip { border: 1px solid var(--border); background: var(--soft-bg); color: var(--text); padding: 10px 16px; border-radius: 999px; font-size: 14px; font-weight: 600; }
        .tl-pre-assessment-root .setup-chip.selected { background: var(--lime); border-color: var(--lime); color: #04103d; }
        .tl-pre-assessment-root .setup-input { margin-top: 12px; width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--soft-bg); color: var(--text); font-size: 14px; }
        .tl-pre-assessment-root .edit-details { margin-top: 8px; background: none; border: none; color: var(--muted); text-decoration: underline; font-size: 12px; }

        .tl-pre-assessment-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .tl-pre-assessment-root button {
          font-family: inherit;
          cursor: pointer;
        }

        /* =========================
           PAGE
        ========================= */
        .tl-pre-assessment-root .page {
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
          padding: 48px 28px 40px;
        }

        /* =========================
           EYEBROW
        ========================= */
        .tl-pre-assessment-root .eyebrow {
          font-family: "Press Start 2P", cursive;
          font-size: 8px;
          line-height: 1.7;
          color: var(--muted);
          margin-left: 2px;
          margin-bottom: 6px;
        }

        /* =========================
           PAGE INTRO (UNCHANGED SIZING)
        ========================= */
        .tl-pre-assessment-root .page-title {
          color: var(--text);
          font-family: "Inter", sans-serif;
          font-size: 32px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin-bottom: 28px;
        }

        /* =========================
           TWO COLUMN
        ========================= */
        .tl-pre-assessment-root .content-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 22px;
          align-items: stretch;
        }

        /* =========================
           LEFT CARD
        ========================= */
        .tl-pre-assessment-root .instructions-card {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 14px 35px rgba(5, 10, 91, .045);
          transition: background .25s ease, border-color .25s ease;
          display: flex;
          flex-direction: column;
        }

        .tl-pre-assessment-root.dark-mode .instructions-card {
          box-shadow: 0 18px 40px rgba(0, 0, 0, .16);
        }

        /* =========================
           INSTRUCTIONS HEADER
        ========================= */
        .tl-pre-assessment-root .instructions-header {
          padding: 18px 24px 16px;
        }

        .tl-pre-assessment-root .instructions-header .eyebrow {
          color: var(--lime);
          font-size: 8px;
          margin-bottom: 8px;
          letter-spacing: .8px;
        }

        .tl-pre-assessment-root .instructions-title {
          color: var(--text);
          font-family: "Inter", sans-serif;
          font-size: 21px;
          line-height: 1.3;
          font-weight: 700;
          letter-spacing: -.4px;
        }

        /* =========================
           INSTRUCTION ROW
        ========================= */
        .tl-pre-assessment-root .instruction-row {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 12px;
          padding: 14px 24px;
          border-top: 1px solid var(--border);
          align-items: center;
        }

        .tl-pre-assessment-root .instruction-number {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--lime);
          font-family: "Press Start 2P", cursive;
          font-size: 7px;
        }

        .tl-pre-assessment-root .instruction-content h3 {
          color: var(--text);
          font-family: "Inter", sans-serif;
          font-size: 12px;
          line-height: 1.4;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .tl-pre-assessment-root .instruction-content p {
          color: var(--muted);
          font-family: "Inter", sans-serif;
          font-size: 11px;
          line-height: 1.5;
          max-width: 650px;
        }

        .tl-pre-assessment-root .instruction-content strong {
          color: var(--text);
          font-weight: 600;
        }

        /* =========================
           RIGHT CARD
        ========================= */
        .tl-pre-assessment-root .summary-wrapper {
          position: sticky;
          top: 22px;
          height: 100%;
        }

        .tl-pre-assessment-root .summary-card {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(5, 10, 91, .07);
          transition: background .25s ease, border-color .25s ease;
          display: flex;
          flex-direction: column;
        }

        .tl-pre-assessment-root.dark-mode .summary-card {
          box-shadow: 0 18px 45px rgba(0, 0, 0, .20);
        }

        /* =========================
           SUMMARY HEADER
        ========================= */
        .tl-pre-assessment-root .summary-top {
          padding: 18px 21px 16px;
          border-bottom: 1px solid var(--border);
        }

        .tl-pre-assessment-root .summary-eyebrow {
          font-family: "Press Start 2P", cursive;
          font-size: 6px;
          line-height: 1.8;
          color: var(--lime);
          margin-bottom: 8px;
        }

        .tl-pre-assessment-root .summary-title {
          color: var(--text);
          font-family: "Inter", sans-serif;
          font-size: 19px;
          line-height: 1.3;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        /* =========================
           DETAILS
        ========================= */
        .tl-pre-assessment-root .details {
          padding: 3px 21px;
        }

        .tl-pre-assessment-root .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 11px 0;
          border-bottom: 1px solid var(--border);
        }

        .tl-pre-assessment-root .detail-row:last-child {
          border-bottom: none;
        }

        .tl-pre-assessment-root .detail-label {
          color: var(--muted);
          font-family: "Inter", sans-serif;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .45px;
        }

        .tl-pre-assessment-root .detail-value {
          color: var(--text);
          font-family: "Inter", sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-align: right;
          line-height: 1.45;
          max-width: 60%;
        }

        .tl-pre-assessment-root .detail-value.highlight {
          color: var(--lime);
        }

        /* =========================
           ASSESSMENT INCLUDED
        ========================= */
        .tl-pre-assessment-root .summary-rounds {
          margin: 6px 21px 14px;
          padding: 12px 14px;
          background: var(--soft-bg);
          border: 1px solid var(--border);
          border-radius: 9px;
        }

        .tl-pre-assessment-root .summary-rounds-title {
          color: var(--muted);
          font-family: "Inter", sans-serif;
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 10px;
        }

        .tl-pre-assessment-root .summary-round {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text);
          font-family: "Inter", sans-serif;
          font-size: 10px;
          margin-bottom: 7px;
        }

        .tl-pre-assessment-root .summary-round:last-child {
          margin-bottom: 0;
        }

        .tl-pre-assessment-root .summary-round-dot {
          width: 5px;
          height: 5px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--lime);
        }

        /* =========================
           CTA
        ========================= */
        .tl-pre-assessment-root .cta-area {
          padding: 0 21px 18px;
          margin-top: auto;
        }

        .tl-pre-assessment-root .start-button {
          width: 100%;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 0;
          border-radius: 8px;
          background: var(--lime);
          color: #07101b;
          font-family: "Press Start 2P", cursive;
          font-size: 8px;
          line-height: 1.6;
          letter-spacing: 0;
          cursor: pointer;
          transition: .18s ease;
          box-shadow: 0 7px 18px rgba(140, 191, 74, .15);
        }

        .tl-pre-assessment-root .start-button:hover:not(:disabled) {
          background: var(--lime-hover);
          transform: translateY(-1px);
          box-shadow: 0 9px 22px rgba(140, 191, 74, .20);
        }

        .tl-pre-assessment-root .start-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .tl-pre-assessment-root .start-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .tl-pre-assessment-root .start-note {
          color: var(--muted);
          font-family: "Inter", sans-serif;
          font-size: 8px;
          line-height: 1.4;
          text-align: center;
          margin-top: 7px;
        }

        .tl-pre-assessment-root .error-banner {
          margin-bottom: 16px;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(220, 38, 38, 0.12);
          border: 1px solid rgba(220, 38, 38, 0.25);
          color: #ef4444;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
        }

        /* =========================
           TABLET
        ========================= */
        @media (max-width: 900px) {
          .tl-pre-assessment-root .page {
            max-width: 760px;
          }

          .tl-pre-assessment-root .content-layout {
            grid-template-columns: 1fr;
          }

          .tl-pre-assessment-root .summary-wrapper {
            position: static;
            height: auto;
            order: -1;
          }

          .tl-pre-assessment-root .summary-card {
            height: auto;
          }

          .tl-pre-assessment-root .instructions-card {
            height: auto;
          }
        }

        /* =========================
           MOBILE
        ========================= */
        @media (max-width: 600px) {
          .tl-pre-assessment-root .page {
            padding: 38px 16px 50px;
          }

          .tl-pre-assessment-root .page-title {
            font-size: 27px;
            letter-spacing: -1.2px;
            margin-bottom: 25px;
          }

          .tl-pre-assessment-root .instructions-header {
            padding: 20px;
          }

          .tl-pre-assessment-root .instruction-row {
            grid-template-columns: 29px 1fr;
            gap: 10px;
            padding: 16px 20px;
          }

          .tl-pre-assessment-root .instruction-number {
            width: 25px;
            height: 25px;
            font-size: 6px;
          }

          .tl-pre-assessment-root .instruction-content h3 {
            font-size: 11px;
          }

          .tl-pre-assessment-root .instruction-content p {
            font-size: 10px;
            line-height: 1.55;
          }

          .tl-pre-assessment-root .summary-top {
            padding: 20px;
          }

          .tl-pre-assessment-root .details {
            padding-left: 20px;
            padding-right: 20px;
          }

          .tl-pre-assessment-root .summary-rounds {
            margin-left: 20px;
            margin-right: 20px;
          }

          .tl-pre-assessment-root .cta-area {
            padding-left: 20px;
            padding-right: 20px;
          }
        }

        /* =========================
           SMALL MOBILE
        ========================= */
        @media (max-width: 420px) {
          .tl-pre-assessment-root .page {
            padding-left: 13px;
            padding-right: 13px;
          }

          .tl-pre-assessment-root .page-title {
            font-size: 24px;
          }

          .tl-pre-assessment-root .summary-top {
            padding: 18px;
          }

          .tl-pre-assessment-root .details {
            padding-left: 18px;
            padding-right: 18px;
          }

          .tl-pre-assessment-root .summary-rounds {
            margin-left: 18px;
            margin-right: 18px;
          }

          .tl-pre-assessment-root .cta-area {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>

      {/* =========================
           MAIN
      ========================= */}
      <main className="page">
        {/* =========================
             INTRO
        ========================= */}
        <div className="eyebrow">
          ASSESSMENT OVERVIEW
        </div>

        <h1 className="page-title">
          {confirmed ? (<><i style={{ fontStyle: "italic", marginRight: "0.28em" }}>Your</i> interview is ready.</>) : (<><i style={{ fontStyle: "italic", marginRight: "0.28em" }}>Tell us</i> about your target.</>)}
        </h1>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* =========================
             CONTENT
        ========================= */}
        {!confirmed ? (
          <section className="setup-card">
            <div className="setup-group">
              <div className="setup-label">1. What role are you preparing for?</div>
              <div className="setup-chips">
                {ROLE_OPTIONS.map((item) => (
                  <button key={item} type="button" className={`setup-chip ${selectedRole === item ? 'selected' : ''}`}
                    onClick={() => { setError(''); setSelectedRole(item); }}>{item}</button>
                ))}
              </div>
              {selectedRole === 'Other' && (
                <input className="setup-input" placeholder="Enter your target role" value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
              )}
            </div>

            <div className="setup-group">
              <div className="setup-label">2. Which companies are you targeting? <span>(select all that apply)</span></div>
              <div className="setup-chips">
                {[...new Set([...COMPANY_OPTIONS.filter((c) => c !== 'Other'), ...selectedCompanies.filter((c) => !COMPANY_OPTIONS.includes(c)), 'Other'])].map((item) => (
                  <button key={item} type="button" className={`setup-chip ${selectedCompanies.includes(item) ? 'selected' : ''}`}
                    onClick={() => toggleCompany(item)}>{item}</button>
                ))}
              </div>
              {selectedCompanies.includes('Other') && (
                <input className="setup-input" placeholder="Enter company name" value={customCompany} onChange={(e) => setCustomCompany(e.target.value)} />
              )}
            </div>

            <div className="setup-group">
              <div className="setup-label">3. What type of placement are you aiming for?</div>
              <div className="setup-chips">
                {PLACEMENT_OPTIONS.map((item) => (
                  <button key={item} type="button" className={`setup-chip ${placementType === item ? 'selected' : ''}`}
                    onClick={() => { setError(''); setPlacementType(item); }}>{item}</button>
                ))}
              </div>
            </div>

            <button type="button" className="start-button" onClick={handleConfirmDetails}>CONTINUE →</button>
          </section>
        ) : (
        <div className="content-layout">
          {/* =========================
               LEFT — INSTRUCTIONS
          ========================= */}
          <section>
            <div className="instructions-card">
              <div className="instructions-header">
                <div className="eyebrow">
                  BEFORE YOU BEGIN
                </div>

                <h2 className="instructions-title">
                  Instructions
                </h2>
              </div>

              {/* 01 */}
              <div className="instruction-row">
                <div className="instruction-number">
                  01
                </div>

                <div className="instruction-content">
                  <h3>
                    Your Mock Interview
                  </h3>

                  <p>
                    This mock interview is based on the{' '}
                    <strong>company and role you selected</strong>,
                    with relevant patterns and topics to help you
                    understand what is commonly asked for your target.
                  </p>
                </div>
              </div>

              {/* 02 */}
              <div className="instruction-row">
                <div className="instruction-number">
                  02
                </div>

                <div className="instruction-content">
                  <h3>
                    Give It Your Best
                  </h3>

                  <p>
                    Questions may range from easy to challenging.{' '}
                    <strong>
                      Answer what you know or can attempt,
                      and don't worry about getting everything right.
                    </strong>
                  </p>
                </div>
              </div>

              {/* 03 */}
              <div className="instruction-row">
                <div className="instruction-number">
                  03
                </div>

                <div className="instruction-content">
                  <h3>
                    Keep It Honest
                  </h3>

                  <p>
                    Please complete the assessment on your own
                    without Google, ChatGPT, notes, or other external
                    help. <strong>This helps us understand where you can improve.</strong>
                  </p>
                </div>
              </div>

              {/* 04 */}
              <div className="instruction-row">
                <div className="instruction-number">
                  04
                </div>

                <div className="instruction-content">
                  <h3>
                    Stay on the Page
                  </h3>

                  <p>
                    You have <strong>30 minutes</strong> to complete
                    the assessment. Please stay on the assessment
                    page while you work through the questions.
                  </p>
                </div>
              </div>

              {/* 05 */}
              <div className="instruction-row">
                <div className="instruction-number">
                  05
                </div>

                <div className="instruction-content">
                  <h3>
                    Learn From Your Results
                  </h3>

                  <p>
                    A wrong answer doesn't mean you're bad at
                    programming. <strong>Your results help us understand
                    what to practice and recommend the right learning
                    path for you.</strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =========================
               RIGHT — USER DETAILS
          ========================= */}
          <aside className="summary-wrapper">
            <div className="summary-card">
              {/* HEADER */}
              <div className="summary-top">
                <div className="summary-eyebrow">
                  YOUR DETAILS
                </div>

                <h2 className="summary-title">
                  Interview Details
                </h2>
                <button type="button" className="edit-details" onClick={() => setConfirmed(false)}>Edit details</button>
              </div>

              {/* DETAILS */}
              <div className="details">
                <div className="detail-row">
                  <div className="detail-label">
                    Target Role
                  </div>

                  <div className="detail-value" id="targetRole">
                    {finalRole}
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-label">
                    Company Pattern
                  </div>

                  <div className="detail-value" id="targetCompany">
                    {finalCompany}
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-label">
                    Placement Type
                  </div>

                  <div className="detail-value" id="placementType">
                    {placementType}
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-label">
                    Duration
                  </div>

                  <div className="detail-value highlight">
                    30 Minutes
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-label">
                    Mode
                  </div>

                  <div className="detail-value">
                    Online Assessment
                  </div>
                </div>
              </div>

              {/* =========================
                   ASSESSMENT INCLUDED
              ========================= */}
              <div className="summary-rounds">
                <div className="summary-rounds-title">
                  Assessment Includes
                </div>

                <div className="summary-round">
                  <span className="summary-round-dot"></span>
                  Technical &amp; MCQ Round
                </div>

                <div className="summary-round">
                  <span className="summary-round-dot"></span>
                  Coding &amp; Problem Solving
                </div>

                <div className="summary-round">
                  <span className="summary-round-dot"></span>
                  Evaluation &amp; Feedback
                </div>
              </div>

              {/* =========================
                   CTA
              ========================= */}
              <div className="cta-area">
                <button
                  className="start-button"
                  id="startButton"
                  type="button"
                  onClick={handleStartInterview}
                  disabled={loading}
                >
                  {loading ? 'PREPARING INTERVIEW...' : '▶ START INTERVIEW'}
                </button>

                <p className="start-note">
                  Your 30-minute timer starts immediately.
                </p>
              </div>
            </div>
          </aside>
        </div>
        )}
      </main>
    </div>
  );
}
