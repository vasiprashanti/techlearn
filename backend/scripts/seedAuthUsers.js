import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const forcePasswordReset = String(process.env.SEED_FORCE_PASSWORD || "").toLowerCase() === "true";

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "admin.techlearn.20260508@gmail.com")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

const USER_EMAIL = (process.env.SEED_USER_EMAIL || "user.techlearn.20260508@gmail.com")
  .trim()
  .toLowerCase();
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || "User@12345";

const ensureUser = async ({ email, firstName, lastName, password, role }) => {
  const existing = await User.findOne({ email });

  if (!existing) {
    const created = await User.create({ firstName, lastName, email, password, role });
    return { action: "created", user: created };
  }

  let changed = false;

  if (role && existing.role !== role) {
    existing.role = role;
    changed = true;
  }

  const hasPassword = Boolean(existing.password);
  if ((!hasPassword || forcePasswordReset) && password) {
    existing.password = password;
    changed = true;
  }

  if (changed) {
    await existing.save();
    return { action: "updated", user: existing };
  }

  return { action: "unchanged", user: existing };
};

try {
  await connectDB();

  const adminResult = await ensureUser({
    email: ADMIN_EMAIL,
    firstName: "Admin",
    lastName: "TechLearn",
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  const userResult = await ensureUser({
    email: USER_EMAIL,
    firstName: "Demo",
    lastName: "User",
    password: USER_PASSWORD,
    role: "user",
  });

  console.log("\n✅ Seed auth users complete\n");
  console.log(`Admin (${adminResult.action}): ${ADMIN_EMAIL}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  console.log(`Admin role: admin`);

  console.log("");
  console.log(`User (${userResult.action}): ${USER_EMAIL}`);
  console.log(`User password: ${USER_PASSWORD}`);
  console.log(`User role: user`);

  console.log("\nNotes:");
  console.log("- Set SEED_FORCE_PASSWORD=true to reset passwords if users already exist.");
  console.log("- Override defaults via SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD and SEED_USER_EMAIL/SEED_USER_PASSWORD.");

  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  console.error("\n❌ Failed to seed auth users:", error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
}
