import { parse } from "csv-parse";
import Batch from "../models/Batch.js";
import College from "../models/College.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

const normalizeHeader = (value = "") => String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const buildHeaderLookup = (headers = []) => {
  const map = new Map();
  headers.forEach((header, index) => {
    map.set(normalizeHeader(header), index);
  });
  return map;
};

const getRowValue = (row, headerLookup, aliases = []) => {
  for (const alias of aliases) {
    const index = headerLookup.get(normalizeHeader(alias));
    if (index !== undefined) {
      return String(row[index] || "").trim();
    }
  }
  return "";
};

const buildDerivedEmail = ({ email, rollNo, name, rowNumber }) => {
  if (email) return email.trim().toLowerCase();

  const slug = String(rollNo || name || `student-${rowNumber}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");

  return `${slug || `student.${rowNumber}`}@import.techlearn.local`;
};

const parseCsvFile = async (buffer) => {
  const rows = [];
  const parser = parse(buffer, {
    bom: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  });

  for await (const row of parser) {
    rows.push(row);
  }

  return rows;
};

const validateCollegeAndBatch = async ({ collegeId, batchId }) => {
  const [college, batch] = await Promise.all([College.findById(collegeId).lean(), Batch.findById(batchId).lean()]);

  if (!college) {
    return { error: { status: 404, message: "College not found." } };
  }

  if (!batch) {
    return { error: { status: 404, message: "Batch not found." } };
  }

  if (String(batch.collegeId) !== String(collegeId)) {
    return { error: { status: 400, message: "Selected batch does not belong to the selected college." } };
  }

  return { college, batch };
};

export const bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file uploaded." });
    }

    const { collegeId, batchId, primaryTrack, status } = req.body;
    if (!collegeId || !batchId) {
      return res.status(400).json({
        success: false,
        message: "College ID and Batch ID are required in the request body.",
      });
    }

    const validation = await validateCollegeAndBatch({ collegeId, batchId });
    if (validation.error) {
      return res.status(validation.error.status).json({ success: false, message: validation.error.message });
    }

    const csvRows = await parseCsvFile(req.file.buffer);
    if (csvRows.length < 2) {
      return res.status(400).json({
        success: false,
        message: "CSV must include a header row and at least one student row.",
      });
    }

    const [headerRow, ...dataRows] = csvRows;
    const headerLookup = buildHeaderLookup(headerRow);
    const requestedTrack = String(primaryTrack || "").trim() || "General Track";
    const requestedStatus = String(status || "").trim() || "Active";

    const preparedRows = [];
    const failedRows = [];
    const seenEmails = new Set();

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      const rowNumber = index + 2;

      const rawName = getRowValue(row, headerLookup, ["name", "studentname"]);
      const rawEmail = getRowValue(row, headerLookup, ["email", "studentemail"]);
      const rawRollNo = getRowValue(row, headerLookup, [
        "rollno",
        "rollnumber",
        "registrationnumber",
        "registrationno",
        "regno",
      ]);
      const rowTrack = getRowValue(row, headerLookup, ["track", "primarytrack"]);
      const rowStatus = getRowValue(row, headerLookup, ["status"]);

      const hasAnyIdentifier = Boolean(rawName || rawEmail || rawRollNo);
      if (!hasAnyIdentifier) {
        const isBlankRow = row.every((cell) => !String(cell || "").trim());
        if (isBlankRow) continue;
        failedRows.push({ row: rowNumber, reason: "Provide at least one of name, email, or roll number." });
        continue;
      }

      const resolvedName =
        rawName ||
        (rawEmail.includes("@") ? rawEmail.split("@")[0].replace(/[._-]+/g, " ").trim() : "") ||
        (rawRollNo ? `Student ${rawRollNo}` : "");

      if (!resolvedName) {
        failedRows.push({ row: rowNumber, reason: "Could not derive a valid student name." });
        continue;
      }

      const resolvedEmail = buildDerivedEmail({
        email: rawEmail,
        rollNo: rawRollNo,
        name: resolvedName,
        rowNumber,
      });

      if (seenEmails.has(resolvedEmail)) {
        failedRows.push({ row: rowNumber, reason: "Duplicate email found within the CSV file." });
        continue;
      }

      seenEmails.add(resolvedEmail);
      preparedRows.push({
        row: rowNumber,
        name: resolvedName,
        email: resolvedEmail,
        rollNo: rawRollNo,
        primaryTrack: rowTrack || requestedTrack,
        status: rowStatus || requestedStatus,
      });
    }

    if (preparedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid student records found to insert.",
        data: {
          totalRows: dataRows.length,
          imported: 0,
          failed: failedRows.length,
          failedRows,
        },
      });
    }

    const existingStudents = await Student.find({
      email: { $in: preparedRows.map((entry) => entry.email) },
    })
      .select("email")
      .lean();
    const existingEmailSet = new Set(existingStudents.map((student) => String(student.email).trim().toLowerCase()));

    const linkedUsers = await User.find({
      email: { $in: preparedRows.map((entry) => entry.email) },
    })
      .select("_id email")
      .lean();
    const linkedUserMap = new Map(linkedUsers.map((user) => [String(user.email).trim().toLowerCase(), user._id]));

    const insertDocs = [];
    for (const entry of preparedRows) {
      if (existingEmailSet.has(entry.email)) {
        failedRows.push({ row: entry.row, reason: "A student with this email already exists." });
        continue;
      }

      insertDocs.push({
        collegeId,
        batchId,
        userId: linkedUserMap.get(entry.email) || null,
        name: entry.name,
        email: entry.email,
        rollNo: entry.rollNo,
        primaryTrack: entry.primaryTrack,
        status: entry.status,
        streak: 0,
        longestStreak: 0,
      });
    }

    const insertedStudents = insertDocs.length > 0 ? await Student.insertMany(insertDocs, { ordered: false }) : [];

    return res.status(200).json({
      success: true,
      message: "CSV processing complete.",
      data: {
        totalRows: dataRows.length,
        imported: insertedStudents.length,
        failed: failedRows.length,
        failedRows,
      },
    });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during CSV upload.",
      error: error.message,
    });
  }
};

export const individualUploadStudent = async (req, res) => {
  try {
    const { name, email, rollNo, collegeId, batchId, primaryTrack, status } = req.body;

    if (!name || !email || !collegeId || !batchId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, college ID, and batch ID are required.",
      });
    }

    const validation = await validateCollegeAndBatch({ collegeId, batchId });
    if (validation.error) {
      return res.status(validation.error.status).json({ success: false, message: validation.error.message });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const existingStudent = await Student.findOne({ email: sanitizedEmail }).lean();
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists.",
      });
    }

    const linkedUser = await User.findOne({ email: sanitizedEmail }).select("_id").lean();
    const student = await Student.create({
      collegeId,
      batchId,
      userId: linkedUser?._id || null,
      name: name.trim(),
      email: sanitizedEmail,
      rollNo: rollNo?.trim() || "",
      primaryTrack: primaryTrack?.trim() || "General Track",
      status: status || "Active",
      streak: 0,
      longestStreak: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Student uploaded successfully.",
      student,
    });
  } catch (error) {
    console.error("Individual Student Upload Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during individual student upload.",
      error: error.message,
    });
  }
};
