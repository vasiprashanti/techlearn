import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, BookOpen, Layers, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import API from '../../api/client';

export default function OnboardingPrograms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchUserData } = useUser();

  const [programs, setPrograms] = useState([]);
  const [activeProgramId, setActiveProgramId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectingId, setSelectingId] = useState('');

  useEffect(() => {
    fetchAssignedPrograms();
  }, []);

  const fetchAssignedPrograms = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/api/programs/assigned');
      if (response.data?.success) {
        setPrograms(response.data.programs || []);
        setActiveProgramId(response.data.activeProgramId || '');
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Error fetching assigned programs:', err);
      setError(err.response?.data?.message || 'Failed to load your assigned programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProgram = async (programId) => {
    setSelectingId(programId);
    setError('');
    try {
      const response = await API.post('/api/programs/select-active', { programId });
      if (response.data?.success) {
        if (typeof refetchUserData === 'function') {
          await refetchUserData();
        }
        navigate('/dashboard');
      } else {
        setError(response.data?.message || 'Failed to select program.');
      }
    } catch (err) {
      console.error('Error selecting active program:', err);
      setError(err.response?.data?.message || 'Unauthorized or invalid program selection.');
    } finally {
      setSelectingId('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d1a] text-[#0f172a] dark:text-[#f1f5f9] font-sans flex flex-col justify-between p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 pt-6 sm:pt-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00113b]/10 dark:bg-[#8fd9ff]/10 text-[#00113b] dark:text-[#8fd9ff] text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#3b82f6]" />
            Your Tailored Learning Pathways
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#00113b] dark:text-white">
            Recommended Programs For You
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#475569] dark:text-[#94a3b8]">
            Based on your onboarding preferences, we matched you with the following learning programs. Choose a program to start your journey.
          </p>
        </motion.div>

        {/* Global Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto p-4 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#3b82f6] border-r-transparent align-[-0.125em]" />
            <p className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8]">Finding matching programs...</p>
          </div>
        ) : programs.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto py-12 px-6 rounded-2xl bg-white dark:bg-[#0e1a30] border border-[#e2e8f0] dark:border-[#1e293b] shadow-xl text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-[#f1f5f9] dark:bg-[#1e293b] flex items-center justify-center mx-auto text-[#64748b] dark:text-[#94a3b8]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#0f172a] dark:text-white">No Programs Matched Yet</h2>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
              We couldn't find an active program matching your current tier and criteria. Update your preferences in Settings or contact support.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00113b] text-[#daf0fa] hover:bg-[#001b5c] transition text-sm font-semibold shadow-md"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          /* Program Cards Grid (2-3 per row desktop, 1 per row mobile) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {programs.map((program, idx) => {
              const isSelected = String(program._id) === String(activeProgramId);
              const isBusy = selectingId === program._id;

              return (
                <motion.div
                  key={program._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 bg-white dark:bg-[#0e1a30] border ${
                    isSelected
                      ? 'border-[#3b82f6] shadow-lg shadow-[#3b82f6]/10 ring-2 ring-[#3b82f6]'
                      : 'border-[#e2e8f0] dark:border-[#1e293b] hover:border-[#cbd5e1] dark:hover:border-[#334155] hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Program Type & Access Tier Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full bg-[#eff6ff] dark:bg-[#1e3a8a]/40 text-[#2563eb] dark:text-[#93c5fd] text-xs font-semibold tracking-wide">
                        {program.programType || 'Learning Track'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.pricingType === 'Paid'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {program.pricingType === 'Paid' ? `Paid (₹${program.programFee})` : 'Free Track'}
                      </span>
                    </div>

                    {/* Program Title & Description */}
                    <div>
                      <h3 className="text-xl font-bold text-[#0f172a] dark:text-white leading-snug">
                        {program.name}
                      </h3>
                      {program.description && (
                        <p className="mt-2 text-xs sm:text-sm text-[#64748b] dark:text-[#94a3b8] line-clamp-3 leading-relaxed">
                          {program.description}
                        </p>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="pt-2 border-t border-[#f1f5f9] dark:border-[#1e293b] flex items-center justify-between text-xs text-[#64748b] dark:text-[#94a3b8]">
                      <span>Duration: <strong>{program.duration || 'Self-paced'}</strong></span>
                      <div className="flex items-center gap-3">
                        {program.courseCount > 0 && <span>{program.courseCount} Courses</span>}
                        {program.projectCount > 0 && <span>{program.projectCount} Projects</span>}
                      </div>
                    </div>
                  </div>

                  {/* Start Action Button */}
                  <div className="pt-6 mt-4">
                    <button
                      onClick={() => handleStartProgram(program._id)}
                      disabled={isBusy}
                      className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wide uppercase transition shadow-sm ${
                        isSelected
                          ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'
                          : 'bg-[#00113b] dark:bg-white text-[#daf0fa] dark:text-[#00113b] hover:bg-[#001b5c] dark:hover:bg-slate-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isBusy ? (
                        'Starting...'
                      ) : (
                        <>
                          <span>{isSelected ? 'Continue Program' : 'Start Program'}</span>
                          <Rocket className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-[#94a3b8] dark:text-[#64748b]">
        TechLearn — Tailored Learning & Placement Pathways
      </footer>
    </div>
  );
}
