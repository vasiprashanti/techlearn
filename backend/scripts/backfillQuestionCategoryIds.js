/**
 * One-time / maintenance: set Question.categoryId from QuestionCategory.slug
 * for documents that only had categorySlug. Safe to re-run.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import Question from "../models/Questions.js";
import QuestionCategory from "../models/QuestionCategory.js";

dotenv.config();

const run = async () => {
  await connectDB();
  const categories = await QuestionCategory.find().select("_id slug").lean();
  let modified = 0;
  for (const cat of categories) {
    const result = await Question.updateMany(
      {
        categorySlug: cat.slug,
        $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
      },
      { $set: { categoryId: cat._id } }
    );
    modified += result.modifiedCount || 0;
  }
  console.log(`backfillQuestionCategoryIds: updated ${modified} question(s) across ${categories.length} categories.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
