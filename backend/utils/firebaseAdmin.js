import admin from "firebase-admin";
import adminConfig from "../config/firebase-service-account.js";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
  });
}

export default admin;
