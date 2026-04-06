import { connectDB } from "./config/db.js";
import MidProjectModel from "./models/MidProject.js";
import Course from "./models/Course.js";
import Topic from "./models/Topic.js";

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

const seedCourses = async () => {
  const courseCount = await Course.countDocuments();
  if (courseCount > 0) {
    console.log("Courses already exist, skipping seed.");
    return;
  }

  // Create sample courses
  const courses = [
    {
      title: "Java Programming",
      description: "Learn Java from basics to advanced concepts",
      level: "Beginner",
      numTopics: 3,
      topicIds: [],
      exerciseIds: [],
    },
    {
      title: "Python Programming",
      description: "Master Python for web development and data science",
      level: "Beginner",
      numTopics: 3,
      topicIds: [],
      exerciseIds: [],
    },
    {
      title: "Data Structures & Algorithms",
      description: "Essential DSA concepts for coding interviews",
      level: "Intermediate",
      numTopics: 3,
      topicIds: [],
      exerciseIds: [],
    },
    {
      title: "MySQL Database",
      description: "Learn database design and SQL queries",
      level: "Beginner",
      numTopics: 3,
      topicIds: [],
      exerciseIds: [],
    },
  ];

  const createdCourses = await Course.insertMany(courses);
  console.log(`${createdCourses.length} courses inserted`);

  // Create topics for each course
  for (const course of createdCourses) {
    const topics = [
      {
        courseId: course._id,
        title: `${course.title} Basics`,
        slug: `${course.title.toLowerCase().replace(/\s+/g, "-")}-basics`,
        index: 1,
      },
      {
        courseId: course._id,
        title: `${course.title} Advanced`,
        slug: `${course.title.toLowerCase().replace(/\s+/g, "-")}-advanced`,
        index: 2,
      },
      {
        courseId: course._id,
        title: `${course.title} Project`,
        slug: `${course.title.toLowerCase().replace(/\s+/g, "-")}-project`,
        index: 3,
      },
    ];

    const createdTopics = await Topic.insertMany(topics);
    
    // Update course with topic IDs
    course.topicIds = createdTopics.map(t => t._id);
    await course.save();
  }

  console.log("Topics created and linked to courses");
};

await connectDB();

// Clear existing data
await Course.deleteMany({});
await Topic.deleteMany({});
console.log("Cleared existing courses and topics");

try {
  await seedSampleProjects();
  await seedCourses();
  console.log("✅ Seeding completed successfully");
  process.exit(0);
} catch (err) {
  console.error("Seeding failed:", err);
  process.exit(1);
}
