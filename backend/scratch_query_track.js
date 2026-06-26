import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import TrackTemplate from './models/TrackTemplate.js';
import Question from './models/Questions.js';

dotenv.config();

async function run() {
  await connectDB();
  console.log("Finding template...");
  const template = await TrackTemplate.findOne({ name: /JFS QUIZ 2/i }).lean();
  if (!template) {
    console.log("No track template found matching 'JFS QUIZ 2'");
    // Let's print all templates to be sure
    const all = await TrackTemplate.find({}).select('name').lean();
    console.log("All templates:", all);
    mongoose.disconnect();
    return;
  }
  console.log("Found template:", JSON.stringify(template, null, 2));

  // Let's check the questions for each day, especially Day 3
  for (const day of template.dayAssignments || []) {
    console.log(`\n--- Day ${day.dayNumber} ---`);
    if (day.questionId) {
      const q = await Question.findById(day.questionId).lean();
      console.log(`  Main question: ${day.questionId} -> ${q ? q.title : 'NOT FOUND!'}`);
    }
    if (day.tasks && day.tasks.length) {
      for (const t of day.tasks) {
        const q = await Question.findById(t.questionId).lean();
        console.log(`  Task (${t.taskType}): ${t.questionId} -> ${q ? q.title : 'NOT FOUND!'}`);
      }
    }
  }

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
