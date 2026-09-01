import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthModalContext } from '../../context/AuthModalContext';

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

export default function FreeAssessmentModal({ isOpen, onClose, defaultProgramId = null, initialRole = null }) {
  const { user } = useAuth();
  const { openLogin } = useAuthModalContext();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(initialRole || user?.targetRole || '');
  const [customRole, setCustomRole] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(user?.targetCompanies?.[0] || '');
  const [customCompany, setCustomCompany] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
      setCustomRole('');
    }
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const finalRole = customRole.trim() || selectedRole;
  const finalCompany = customCompany.trim() || selectedCompany;

  const continueToAssessmentAuth = (mode) => {
    sessionStorage.setItem('pending_assessment', JSON.stringify({
      intent: 'assessment',
      programId: defaultProgramId,
      requiresSetup: true,
    }));
    onClose();
    if (mode === 'login') {
      openLogin();
      return;
    }
    navigate('/signup/contextual?intent=assessment');
  };

  const handleStartAssessment = () => {
    if (!finalRole) {
      setError('Please select or specify your target role.');
      return;
    }
    if (!finalCompany) {
      setError('Please select or specify your target company.');
      return;
    }

    if (!user) {
      continueToAssessmentAuth('signup');
      return;
    }

    onClose();
    navigate('/free-assessment/setup', {
      state: {
        programId: defaultProgramId,
        targetRole: finalRole,
        targetCompany: finalCompany,
      },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Press+Start+2P&display=swap');

        .fam-root * {
          box-sizing: border-box;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .fam-card {
          background: #ffffff !important;
          width: 100% !important;
          max-width: 520px !important;
          max-height: calc(100vh - 32px) !important;
          border-radius: 24px !important;
          padding: 24px !important;
          box-shadow: 0 12px 32px rgba(0,0,0,0.25) !important;
          display: flex !important;
          flex-direction: column !important;
          position: relative !important;
          overflow-y: auto !important;
          color: #111111 !important;
        }

        .fam-top-bar {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          margin-bottom: 8px !important;
        }

        .fam-close-btn {
          background: transparent !important;
          border: none !important;
          font-size: 22px !important;
          color: #8e8e93 !important;
          cursor: pointer !important;
          line-height: 1 !important;
          padding: 0 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: color 0.15s ease !important;
        }
        .fam-close-btn:hover {
          color: #1c1c1e !important;
        }

        .fam-h2 {
          font-family: 'Press Start 2P', cursive !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          line-height: 1.4 !important;
          margin-bottom: 6px !important;
          color: #000000 !important;
          text-align: center !important;
          letter-spacing: 0.8px !important;
        }

        .fam-description {
          font-size: 12px !important;
          font-weight: 400 !important;
          color: #666666 !important;
          line-height: 1.4 !important;
          margin-bottom: 14px !important;
          text-align: center !important;
        }

        .fam-followup-card {
          background: #f8f9fa !important;
          border: 1px solid #e9ecef !important;
          border-radius: 14px !important;
          padding: 12px 14px !important;
          margin-bottom: 12px !important;
        }

        .fam-followup-card h3 {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #333333 !important;
          margin-bottom: 8px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .fam-chip {
          padding: 6px 12px !important;
          border-radius: 12px !important;
          border: 1px solid #e5e5ea !important;
          font-size: 11px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          background: #ffffff !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 4px !important;
          user-select: none !important;
          color: #333333 !important;
          transition: all 0.15s ease !important;
        }
        .fam-chip:hover {
          border-color: #1c1c1e !important;
          transform: translateY(-1px) !important;
        }
        .fam-chip.selected {
          background-color: #a3e635 !important;
          border-color: #a3e635 !important;
          color: #000000 !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 6px rgba(163,230,53,0.3) !important;
        }

        .fam-input {
          width: 100% !important;
          height: 38px !important;
          padding: 0 12px !important;
          border-radius: 10px !important;
          border: 1px solid #e5e5ea !important;
          font-size: 12px !important;
          outline: none !important;
          background-color: #ffffff !important;
          color: #1c1c1e !important;
          margin-top: 8px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .fam-input:focus {
          border-color: #1c1c1e !important;
          box-shadow: 0 0 0 3px rgba(28, 28, 30, 0.08) !important;
        }
        .fam-input::placeholder {
          color: #a7a7a7 !important;
        }

        .fam-btn-row {
          display: flex !important;
          gap: 10px !important;
          width: 100% !important;
          margin-top: 6px !important;
          padding-top: 6px !important;
        }
        .fam-btn-row .fam-btn-primary,
        .fam-btn-row .fam-btn-secondary {
          flex: 1 1 0% !important;
          width: 50% !important;
        }

        .fam-btn-secondary {
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background-color: #f2f2f7 !important;
          color: #1c1c1e !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 9px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-transform: uppercase !important;
          transition: opacity 0.2s, transform 0.1s !important;
        }
        .fam-btn-secondary:hover {
          opacity: 0.9 !important;
        }

        .fam-btn-primary {
          height: 44px !important;
          border-radius: 12px !important;
          border: none !important;
          background-color: #a3e635 !important;
          color: #000000 !important;
          font-family: 'Press Start 2P', cursive !important;
          font-size: 9px !important;
          font-weight: 400 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-transform: uppercase !important;
          transition: opacity 0.2s, transform 0.1s !important;
          box-shadow: 0 2px 8px rgba(163,230,53,0.3) !important;
        }
        .fam-btn-primary:hover {
          opacity: 0.95 !important;
          transform: translateY(-1px) !important;
        }
        .fam-btn-primary:disabled,
        .fam-btn-secondary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        .fam-status-error {
          padding: 8px 12px !important;
          border-radius: 10px !important;
          font-size: 11px !important;
          background-color: #ffe5e5 !important;
          color: #d32f2f !important;
          margin-bottom: 10px !important;
        }
      `}</style>

      <div className="fam-root fam-card">
        {/* Top Bar Row */}
        <div className="fam-top-bar">
          <button type="button" className="fam-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <h2 className="fam-h2">START FREE ASSESSMENT</h2>
        <p className="fam-description">
          Personalized for your target placement role and company pattern.
        </p>

        {error && <div className="fam-status-error">{error}</div>}

        {user ? <>
        {/* 1. Target Role Section */}
        <div className="fam-followup-card">
          <h3>1. Target Role</h3>
          <p style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
            Select the role you are preparing for:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {POPULAR_ROLES.map((role) => {
              const isSelected = selectedRole === role && !customRole;
              return (
                <div
                  key={role}
                  className={`fam-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedRole(role);
                    setCustomRole('');
                  }}
                >
                  {role}
                </div>
              );
            })}
          </div>
          <input
            type="text"
            className="fam-input"
            placeholder="Or type custom role..."
            value={customRole}
            onChange={(e) => {
              setCustomRole(e.target.value);
              setSelectedRole(e.target.value);
            }}
          />
        </div>

        {/* 2. Target Company Section */}
        <div className="fam-followup-card">
          <h3>2. Target Company</h3>
          <p style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
            Select your dream or target company:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {POPULAR_COMPANIES.map((company) => {
              const isSelected = selectedCompany === company && !customCompany;
              return (
                <div
                  key={company}
                  className={`fam-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCompany(company);
                    setCustomCompany('');
                  }}
                >
                  {company}
                </div>
              );
            })}
          </div>
          <input
            type="text"
            className="fam-input"
            placeholder="Or type custom company..."
            value={customCompany}
            onChange={(e) => {
              setCustomCompany(e.target.value);
              setSelectedCompany(e.target.value);
            }}
          />
        </div>

        {/* Action Button Row */}
        <div className="fam-btn-row">
          <button type="button" className="fam-btn-secondary" onClick={onClose}>
            CANCEL
          </button>
          <button
            type="button"
            className="fam-btn-primary"
            onClick={handleStartAssessment}
            disabled={!finalRole || !finalCompany}
          >
            START TEST →
          </button>
        </div>
        </> : (
          <div className="fam-followup-card" style={{ textAlign: 'center', padding: '24px 18px' }}>
            <h3 style={{ fontSize: '14px', color: '#111111', marginBottom: '8px', textTransform: 'none', letterSpacing: 0 }}>
              Create your account to begin
            </h3>
            <p style={{ fontSize: '12px', color: '#666666', lineHeight: 1.5, marginBottom: '18px' }}>
              We’ll ask for your target role and company after you sign up, then build your diagnostic from the Question Bank.
            </p>
            <div className="fam-btn-row">
              <button type="button" className="fam-btn-secondary" onClick={() => continueToAssessmentAuth('login')}>
                LOG IN
              </button>
              <button type="button" className="fam-btn-primary" onClick={() => continueToAssessmentAuth('signup')}>
                SIGN UP →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
