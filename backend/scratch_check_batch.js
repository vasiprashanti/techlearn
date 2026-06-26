import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Batch from './models/Batch.js';

dotenv.config();

async function run() {
  await connectDB();
  const batch = await Batch.findById("6a3559d10577423c431591b8").lean();
  if (batch) {
    console.log("Batch Name:", batch.name);
    console.log("Batch assignedDailyTaskTrack:", batch.assignedDailyTaskTrack);
  } else {
    console.log("No batch found with ID 6a3559d10577423c431591b8");
  }
  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
