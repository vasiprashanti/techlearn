/**
 * Guest Assessment Rate Limiter Middleware
 * Tracks assessment initialization requests by IP and session identifier to prevent abuse.
 */

const ipStore = new Map();
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_GUEST_ATTEMPTS = 5; // Max 5 guest assessment generation requests per hour

// Periodic memory cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipStore.entries()) {
    if (now - record.firstRequest > WINDOW_MS) {
      ipStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

export const guestAssessmentRateLimiter = (req, res, next) => {
  // If user is authenticated, rate limit does not apply to this guest middleware
  if (req.user && req.user._id) {
    return next();
  }

  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "unknown_ip";

  const key = `guest_assessment_${clientIp}`;
  const now = Date.now();

  const record = ipStore.get(key) || { count: 0, firstRequest: now };

  if (now - record.firstRequest > WINDOW_MS) {
    record.count = 1;
    record.firstRequest = now;
  } else {
    record.count += 1;
  }

  ipStore.set(key, record);

  if (record.count > MAX_GUEST_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: "Too many guest assessment requests from this IP. Please sign up or log in to continue.",
      requiresAuth: true,
      retryAfter: Math.ceil((WINDOW_MS - (now - record.firstRequest)) / 1000),
    });
  }

  next();
};

export const clearGuestRateLimitStore = () => {
  ipStore.clear();
};
