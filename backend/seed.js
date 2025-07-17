const DBconnect = require("./config/db");
const MidProjectModel = require("./models/MidProject");

const seedSampleProjects = async () => {
  const sampleProjects = [
    {
      title: "Simple Calculator",
      image: "calculator.png",
      languages: ["HTML", "CSS", "JavaScript"],
      guideSteps: [
        "Design the calculator layout in HTML and CSS.",
        "Implement basic arithmetic operations using JavaScript.",
        "Add event listeners for button clicks.",
      ],
      clubOnly: false,
    },
    {
      title: "To-Do List App",
      image: "todo-list.png",
      languages: ["React", "Node.js", "MongoDB"],
      guideSteps: [
        "Set up a React frontend.",
        "Create a Node.js backend with Express.",
        "Connect to a MongoDB database.",
        "Implement CRUD operations for tasks.",
      ],
      clubOnly: true,
    },
    {
      title: "Basic Blog Platform",
      image: "blog.png",
      languages: ["Python", "Flask", "SQLite"],
      guideSteps: [
        "Set up a Flask application.",
        "Design the database schema for posts and users.",
        "Implement user authentication.",
        "Create views for creating, reading, updating, and deleting posts.",
      ],
      clubOnly: false,
    },
  ];

  const count = await MidProjectModel.countDocuments();
  if (count === 0) {
    await MidProjectModel.insertMany(sampleProjects);
    console.log("Sample mid projects inserted");
  } else {
    console.log("Mid projects already exist, skipping seed.");
  }
};

DBconnect();

seedSampleProjects()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
