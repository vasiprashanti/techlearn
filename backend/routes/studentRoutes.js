import express from "express";
import multer from "multer";
import { bulkUploadStudents, individualUploadStudent } from "../controllers/studentController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Memory storage keeps the file in memory as a Buffer via req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// Admin Route: Bulk upload students
router.post("/bulk-upload", protect, isAdmin, upload.single("file"), bulkUploadStudents);

// Admin Route: Upload individual student
router.post("/upload", protect, isAdmin, individualUploadStudent);

export default router;
