import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import TrackTemplate from './models/TrackTemplate.js';
import Category from './models/Category.js'; // Register model
import { validateTrackTemplateQuestionAssignment } from './utils/trackTemplateValidation.js';

dotenv.config();

async function run() {
  await connectDB();
  const template = await TrackTemplate.findOne({ name: /JFS QUIZ 2/i }).lean();
  if (!template) {
    console.log("No track template found matching 'JFS QUIZ 2'");
    mongoose.disconnect();
    return;
  }

  console.log("Template Name:", template.name);
  console.log("Template Category:", template.category);

  const day3 = (template.dayAssignments || []).find(d => d.dayNumber === 3);
  if (!day3 || !day3.tasks || !day3.tasks.length) {
    console.log("No tasks on day 3");
    mongoose.disconnect();
    return;
  }

  const firstTask = day3.tasks[0];
  console.log("Testing validation for first task of Day 3:", firstTask);
  const result = await validateTrackTemplateQuestionAssignment({
    templateId: template._id,
    dayNumber: 3,
    questionId: firstTask.questionId,
    allowOverwrite: true
  });
  console.log("Validation Result:", result);

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
