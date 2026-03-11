import express from "express";
import multer from "multer";
import { bulkUploadStudents } from "../controllers/studentController.js";

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
// TODO: Add authenticateAdmin middleware once authentication is implemented according to TRD Section 3
router.post("/bulk-upload", upload.single("file"), bulkUploadStudents);

export default router;
