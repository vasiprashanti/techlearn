const DEFAULT_ADMIN_EMAILS = [
  "vasitanvika424@gmail.com",
  "test@gmail.com",
];

const LEGACY_ADMIN_UIDS = ["AQX8cieAI6NNMtVvNRlT47WxdLu1"];

const parseList = (value = "") =>
  value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export const normalizeAdminEmail = (email = "") => email.trim().toLowerCase();

export const getAdminEmails = () =>
  new Set([
    ...DEFAULT_ADMIN_EMAILS.map(normalizeAdminEmail),
    ...parseList(process.env.ADMIN_EMAILS),
  ]);

export const isAdminEmail = (email) =>
  getAdminEmails().has(normalizeAdminEmail(email));

export const isAdminIdentity = ({ email, uid } = {}) => {
  const configuredUids = parseList(process.env.ADMIN_FIREBASE_UIDS);
  const allowedUids = new Set([
    ...LEGACY_ADMIN_UIDS.map((entry) => entry.toLowerCase()),
    ...configuredUids,
  ]);

  return isAdminEmail(email) || allowedUids.has(String(uid || "").toLowerCase());
};
