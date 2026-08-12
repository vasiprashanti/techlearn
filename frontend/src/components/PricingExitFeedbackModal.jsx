import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import API from '../api/client';

const FEEDBACK_OPTIONS = [
  "Too expensive",
  "Not ready yet",
  "Need more time",
  "Not sure which plan is right for me",
  "I want to explore first",
  "Other",
];

export default function PricingExitFeedbackModal({ isOpen, onClose, onSubmitted, programId, selectedPlan }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedReason) return;

    setLoading(true);
    try {
      await API.post('/api/payments/exit-feedback', {
        programId,
        selectedPlan,
        reason: selectedReason,
        customReason: selectedReason === "Other" ? customReason : "",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onSubmitted ? onSubmitted() : onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit pricing exit feedback:', err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleTalkToUs = () => {
    // Open support or contact channel
    window.open('mailto:support@techlearn.com?subject=Inquiry%20About%20TechLearn%20Programs', '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e1a30] p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank you for your feedback!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">We appreciate your input.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  What's holding you back?
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Help us understand how we can better assist your learning journey.
                </p>
              </div>

              <div className="space-y-2">
                {FEEDBACK_OPTIONS.map((option) => {
                  const isSelected = selectedReason === option;
                  return (
                    <label
                      key={option}
                      onClick={() => setSelectedReason(option)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#3c83f6] bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exit_reason"
                        value={option}
                        checked={isSelected}
                        onChange={() => setSelectedReason(option)}
                        className="text-[#3c83f6] focus:ring-[#3c83f6]"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>

              {selectedReason === "Other" && (
                <div>
                  <textarea
                    rows={2}
                    placeholder="Tell us more..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060d1a] p-3 text-xs text-slate-900 dark:text-slate-100 focus:border-[#3c83f6] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleTalkToUs}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition"
                >
                  <MessageSquare className="w-4 h-4 text-[#3c83f6]" />
                  <span>Talk to Us</span>
                </button>

                <button
                  type="submit"
                  disabled={!selectedReason || loading}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-[#3c83f6] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting...' : 'Submit'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
