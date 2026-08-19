import React, { useState } from 'react';
import { X, Users, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { programLearningAPI } from '../../services/programLearningApi';

export default function JoinWaitlistModal({ isOpen, onClose, program }) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || user?.firstName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
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
      setError('Email is required.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-[#071330] text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-lg font-bold">You're on the Waitlist!</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              We've reserved your spot for <span className="font-semibold text-slate-900 dark:text-white">{program.name || program.title}</span>. Our team will reach out with early batch access and schedule details.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-400/20 dark:text-blue-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Join Program Waitlist</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {program.name || program.title}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Phone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Target Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400">Target Company</label>
                  <input
                    type="text"
                    placeholder="e.g. TCS"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Join Waitlist</span>}
                  {!loading && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
