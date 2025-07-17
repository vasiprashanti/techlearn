import mongoose from "mongoose";

const midProjectSchema = new mongoose.Schema({
  title: String,
  image: String,
  languages: [String],
  guideSteps: [String],
  clubOnly: Boolean,
});

const MidProject = mongoose.model("MidProject", midProjectSchema);
export default MidProject;
