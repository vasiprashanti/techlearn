import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import TrackTemplate from './models/TrackTemplate.js';

dotenv.config();

async function run() {
  await connectDB();
  const template = await TrackTemplate.findOne({ name: /JFS QUIZ 2/i });
  if (!template) {
    console.log("No track template found matching 'JFS QUIZ 2'");
    mongoose.disconnect();
    return;
  }

  console.log("Found template. Updating tasks batchId to null...");
  let updatedCount = 0;
  for (const day of template.dayAssignments || []) {
    for (const t of day.tasks || []) {
      if (t.batchId) {
        t.batchId = null;
        updatedCount++;
      }
    }
  }

  if (updatedCount > 0) {
    template.markModified('dayAssignments');
    await template.save();
    console.log(`Successfully cleared batchId for ${updatedCount} tasks in JFS QUIZ 2.`);
  } else {
    console.log("No tasks had batchId set.");
  }

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
