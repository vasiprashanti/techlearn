// Shared logic for MCQ and CodingRound verification, OTP, validation, and submission
import crypto from "crypto";
import { sendMail } from "./mailer.js";

const otpStore = new Map();
const DEFAULT_OTP_EXPIRES_IN_MS = 30 * 60 * 1000;

// Clean expired OTPs every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    const otps = Array.isArray(entry?.otps)
      ? entry.otps
      : (entry?.otp ? [{ otp: entry.otp, expiresAt: entry.expiresAt }] : []);
    const activeOtps = otps.filter((item) => item.expiresAt >= now);
    if (activeOtps.length === 0) {
      otpStore.delete(key);
    } else {
      otpStore.set(key, { otps: activeOtps });
    }
  }
}, 2 * 60 * 1000);

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(key, otp, expiresIn = DEFAULT_OTP_EXPIRES_IN_MS) {
  const now = Date.now();
  const existing = otpStore.get(key);
  const existingOtps = Array.isArray(existing?.otps)
    ? existing.otps
    : (existing?.otp ? [{ otp: existing.otp, expiresAt: existing.expiresAt }] : []);
  const activeOtps = existingOtps.filter((item) => item.expiresAt >= now);

  otpStore.set(key, {
    otps: [
      ...activeOtps,
      {
    otp,
        expiresAt: now + expiresIn,
      },
    ].slice(-5),
  });
}

export function verifyOTP(key, otp) {
  const entry = otpStore.get(key);
  if (!entry) return false;

  const sanitizedOtp = String(otp || "").trim();
  const now = Date.now();
  const otps = Array.isArray(entry?.otps)
    ? entry.otps
    : (entry?.otp ? [{ otp: entry.otp, expiresAt: entry.expiresAt }] : []);
  const activeOtps = otps.filter((item) => item.expiresAt >= now);

  if (activeOtps.length === 0) {
    otpStore.delete(key);
    return false;
  }

  otpStore.set(key, { otps: activeOtps });
  return activeOtps.some((item) => String(item.otp).trim() === sanitizedOtp);
}

export async function sendOTPEmail(email, otp, context = "MCQ/Coding Round") {
  const subject = `Your OTP for ${context}`;
  const text = `Your OTP is: ${otp}\nThis OTP is valid for 30 minutes. If you requested multiple OTPs, any recent OTP can be used.`;
  await sendMail(email, subject, text);
}

// Validate round is active (duration, date, endTime)
export function isRoundActive(round) {
  if (!round.isActive) return false;

  const now = Date.now();
  const start = new Date(round.date).getTime();

  // Use endTime if available, otherwise calculate from duration
  let end;
  if (round.endTime) {
    end = new Date(round.endTime).getTime();
  } else {
    end = start + round.duration * 60 * 1000;
  }

  return now >= start && now <= end;
}

// Helper for time status
export function getRoundTimeStatus(round) {
  const now = Date.now();
  const start = new Date(round.date).getTime();

  // Use endTime if available, otherwise calculate from duration
  let end;
  if (round.endTime) {
    end = new Date(round.endTime).getTime();
  } else {
    end = start + round.duration * 60 * 1000;
  }

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
