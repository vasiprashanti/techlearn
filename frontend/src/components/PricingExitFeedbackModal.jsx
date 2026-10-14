import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2 } from 'lucide-react';
import API from '../api/client';
import { useTheme } from '../context/ThemeContext';

const FEEDBACK_OPTIONS = [
  "Feels Expensive",
  "Trying Free Content",
  "Payment / UPI failed",
  "Just exploring",
  "Need more information",
  "Something else",
];

export default function PricingExitFeedbackModal({ isOpen, onClose, onSubmitted, programId, selectedPlan }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        customReason: selectedReason === "Something else" ? customReason.trim() : "",
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        if (onSubmitted) onSubmitted();
        else if (onClose) onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit pricing exit feedback:', err);
      if (onSubmitted) onSubmitted();
      else if (onClose) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Press+Start+2P&display=swap');

          .pe-modal-card {
            width: 100% !important;
            max-width: 480px !important;
            border-radius: 24px !important;
            padding: 26px !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
            font-family: 'Poppins', sans-serif !important;
            transition: background-color 0.2s ease, border-color 0.2s ease !important;
          }

          .pe-modal-card.dark {
            background: #0a1238 !important;
            color: #ffffff !important;
            border: 1px solid #222e55 !important;
            box-shadow: 0 16px 48px rgba(0,0,0,0.55) !important;
          }

          .pe-modal-card.light {
            background: #ffffff !important;
            color: #111111 !important;
            border: 1px solid rgba(4,16,61,0.12) !important;
            box-shadow: 0 12px 32px rgba(4,16,61,0.15) !important;
          }

          .pe-pixel-heading {
            font-family: 'Press Start 2P', cursive !important;
            font-size: 13px !important;
            font-weight: 400 !important;
            line-height: 1.5 !important;
            text-align: center !important;
            letter-spacing: 0.5px !important;
            margin-bottom: 6px !important;
          }

          .dark .pe-pixel-heading {
            color: #ffffff !important;
          }

          .light .pe-pixel-heading {
            color: #050a3b !important;
          }

          .pe-description {
            font-size: 12px !important;
            text-align: center !important;
            margin-bottom: 16px !important;
          }

          .dark .pe-description {
            color: #c0cbe2 !important;
          }

          .light .pe-description {
            color: #65708c !important;
          }

          .pe-option-card {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 10px 14px !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            font-size: 12px !important;
            font-weight: 500 !important;
          }

          .dark .pe-option-card {
            border: 1.5px solid #222e55 !important;
            background: #060e2c !important;
            color: #f0f6fc !important;
          }

          .dark .pe-option-card:hover {
            border-color: #89c638 !important;
            transform: translateY(-1px) !important;
          }

          .dark .pe-option-card.selected {
            border-color: #89c638 !important;
            background-color: rgba(137, 198, 56, 0.12) !important;
            box-shadow: 0 0 0 1px #89c638 !important;
            color: #ffffff !important;
            font-weight: 600 !important;
          }

          .light .pe-option-card {
            border: 1.5px solid #e5e5ea !important;
            background: #ffffff !important;
            color: #1c1c1e !important;
          }

          .light .pe-option-card:hover {
            border-color: #050a3b !important;
            transform: translateY(-1px) !important;
          }

          .light .pe-option-card.selected {
            border-color: #89c638 !important;
            background-color: #f7fee7 !important;
            box-shadow: 0 0 0 1px #89c638 !important;
            font-weight: 600 !important;
            color: #17230c !important;
          }

          .pe-btn-primary {
            width: 100% !important;
            height: 44px !important;
            border-radius: 12px !important;
            border: none !important;
            background-color: #89c638 !important;
            color: #17230c !important;
            font-family: 'Press Start 2P', cursive !important;
            font-size: 9px !important;
            font-weight: 400 !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            text-transform: uppercase !important;
            transition: all 0.2s ease !important;
          }

          .pe-btn-primary:hover:not(:disabled) {
            background-color: #a2dc59 !important;
            transform: translateY(-1px) !important;
          }

          .pe-btn-primary:disabled {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
          }

          .pe-btn-secondary {
            width: 100% !important;
            height: 44px !important;
            border-radius: 12px !important;
            border: 1px solid transparent !important;
            font-family: 'Press Start 2P', cursive !important;
            font-size: 9px !important;
            font-weight: 400 !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            text-transform: uppercase !important;
            transition: all 0.2s ease !important;
          }

          .dark .pe-btn-secondary {
            background-color: #18224b !important;
            color: #ffffff !important;
            border-color: #2b396b !important;
          }

          .dark .pe-btn-secondary:hover {
            background-color: #222e5e !important;
            transform: translateY(-1px) !important;
          }

          .light .pe-btn-secondary {
            background-color: #f2f2f7 !important;
            color: #1c1c1e !important;
            border-color: #e5e5ea !important;
          }

          .light .pe-btn-secondary:hover {
            background-color: #e5e5ea !important;
            transform: translateY(-1px) !important;
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`pe-modal-card ${isDark ? 'dark' : 'light'}`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 right-4 p-1.5 rounded-full transition ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#89c638] mx-auto animate-bounce" />
              <h3 className="pe-pixel-heading">Thank you!</h3>
              <p className="pe-description">Your feedback helps us make TechLearn better.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="pe-pixel-heading">
                  WHAT'S HOLDING YOU BACK?
                </h3>
                <p className="pe-description">
                  Your feedback helps us make TechLearn better.
                </p>
              </div>

              {/* Feedback Radio Options */}
              <div className="space-y-1.5">
                {FEEDBACK_OPTIONS.map((option) => {
                  const isSelected = selectedReason === option;
                  return (
                    <label
                      key={option}
                      onClick={() => setSelectedReason(option)}
                      className={`pe-option-card ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="exit_reason"
                        value={option}
                        checked={isSelected}
                        onChange={() => setSelectedReason(option)}
                        className="accent-[#89c638] w-4 h-4 cursor-pointer"
                      />
                      <span>{option}</span>
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
                    className={`w-full rounded-xl border p-3 text-xs outline-none transition ${
                      isDark
                        ? 'border-[#222e55] bg-[#060e2c] text-white placeholder-slate-500 focus:border-[#89c638]'
                        : 'border-[#e5e5ea] bg-white text-[#1c1c1e] placeholder-slate-400 focus:border-[#050a3b]'
                    }`}
                  />
                </div>
              )}

              {/* Action Buttons: Back to Enroll and Submit & Continue */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="pe-btn-secondary"
                >
                  <span>Back to Enroll</span>
                </button>

                <button
                  type="submit"
                  disabled={!selectedReason || (selectedReason === "Something else" && !customReason.trim()) || loading}
                  className="pe-btn-primary"
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

