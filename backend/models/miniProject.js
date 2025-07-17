import mongoose from "mongoose";

const miniProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  languages: [String],
  guideSteps: [String],
  clubOnly: Boolean,
});

const MiniProject = mongoose.model("MiniProject", miniProjectSchema);
export default MiniProject;
