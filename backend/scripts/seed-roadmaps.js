import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Roadmap from "../models/Roadmap.js";
import Sequence from "../models/Sequence.js";

const starterRoadmaps = [
  {
    roadmapId: "RID-000001",
    title: "Frontend Developer Roadmap",
    targetRole: "Frontend Developer",
    duration: 6,
    durationUnit: "weeks",
    branches: ["CSE", "IT", "ECE"],
    description: "A structured roadmap to build accessible, responsive, job-ready frontend products.",
    markdownBody: "# Frontend Developer Roadmap\n\n## Foundations\n\nLearn semantic HTML, modern CSS, JavaScript, and browser fundamentals.\n\n## React and UI\n\nBuild reusable React components, manage state, and create responsive interfaces.\n\n## Portfolio project\n\nShip one polished project and prepare it for a technical walkthrough.",
  },
  {
    roadmapId: "RID-000002",
    title: "Backend Developer Roadmap",
    targetRole: "Backend Developer",
    duration: 8,
    durationUnit: "weeks",
    branches: ["CSE", "IT"],
    description: "Build the API, database, and systems skills needed for backend development.",
    markdownBody: "# Backend Developer Roadmap\n\n## Core services\n\nPractice HTTP, REST APIs, authentication, and error handling.\n\n## Data and persistence\n\nModel relational and document data, indexes, queries, and migrations.\n\n## Production readiness\n\nAdd testing, observability, security, and deployment to a capstone API.",
  },
  {
    roadmapId: "RID-000003",
    title: "Full Stack Developer Roadmap",
    targetRole: "Full Stack Developer",
    duration: 12,
    durationUnit: "weeks",
    branches: ["CSE", "IT", "ECE", "EEE"],
    description: "Connect frontend product thinking with reliable backend and deployment skills.",
    markdownBody: "# Full Stack Developer Roadmap\n\n## Product foundations\n\nTurn a problem into a small, testable product plan.\n\n## End-to-end build\n\nBuild a frontend, API, database, authentication, and background workflow.\n\n## Ship and explain\n\nDeploy the project and practise explaining the trade-offs in an interview.",
  },
  {
    roadmapId: "RID-000004",
    title: "AI / Machine Learning Roadmap",
    targetRole: "AI / Machine Learning Engineer",
    duration: 16,
    durationUnit: "weeks",
    branches: ["CSE", "IT", "ECE"],
    description: "A practical path from Python and statistics to production machine-learning systems.",
    markdownBody: "# AI / Machine Learning Roadmap\n\n## Mathematical tools\n\nRefresh Python, probability, statistics, and linear algebra.\n\n## Models\n\nTrain, evaluate, and improve supervised and unsupervised models.\n\n## Applied ML\n\nBuild a reproducible pipeline and serve a model behind a tested API.",
  },
  {
    roadmapId: "RID-000005",
    title: "Data Science Roadmap",
    targetRole: "Data Scientist",
    duration: 10,
    durationUnit: "weeks",
    branches: ["CSE", "IT", "ECE", "EEE"],
    description: "Learn to move from a messy dataset to a clear, defensible decision.",
    markdownBody: "# Data Science Roadmap\n\n## Ask the right question\n\nDefine a measurable outcome and understand the data-generating process.\n\n## Explore and model\n\nClean data, analyse patterns, build baselines, and validate results.\n\n## Communicate impact\n\nTell the story with a concise notebook, visualizations, and recommendations.",
  },
  {
    roadmapId: "RID-000006",
    title: "Generative AI Roadmap",
    targetRole: "Generative AI Engineer",
    duration: 8,
    durationUnit: "weeks",
    branches: ["CSE", "IT", "ECE"],
    description: "Build useful generative-AI applications with evaluation, retrieval, and safety in mind.",
    markdownBody: "# Generative AI Roadmap\n\n## Model foundations\n\nUnderstand tokens, context windows, embeddings, and model limitations.\n\n## Reliable applications\n\nBuild prompts, structured outputs, retrieval, tool use, and evaluation datasets.\n\n## Ship responsibly\n\nAdd guardrails, monitoring, cost controls, and a user-facing capstone.",
  },
];

const seed = async () => {
  await connectDB();

  for (const roadmap of starterRoadmaps) {
    const existing = await Roadmap.findOne({
      title: roadmap.title,
      targetRole: roadmap.targetRole,
    });

    if (existing) {
      Object.assign(existing, {
        ...roadmap,
        status: "Active",
        publishedAt: existing.publishedAt || new Date(),
      });
      await existing.save();
    } else {
      await Roadmap.create({
        ...roadmap,
        status: "Active",
        publishedAt: new Date(),
      });
    }
  }

  await Sequence.findOneAndUpdate(
    { _id: "roadmap" },
    { $max: { value: starterRoadmaps.length } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Seeded ${starterRoadmaps.length} active starter roadmaps.`);
};

seed()
  .catch((error) => {
    console.error("Roadmap seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
