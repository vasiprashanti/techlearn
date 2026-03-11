import { parse } from "csv-parse";
import Student from "../models/Student.js";
import College from "../models/College.js";
import Batch from "../models/Batch.js";

/**
 * Bulk upload students via CSV
 * Expected columns: Name, Email, Roll No, College ID, Batch ID
 */
export const bulkUploadStudents = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No CSV file uploaded." });
        }

        const { collegeId, batchId } = req.body;

        if (!collegeId || !batchId) {
            return res.status(400).json({ message: "College ID and Batch ID are required in the request body." });
        }

        // Verify college and batch exist to prevent orphaned students
        const [collegeExists, batchExists] = await Promise.all([
            College.findById(collegeId),
            Batch.findById(batchId),
        ]);

        if (!collegeExists) return res.status(404).json({ message: "College not found." });
        if (!batchExists) return res.status(404).json({ message: "Batch not found." });


        const fileBuffer = req.file.buffer;
        const records = [];
        const failedRows = [];
        let totalRows = 0;

        // Parse the CSV buffer
        const parser = parse(fileBuffer, {
            columns: true, // Treat first row as header keys
            skip_empty_lines: true,
            trim: true,
        });

        for await (const row of parser) {
            totalRows++;

            const rawName = row["Name"];
            const rawEmail = row["Email"];
            const rawRollNo = row["Roll No"];

            // Validate required CSV fields
            if (!rawName || !rawEmail || !rawRollNo) {
                failedRows.push({
                    row: totalRows,
                    data: row,
                    reason: "Missing required fields (Name, Email, or Roll No)",
                });
                continue;
            }

            // Sanitize Data
            const name = rawName.trim();
            const email = rawEmail.trim().toLowerCase();
            const rollNo = rawRollNo.trim();

            // Check for duplicate emails within the upload batch itself to avoid insertMany failures
            const isDuplicateInBatch = records.some(r => r.email === email);
            if (isDuplicateInBatch) {
                failedRows.push({
                    row: totalRows,
                    data: row,
                    reason: "Duplicate email found within the CSV file.",
                });
                continue;
            }

            records.push({
                collegeId,
                batchId,
                name,
                email,
                rollNo,
                status: "Active",
                streak: 0,
                longestStreak: 0
            });
        }

        if (records.length === 0) {
            return res.status(400).json({
                message: "No valid student records found to insert.",
                totalRows,
                uploads: 0,
                failedRows,
            });
        }

        // Perform bulk insert
        // { ordered: false } allows the insertion to continue even if some documents error (e.g. duplicate email in DB)
        const result = await Student.insertMany(records, { ordered: false }).catch(err => {
            // If ordered: false is used, a BulkWriteError is thrown containing the successes and failures.
            if (err.name === 'BulkWriteError') {
                // Map DB duplicate errors back into failedRows
                err.writeErrors.forEach(writeError => {
                    const failedRecord = records[writeError.index];
                    failedRows.push({
                        row: "DB Insert",
                        data: failedRecord,
                        reason: writeError.errmsg
                    });
                });
                return err.insertedDocs; // Return the successfully inserted docs to continue
            }
            throw err;
        });

        const successfulUploads = Array.isArray(result) ? result.length : 0;

        return res.status(200).json({
            message: "CSV processing complete.",
            totalRows,
            uploads: successfulUploads,
            failedRows,
        });

    } catch (error) {
        console.error("Bulk Upload Error:", error);
        return res.status(500).json({ message: "Server error during CSV upload.", error: error.message });
    }
};
