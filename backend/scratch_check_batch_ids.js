import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import TrackTemplate from './models/TrackTemplate.js';

dotenv.config();

async function run() {
  await connectDB();
  const template = await TrackTemplate.findOne({ name: /JFS QUIZ 2/i }).lean();
  if (!template) {
    console.log("No track template found matching 'JFS QUIZ 2'");
    mongoose.disconnect();
    return;
  }

  for (const day of template.dayAssignments || []) {
    console.log(`Day ${day.dayNumber}:`);
    for (const t of day.tasks || []) {
      console.log(`  Task question: ${t.questionId}, batchId: ${t.batchId}, status: ${t.status}`);
    }
  }

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
