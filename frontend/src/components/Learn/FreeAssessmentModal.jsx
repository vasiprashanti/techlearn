import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Building2, Briefcase, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
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

export default function FreeAssessmentModal({ isOpen, onClose, defaultProgramId = null, initialRole = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(initialRole || user?.targetRole || 'Full Stack Developer');
  const [customRole, setCustomRole] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(user?.targetCompanies?.[0] || 'TCS');
  const [customCompany, setCustomCompany] = useState('');

  React.useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
      setCustomRole('');
    }
  }, [initialRole, isOpen]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const finalRole = customRole.trim() || selectedRole;
  const finalCompany = customCompany.trim() || selectedCompany;

  const handleStartAssessment = async () => {
    if (!finalRole) {
      setError('Please select or specify your target role.');
      return;
    }
    if (!finalCompany) {
      setError('Please select or specify your target company.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await programLearningAPI.startFreeAssessment({
        targetRole: finalRole,
        targetCompany: finalCompany,
        programId: defaultProgramId,
      });

      if (response?.success && response?.programId) {
        onClose();
        navigate(`/learn/program/${response.programId}`);
      } else {
        throw new Error(response?.message || 'Could not generate assessment.');
      }
    } catch (err) {
      console.error('Error starting Free Assessment:', err);
      setError(err.message || 'Failed to start Free Assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-[#071330] text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 dark:bg-violet-400/20 dark:text-violet-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Start Free Assessment</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized for your target placement role and company pattern
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {/* Step 1: Target Role */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Briefcase className="h-3.5 w-3.5 text-violet-500" />
              Select Target Role
            </label>
            <div className="mt-2.5 flex flex-wrap gap-2">
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
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-500/40'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Or type custom role..."
              value={customRole}
              onChange={(e) => {
                setCustomRole(e.target.value);
                setSelectedRole(e.target.value);
              }}
              className="mt-2.5 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-violet-500 dark:border-white/10"
            />
          </div>

          {/* Step 2: Target Company */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-violet-500" />
              Select Target Company
            </label>
            <div className="mt-2.5 flex flex-wrap gap-2">
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
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-500/40'
                    }`}
                  >
                    {company}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Or type custom company..."
              value={customCompany}
              onChange={(e) => {
                setCustomCompany(e.target.value);
                setSelectedCompany(e.target.value);
              }}
              className="mt-2.5 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-violet-500 dark:border-white/10"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartAssessment}
            disabled={loading || !finalRole || !finalCompany}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Blueprint...</span>
              </>
            ) : (
              <>
                <span>Generate Assessment</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
