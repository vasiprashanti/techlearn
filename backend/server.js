import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { insertJavaMarkdownContent } from "./config/insertJavaMarkdown.js";
import { insertPythonMarkdownContent } from "./config/insertPythonMarkdown.js";

// Route imports
import exerciseRoutes from './routes/exerciseRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userProgressRoutes from './routes/userProgressRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import certificationRoutes from './routes/certificationRoutes.js';
import compilerRoutes from './routes/compilerRoutes.js';
import xpRoutes from './routes/xpRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import dashboardProjectRoutes from './routes/dashboardProjectRoutes.js';

import miniRouter from "./routes/mini.js";
import majorRouter from "./routes/major.js";
import bookingRouterModule from "./routes/Booking.js";
const bookingRouter = bookingRouterModule.default || bookingRouterModule;
import projectRouter from "./routes/Project.js";
import midProjectRoutes from "./routes/midProjectRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import uiLibraryRoutes from "./routes/uiLibraryRoutes.js";

dotenv.config();
const app = express();

// 🧠 MongoDB Connection
await connectDB();

// Seed courses with markdown content
await insertJavaMarkdownContent();
await insertPythonMarkdownContent();

// 🌐 CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const devOrigins = ["http://localhost:3000", "http://localhost:5173"];
    if (devOrigins.includes(origin)) return callback(null, true);

    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
      return callback(null, true);

    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Extra headers for older setups or vercel
// ...existing code...

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🖼️ Static files (Core Java images)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/CoreJava_Images",
  express.static(
    path.join(__dirname, "markdown-content/CoreJava/CoreJava_Images")
  )
);


app.get('/', (req, res) => {
  res.send('Techlearn Backend API is running!');
});

// ✅ AUTH + LEARN Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user-progress', userProgressRoutes);
app.use('/api/certificate', paymentRoutes);
app.use('/api/certification', certificationRoutes);
app.use('/api/compiler', compilerRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', dashboardProjectRoutes);

// ✅ BUILD PAGE Routes
app.use("/api/mini-projects", miniRouter);
app.use("/api/major-projects", majorRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/projects", projectRouter);
app.use("/api/mid-projects", midProjectRoutes);
app.use("/api/transactions", transactionRoutes);
app.use(uiLibraryRoutes); // Handles its own path

// 🧪 Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    cors: "enabled",
    env: process.env.NODE_ENV || "development",
  });
});
// 🛑 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint not found",
    path: req.path,
    method: req.method,
    availableRoutes: [
      "/api/exercises",
      "/api/courses",
      "/api/users",
      "/api/auth",
      "/api/user-progress",
      "/api/certificate",
      "/api/certification",
      "/api/compiler",
      "/api/xp",
      "/api/dashboard",
      "/api/mini-projects",
      "/api/major-projects",
      "/api/bookings",
      "/api/projects",
      "/api/mid-projects",
      "/api/transactions",
      "/health",
    ],
  });
});

// ❌ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  res.status(err.status || 500).json({
    message: err.message || "Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 CORS: Dynamic origin matching enabled`);
});
