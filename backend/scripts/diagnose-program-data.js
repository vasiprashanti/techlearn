import connectDB from "../config/db.js";
import mongoose from "mongoose";
import Program from "../models/Program.js";
import { buildProgramDiagnostics } from "../services/programDiagnostics.js";

const programId = process.argv.find((value) => value.startsWith("--programId="))?.split("=")[1] || null;

const run = async () => {
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.log(JSON.stringify({ readOnly: true, skipped: true, reason: "MONGO_URI is not configured" }));
    return;
  }

  await connectDB();
  const programs = programId
    ? [{ _id: programId }]
    : await Program.find().select("_id").sort({ createdAt: 1 }).lean();
  const diagnostics = [];
  for (const program of programs) {
    diagnostics.push(await buildProgramDiagnostics({ programId: program._id }));
  }
  console.log(JSON.stringify({ readOnly: true, programs: diagnostics }, null, 2));
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.MONGO_URI || process.env.MONGODB_URI) await mongoose.disconnect();
  });
