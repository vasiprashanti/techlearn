import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  message: String,
  level: String,
  timestamp: { type: Date, default: Date.now },
});

const Log = mongoose.model("Log", logSchema);
export default Log;
