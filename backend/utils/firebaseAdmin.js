import admin from "firebase-admin";
import serviceAccount from "../config/firebase-service-account.js";

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else if (!serviceAccount) {
  console.warn(
    "⚠️ Firebase Admin not configured (missing FIREBASE_* env vars). Google auth features will be disabled."
  );
}

export default admin;
