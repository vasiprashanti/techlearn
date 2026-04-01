import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const USERS_TO_SEED = [
  {
    email: "test@gmail.com",
    password: "traceadmin@123",
    firstName: "Trace",
    lastName: "Admin",
    role: "admin",
    legacyEmails: ["email-test@gmail.com"],
  },
  {
    email: "user@gmail.com",
    password: "admintls123",
    firstName: "Admintls",
    lastName: "User",
    role: "user",
    legacyEmails: ["admintls@123", "admin@123"],
  },
  {
    email: "testing-user@gmail.com",
    password: "user@123",
    firstName: "Testing",
    lastName: "User",
    role: "user",
    legacyEmails: [],
  },
];

async function upsertUser({
  email,
  password,
  firstName,
  lastName,
  role,
  legacyEmails = [],
}) {
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.firstName = firstName;
    existing.lastName = lastName;
    existing.role = role;
    existing.password = password;
    await existing.save();
    console.log(`[seedUsers] Updated: ${normalizedEmail} (${role})`);
    return;
  }

  // If the user was previously created with a different email, update it.
  const legacyNormalized = legacyEmails
    .map((e) => String(e || "").trim().toLowerCase())
    .filter(Boolean);
  if (legacyNormalized.length > 0) {
    const legacyUser = await User.findOne({ email: { $in: legacyNormalized } });
    if (legacyUser) {
      const previousEmail = legacyUser.email;
      legacyUser.email = normalizedEmail;
      legacyUser.firstName = firstName;
      legacyUser.lastName = lastName;
      legacyUser.role = role;
      legacyUser.password = password;
      await legacyUser.save();
      console.log(
        `[seedUsers] Migrated: ${previousEmail} -> ${normalizedEmail} (${role})`,
      );
      return;
    }
  }

  await User.create({
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    role,
  });
  console.log(`[seedUsers] Created: ${normalizedEmail} (${role})`);
}

async function main() {
  await connectDB();

  for (const user of USERS_TO_SEED) {
    // eslint-disable-next-line no-await-in-loop
    await upsertUser(user);
  }

  console.log("[seedUsers] Done");
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("[seedUsers] Failed:", err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
