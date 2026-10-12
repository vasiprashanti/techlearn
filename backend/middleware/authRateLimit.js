/**
 * Small in-memory rate limiter for authentication endpoints.
 *
 * Limits are tracked per client IP and, where an email is supplied, per email
 * too, so brute-forcing one account is blocked even if the IP header is spoofed.
 * (Memory is per server instance, which is still a useful brake on serverless.)
 */

const store = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000).unref();

const clientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || req.ip || "unknown";

const hit = (key, windowMs) => {
  const now = Date.now();
  let record = store.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowMs };
  }
  record.count += 1;
  store.set(key, record);
  return record;
};

export const authRateLimit = ({ name, windowMs = 15 * 60 * 1000, perIp = 30, perEmail = 8, message }) =>
  (req, res, next) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const ipRecord = hit(`${name}:ip:${clientIp(req)}`, windowMs);
    const emailRecord = email ? hit(`${name}:email:${email}`, windowMs) : null;

    const exceeded = ipRecord.count > perIp || (emailRecord && emailRecord.count > perEmail);
    if (exceeded) {
      const resetAt = Math.max(ipRecord.resetAt, emailRecord?.resetAt || 0);
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: message || "Too many attempts. Please wait a few minutes and try again.",
        retryAfter,
      });
    }
    return next();
  };
