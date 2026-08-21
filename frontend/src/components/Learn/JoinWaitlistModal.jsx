import React, { useState } from 'react';
import { X, Users, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { programLearningAPI } from '../../services/programLearningApi';

export default function JoinWaitlistModal({ isOpen, onClose, program }) {
  const { user } = useAuth();

  const [name, setName] = useState(
    user?.name || (user?.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '')
  );
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [targetCompany, setTargetCompany] = useState(user?.targetCompanies?.[0] || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !program) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await programLearningAPI.joinWaitlist(program._id || program.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        targetRole: targetRole.trim(),
        targetCompany: targetCompany.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error joining waitlist:', err);
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Press+Start+2P&display=swap');
        .press-start-font {
          font-family: 'Press Start 2P', cursive !important;
        }
      `}</style>

      <div className="relative w-full max-w-[480px] rounded-3xl bg-white dark:bg-[#071330] p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.3)] border border-black/5 dark:border-[#15366f]/50 transition-all text-slate-900 dark:text-slate-100 my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="press-start-font text-[12px] sm:text-[14px] uppercase tracking-wider text-[#00113b] dark:text-[#8fd9ff] mt-2">
              You're on the Waitlist!
            </h3>
            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
              We've reserved your spot for <strong className="text-slate-900 dark:text-white">{program.name || program.title}</strong>. Our team will reach out with early batch schedules and enrollment details.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#a3e635] hover:bg-[#86efac] py-3 press-start-font text-[10px] font-bold text-[#0a1128] shadow-md shadow-[#a3e635]/25 transition cursor-pointer"
            >
              DONE
            </button>
          </div>
        ) : (
          <div>
            {/* Header matching Signup modal typography */}
            <div className="text-center pb-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-[#8fd9ff] text-[10px] font-bold uppercase tracking-wider mb-2">
                <Users className="h-3.5 w-3.5" />
                <span>Trainer-Led Program</span>
              </div>
              <h2 className="press-start-font text-[12px] sm:text-[13px] uppercase tracking-wider text-[#00113b] dark:text-white leading-relaxed">
                Join Program Waitlist
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-sm mx-auto font-medium">
                {program.name || program.title}
              </p>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400 font-semibold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1">
                    Target Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TCS, Amazon"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 px-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-[#a3e635] hover:bg-[#86efac] press-start-font text-[9.5px] sm:text-[10px] font-bold text-[#0a1128] shadow-md shadow-[#a3e635]/25 transition hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>SUBMITTING...</span>
                    </>
                  ) : (
                    <>
                      <span>JOIN WAITLIST</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
