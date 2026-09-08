import connectDB from "../config/db.js";
import mongoose from "mongoose";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { resolveSafeLegacyIndividualStartDate } from "../utils/programEnrollmentDate.js";

const applyChanges = process.argv.includes("--apply");
const programId = process.argv.find((value) => value.startsWith("--programId="))?.split("=")[1] || null;
const limitValue = Number(process.argv.find((value) => value.startsWith("--limit="))?.split("=")[1]);
const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : 0;

const run = async () => {
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.log(JSON.stringify({ mode: applyChanges ? "apply" : "dry-run", skipped: true, reason: "MONGO_URI is not configured" }));
    return;
  }

  await connectDB();
  const query = {
    ...(programId ? { programId } : {}),
    $or: [
      { individualStartDateSource: { $exists: false } },
      { individualStartDateSource: "legacy_inferred" },
    ],
  };
  const cursor = ProgramEnrollment.find(query).sort({ createdAt: 1 });
  if (limit) cursor.limit(limit);
  const enrollments = await cursor.lean();
  const summary = { mode: applyChanges ? "apply" : "dry-run", scanned: enrollments.length, candidates: 0, updated: 0, skipped: 0, reasons: {} };

  for (const enrollment of enrollments) {
    const [user, student] = await Promise.all([
      enrollment.userId ? User.findById(enrollment.userId).select("_id startDate createdAt").lean() : null,
      enrollment.studentId ? Student.findById(enrollment.studentId).select("_id createdAt").lean() : null,
    ]);
    const result = await resolveSafeLegacyIndividualStartDate({ enrollment, user, student });
    summary.reasons[result.reason] = (summary.reasons[result.reason] || 0) + 1;
    if (!result.reconciled) {
      summary.skipped += 1;
      continue;
    }

    summary.candidates += 1;
    if (applyChanges) {
      const updated = await ProgramEnrollment.updateOne(
        {
          _id: enrollment._id,
          individualStartDate: enrollment.individualStartDate,
          $or: [
            { individualStartDateSource: { $exists: false } },
            { individualStartDateSource: "legacy_inferred" },
          ],
        },
        { $set: { individualStartDate: result.date, individualStartDateSource: "legacy_inferred" } },
      );
      summary.updated += updated.modifiedCount || 0;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.MONGO_URI || process.env.MONGODB_URI) await mongoose.disconnect();
  });
