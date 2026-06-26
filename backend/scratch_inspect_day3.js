import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import TrackTemplate from './models/TrackTemplate.js';
import Question from './models/Questions.js';

dotenv.config();

async function run() {
  await connectDB();
  const template = await TrackTemplate.findOne({ name: /JFS QUIZ 2/i }).lean();
  if (!template) {
    console.log("No track template found matching 'JFS QUIZ 2'");
    mongoose.disconnect();
    return;
  }

  const day3 = (template.dayAssignments || []).find(d => d.dayNumber === 3);
  if (!day3) {
    console.log("Day 3 not found in template");
    mongoose.disconnect();
    return;
  }

  console.log("Day 3 questions:");
  for (const t of day3.tasks || []) {
    const q = await Question.findById(t.questionId).select('+content.correctOption').lean();
    console.log(`Question ID: ${t.questionId}`);
    if (q) {
      console.log(`  Title: ${q.title}`);
      console.log(`  isActive: ${q.isActive}`);
      console.log(`  status: ${q.status}`);
      console.log(`  categoryType: ${q.categoryType}`);
      console.log(`  options: ${JSON.stringify(q.content?.options)}`);
      console.log(`  correctOption: ${q.content?.correctOption}`);
    } else {
      console.log(`  NOT FOUND!`);
    }
  }

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
