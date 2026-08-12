import mongoose from "mongoose";
import Student from "../models/Student.js";
import StudentTrackAssignment from "../models/StudentTrackAssignment.js";
import TrackTemplate from "../models/TrackTemplate.js";
import Testimonial from "../models/Testimonial.js";
export const submitTestimonial = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rating, testimonial } = req.body;
    // 1. Validate rating
    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }
    if (Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }
    // 2. Validate testimonial
    if (!testimonial || !testimonial.trim()) {
      return res.status(400).json({
        success: false,
        message: "Testimonial is required",
      });
    }
    // 3. Find student using logged-in user's ID
    const student = await Student.findOne({
  $or: [
    { userId: userId },
    { email: req.user.email },
  ],
});
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    // 4. Find active track assignment
    const assignment = await StudentTrackAssignment.findOne({
      studentId: student._id,
      status: "Active",
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Active program assignment not found",
      });
    }
    // 5. Find track template
    const trackTemplate = await TrackTemplate.findById(
      assignment.trackTemplateId
    );
    if (!trackTemplate) {
      return res.status(404).json({
        success: false,
        message: "Track template not found",
      });
    }
    // 6. Calculate last day
    const startDate = new Date(assignment.activatedAt);
    const lastDay = new Date(startDate);
    lastDay.setDate(lastDay.getDate() + trackTemplate.totalDays - 1);
    // Compare only dates, not time
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const lastDayDate = new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate()
    );
    // 7. Check if today is the last day
    if (todayDate.getTime() !== lastDayDate.getTime()) {
      return res.status(403).json({
        success: false,
        message: "Testimonial can only be submitted on the last day of the program",
      });
    }
    // 8. Check if testimonial already exists
    const existingTestimonial = await Testimonial.findOne({
      studentId: student._id,
      programId: student.programId,
    });
    if (existingTestimonial) {
      return res.status(409).json({
        success: false,
        message: "Testimonial has already been submitted",
      });
    }
    // 9. Save testimonial
    const newTestimonial = await Testimonial.create({
      studentId: student._id,
      programId: student.programId,
      rating: Number(rating),
      testimonial: testimonial.trim(),
    });
    return res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully",
      data: newTestimonial,
    });
  } catch (error) {
    console.error("Submit Testimonial Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit testimonial",
    });
  }
};
export const getTestimonialStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find student
    const student = await Student.findOne({
  $or: [
    { userId: userId },
    { email: req.user.email },
  ],
});

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Find active track assignment
    const assignment = await StudentTrackAssignment.findOne({
      studentId: student._id,
      status: "Active",
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Active program assignment not found",
      });
    }

    // Find track template
    const trackTemplate = await TrackTemplate.findById(
      assignment.trackTemplateId
    );

    if (!trackTemplate) {
      return res.status(404).json({
        success: false,
        message: "Track template not found",
      });
    }

    // Calculate last day
    const startDate = new Date(assignment.activatedAt);

    const lastDay = new Date(startDate);
    lastDay.setDate(lastDay.getDate() + trackTemplate.totalDays - 1);

    // Compare only dates
    const today = new Date();

    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const lastDayDate = new Date(
      lastDay.getFullYear(),
      lastDay.getMonth(),
      lastDay.getDate()
    );

    const isLastDay =
      todayDate.getTime() === lastDayDate.getTime();

    // Check if testimonial already submitted
    const existingTestimonial = await Testimonial.findOne({
      studentId: student._id,
      programId: student.programId,
    });

    return res.status(200).json({
      success: true,
      eligible: isLastDay && !existingTestimonial,
      isLastDay,
      alreadySubmitted: !!existingTestimonial,
      lastDay: lastDayDate,
    });
  } catch (error) {
    console.error("Get Testimonial Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check testimonial status",
    });
  }
};