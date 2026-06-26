import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import TrackTemplate from './models/TrackTemplate.js';

dotenv.config();

async function run() {
  await connectDB();
  const templates = await TrackTemplate.find({});
  console.log(`Found ${templates.length} templates. Checking for tasks with non-null batchId...`);

  let totalUpdated = 0;
  for (const template of templates) {
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
      console.log(`Cleared batchId for ${updatedCount} tasks in template: ${template.name}`);
      totalUpdated += updatedCount;
    }
  }

  console.log(`Finished! Total tasks cleared: ${totalUpdated}`);
  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
