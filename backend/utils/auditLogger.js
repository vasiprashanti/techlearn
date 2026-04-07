import AuditLog from "../models/AuditLog.js";

export const writeAuditLog = async ({
  verb,
  entityType,
  entityId = "",
  action,
  detail = "",
  actor = null,
  metadata = {},
}) => {
  try {
    const actorName = actor
      ? [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() ||
        actor.email ||
        "Admin User"
      : "System";

    await AuditLog.create({
      verb,
      entityType,
      entityId: entityId ? String(entityId) : "",
      action,
      detail,
      actorId: actor?._id || null,
      actorName,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
};
