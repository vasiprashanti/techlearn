// Shared logic for MCQ and CodingRound verification, OTP, validation, and submission
import crypto from "crypto";
import { sendMail } from "./mailer.js";

const otpStore = new Map();

// Clean expired OTPs every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, { expiresAt }] of otpStore.entries()) {
    if (expiresAt < now) otpStore.delete(key);
  }
}, 2 * 60 * 1000);

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(key, otp, expiresIn = 5 * 60 * 1000) {
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + expiresIn,
  });
}

export function verifyOTP(key, otp) {
  const entry = otpStore.get(key);
  if (!entry) return false;
  if (entry.otp !== otp) return false;
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(key);
    return false;
  }
  otpStore.delete(key);
  return true;
}

export async function sendOTPEmail(email, otp, context = "MCQ/Coding Round") {
  const subject = `Your OTP for ${context}`;
  const text = `Your OTP is: ${otp}\nThis OTP is valid for 5 minutes.`;
  await sendMail(email, subject, text);
}

// Validate round is active (duration, date)
export function isRoundActive(round) {
  if (!round.isActive) return false;
  const now = Date.now();
  const start = new Date(round.date).getTime();
  const end = start + round.duration * 60 * 1000;
  return now >= start && now <= end;
}

// Helper for time status
export function getRoundTimeStatus(round) {
  const now = Date.now();
  const start = new Date(round.date).getTime();
  const end = start + round.duration * 60 * 1000;
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

// Submission validation (generic)
export function validateSubmission(submission, round) {
  // Implement custom validation logic as needed
  // e.g., check required fields, answer format, etc.
  return true;
}

export default {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
  isRoundActive,
  getRoundTimeStatus,
  validateSubmission,
};
