import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { seedUsers } from "../utils/seedUsers.js";

dotenv.config();

async function main() {
  await connectDB();

  const results = await seedUsers();
  for (const { action, email, role } of results) {
    console.log(`[seedUsers] ${action}: ${email} (${role})`);
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
