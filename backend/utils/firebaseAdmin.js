import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

const serviceAccountPath = path.resolve("config/firebase-service-account.json");

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
