import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Batch from './models/Batch.js';
import TrackTemplate from './models/TrackTemplate.js';
import Category from './models/Category.js'; // Register model
import StudentTrackAssignment from './models/StudentTrackAssignment.js';
import Student from './models/Student.js';
import Track from './models/Track.js';

dotenv.config();

async function run() {
  await connectDB();
  const template = await TrackTemplate.findOne({ name: /JFS QUIZ 2/i }).lean();
  const batch = await Batch.findOne({}).lean(); // find any batch
  
  if (!template || !batch) {
    console.log("Template or Batch not found");
    mongoose.disconnect();
    return;
  }

  console.log(`Simulating assignment of template ${template.name} to batch ${batch.name}`);
  
  const requestedTemplateId = template._id;
  const previousTrackTemplateId = batch.assignedTrackTemplate || null;
  const trackTemplateChanged = String(requestedTemplateId || "") !== String(previousTrackTemplateId || "");
  
  const getTrackTemplateForAssignment = async (templateId) => {
    if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) return null;
    return TrackTemplate.findOne({ _id: templateId, status: { $ne: "Archived" } }).lean();
  };

  const getBatchTemplateAssignmentFields = (trackTemplate, changed = true) => {
    if (!trackTemplate) {
      return {
        assignedTrackTemplate: null,
        assignedTrackTemplateAt: null,
        assignedDailyChallengeTrack: null,
        assignedDailyChallengeTrackAt: null,
        assignedDailyTaskTrack: null,
        assignedDailyTaskTrackAt: null,
      };
    }
    const assignedAt = changed ? new Date() : undefined;
    const fields = {
      assignedTrackTemplate: trackTemplate._id,
      ...(assignedAt ? { assignedTrackTemplateAt: assignedAt } : {}),
    };
    if (trackTemplate.trackType === "Daily Task") {
      fields.assignedDailyTaskTrack = trackTemplate._id;
      if (assignedAt) fields.assignedDailyTaskTrackAt = assignedAt;
    }
    if (trackTemplate.trackType === "Daily Challenge") {
      fields.assignedDailyChallengeTrack = trackTemplate._id;
      if (assignedAt) fields.assignedDailyChallengeTrackAt = assignedAt;
    }
    return fields;
  };

  const trackTemplate = await getTrackTemplateForAssignment(requestedTemplateId);

  const update = {
    name: batch.name,
    startDate: batch.startDate,
    expiryDate: batch.expiryDate,
    assignedTrack: trackTemplate?.category || batch.assignedTrack || "",
    ...getBatchTemplateAssignmentFields(trackTemplate, true),
    batchSize: batch.batchSize,
    releaseTime: batch.releaseTime || "00:00",
    status: batch.status,
  };

  console.log("Fields to update:", update);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const updatedBatch = await Batch.findByIdAndUpdate(
        batch._id,
        { $set: update },
        { new: true, runValidators: true, session }
      );
      console.log("Batch updated successfully in transaction");
      
      const students = await Student.find({ batchId: batch._id }).select("_id").session(session).lean();
      console.log(`Found ${students.length} students in batch`);
    });
    console.log("Transaction succeeded!");
  } catch (error) {
    console.error("Transaction failed with error:", error);
  } finally {
    await session.endSession();
  }

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
