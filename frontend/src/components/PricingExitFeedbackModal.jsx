import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
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
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
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
            background: #ffffff !important;
            width: 100% !important;
            max-width: 480px !important;
            border-radius: 24px !important;
            padding: 24px !important;
            box-shadow: 0 12px 32px rgba(0,0,0,0.3) !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
            color: #111111 !important;
            font-family: 'Poppins', sans-serif !important;
          }

          .pe-pixel-heading {
            font-family: 'Press Start 2P', cursive !important;
            font-size: 13px !important;
            font-weight: 400 !important;
            line-height: 1.5 !important;
            color: #000000 !important;
            text-align: center !important;
            letter-spacing: 0.5px !important;
            margin-bottom: 6px !important;
          }

          .pe-description {
            font-size: 12px !important;
            color: #666666 !important;
            text-align: center !important;
            margin-bottom: 16px !important;
          }

          .pe-option-card {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            padding: 9px 12px !important;
            border-radius: 12px !important;
            border: 1.5px solid #e5e5ea !important;
            background: #ffffff !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            font-size: 12px !important;
            font-weight: 500 !important;
            color: #1c1c1e !important;
          }

          .pe-option-card:hover {
            border-color: #1c1c1e !important;
            transform: translateY(-1px) !important;
          }

          .pe-option-card.selected {
            border-color: #a3e635 !important;
            background-color: #f7fee7 !important;
            box-shadow: 0 0 0 1px #a3e635 !important;
            font-weight: 600 !important;
          }

          .pe-btn-primary {
            width: 100% !important;
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
            gap: 6px !important;
            text-transform: uppercase !important;
            transition: opacity 0.2s !important;
          }

          .pe-btn-primary:hover {
            opacity: 0.92 !important;
          }

          .pe-btn-secondary {
            width: 100% !important;
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
            gap: 6px !important;
            text-transform: uppercase !important;
            transition: opacity 0.2s !important;
          }

          .pe-btn-secondary:hover {
            opacity: 0.9 !important;
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="pe-modal-card"
        >

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#a3e635] mx-auto" />
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
                        className="accent-[#a3e635]"
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
                    className="w-full rounded-xl border border-[#e5e5ea] bg-white p-3 text-xs text-[#1c1c1e] outline-none focus:border-[#1c1c1e]"
                  />
                </div>
              )}

              {/* Action Buttons styled matching Signup/Login */}
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
                  disabled={!selectedReason || loading}
                  className="pe-btn-primary disabled:opacity-50"
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
