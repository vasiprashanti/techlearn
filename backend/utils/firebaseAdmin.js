import admin from "firebase-admin";
import adminConfig from "../config/firebase-service-account.js";

if (!admin.apps.length) {
  const projectId = adminConfig?.project_id;
  const clientEmail = adminConfig?.client_email;
  const privateKey = adminConfig?.private_key;

  const hasFirebaseCreds = Boolean(projectId && clientEmail && privateKey);

  if (hasFirebaseCreds) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(adminConfig),
      });
    } catch (err) {
      console.warn(
        "[Firebase] Credentials invalid or unreadable. Firebase auth disabled. Error:",
        err?.message || err,
      );
    }
  } else {
    console.warn(
      "[Firebase] Credentials not found. Firebase auth disabled (email/password auth still works).",
    );
  }
}

export default admin;
