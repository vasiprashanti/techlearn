import mongoose from "mongoose";

const majorProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  tech: String,
  duration: String,
  image: String,
  trainer: Boolean,
  languages: [String],
  guideSteps: [String],
});

const MajorProject = mongoose.model("MajorProject", majorProjectSchema);
export default MajorProject;
