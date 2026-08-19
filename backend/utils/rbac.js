export const ADMIN_PERMISSIONS = Object.freeze({
  PROGRAMS_READ: "programs:read",
  PROGRAMS_WRITE: "programs:write",
  STUDENTS_READ: "students:read",
  STUDENTS_WRITE: "students:write",
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",
  ANALYTICS_READ: "analytics:read",
});

const normalizePermission = (value) => String(value || "").trim().toLowerCase();

export const hasAdminPermission = (user, permission) => {
  if (user?.role !== "admin") return false;

  // Existing admin accounts predate granular permissions. An empty permission
  // list intentionally preserves their full admin access until permissions are
  // assigned explicitly, while still allowing restricted admin accounts to be
  // introduced without trusting anything from the browser.
  const permissions = Array.isArray(user.permissions)
    ? user.permissions.map(normalizePermission).filter(Boolean)
    : [];
  if (permissions.length === 0 || permissions.includes("*")) return true;

  return permissions.includes(normalizePermission(permission));
};

export const requireAdminPermission = (...permissions) => (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: administrator access is required" });
  }

  if (permissions.length === 0 || permissions.some((permission) => hasAdminPermission(req.user, permission))) {
    return next();
  }

  return res.status(403).json({
    error: "Forbidden: you do not have permission to perform this action",
    requiredPermissions: permissions,
  });
};

