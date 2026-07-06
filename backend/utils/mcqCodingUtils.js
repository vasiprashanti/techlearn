import OTP from "../models/OTP.js";

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(key, otp, expiresIn = 5 * 60 * 1000) {
  try {
    await OTP.findOneAndUpdate(
      { key },
      { otp, expiresAt: new Date(Date.now() + expiresIn) },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Error storing OTP in DB:", err);
  }
}

export async function verifyOTP(key, otp) {
  try {
    const entry = await OTP.findOne({ key });
    if (!entry) return false;
    if (entry.otp !== otp) return false;
    if (entry.expiresAt < new Date()) {
      await OTP.deleteOne({ key });
      return false;
    }
    await OTP.deleteOne({ key });
    return true;
  } catch (err) {
    console.error("Error verifying OTP from DB:", err);
    return false;
  }
}

export async function sendOTPEmail(email, otp, context = "MCQ/Coding Round") {
  const subject = `Your OTP for ${context}`;
  const text = `Your OTP is: ${otp}\nThis OTP is valid for 5 minutes.`;
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
