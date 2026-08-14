import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import API from '../api/client';

const FEEDBACK_OPTIONS = [
  "Feels Expensive",
  "Trying Free Content",
  "Payment / UPI failed",
  "Just exploring",
  "Need more information",
  "Something else",
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

    // If user clicked "Need more information", open WhatsApp with pre-filled message
    if (selectedReason === "Need more information") {
      window.open('https://api.whatsapp.com/send/?phone=919000663666&text=Hey%2C+I+need+more+information+before+joining+the+program.+Can+you+help+me%3F&type=phone_number&app_absent=0', '_blank');
    }

    setLoading(true);
    try {
      await API.post('/api/payments/exit-feedback', {
        programId,
        selectedPlan,
        reason: selectedReason,
        customReason: selectedReason === "Something else" ? customReason : "",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onSubmitted ? onSubmitted() : onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit pricing exit feedback:', err);
      onSubmitted ? onSubmitted() : onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/10 dark:border-white/15 bg-white/95 dark:bg-[#0f1f43]/95 backdrop-blur-xl p-6 shadow-2xl text-slate-900 dark:text-white"
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Your feedback helps us make TechLearn better.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What’s holding you back?
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your feedback helps us make TechLearn better.
                </p>
              </div>

              <div className="space-y-2">
                {FEEDBACK_OPTIONS.map((option) => {
                  const isSelected = selectedReason === option;
                  return (
                    <label
                      key={option}
                      onClick={() => setSelectedReason(option)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#3c83f6] bg-blue-50/80 dark:bg-blue-950/50 text-[#3c83f6] dark:text-[#7fb1ff] shadow-sm'
                          : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-white/[0.03]'
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
                      <span className="font-semibold">{option}</span>
                    </label>
                  );
                })}
              </div>

              {selectedReason === "Something else" && (
                <div>
                  <textarea
                    rows={2}
                    placeholder="Tell us more..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-[#07132e] p-3 text-xs text-slate-900 dark:text-slate-100 focus:border-[#3c83f6] focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-[#3c83f6]/40 dark:border-[#3c83f6]/60 bg-blue-50 dark:bg-blue-950/40 text-[#3c83f6] dark:text-[#7fb1ff] hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <span>Back to Enroll</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="submit"
                  disabled={!selectedReason || loading}
                  className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-[#3c83f6] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit & Continue'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
