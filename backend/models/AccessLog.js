import mongoose from "mongoose";

const accessLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  timestamp: { type: Date, default: Date.now },
});

const AccessLog = mongoose.model("AccessLog", accessLogSchema);
export default AccessLog;
