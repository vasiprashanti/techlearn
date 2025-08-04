import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.VERCEL ? "/tmp" : "uploads/temp";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
 limits: {
  fileSize: 30 * 1024 * 1024, // 30 MB per file
  files: 100,                 
},
  fileFilter: (req, file, cb) => {
    // Accept all files
    cb(null, true);
  },
});

export default upload;
