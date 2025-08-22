import CollegeMcq from "../models/CollegeMcq.js";

// Public: Get college details and test rounds by name
export const getCollegeByName = async (req, res) => {
  try {
    const { collegeName } = req.params;
    if (!collegeName || typeof collegeName !== "string") {
      return res.status(400).json({
        success: false,
        message: "College name is required",
      });
    }
    // Search directly in CollegeMcq collection for MCQs by college name
    const allMcqs = await CollegeMcq.find({
      college: new RegExp(`^${collegeName}$`, "i"),
    });

    // Optionally, search for coding rounds if model exists
    let allCodingRounds = [];
    try {
      const CodingRound = (await import("../models/CodingRound.js")).default;
      allCodingRounds = await CodingRound.find({
        college: new RegExp(`^${collegeName}$`, "i"),
      });
    } catch (err) {
      allCodingRounds = [];
    }

    // If no MCQs found, treat as not found
    if (!allMcqs || allMcqs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No MCQs found for this college",
      });
    }

    // Return only summary details for each MCQ (no questions)
    const allMcqDetails = allMcqs.map((mcq) => ({
      _id: mcq._id,
      title: mcq.title,
      college: mcq.college,
      date: mcq.date,
      duration: mcq.duration,
      isActive: mcq.isActive,
      linkId: mcq.linkId,
      totalAttempts: mcq.totalAttempts,
      createdAt: mcq.createdAt,
      updatedAt: mcq.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      allMcqs: allMcqDetails,
      allCodingRounds,
    });
  } catch (error) {
    console.error("Error fetching college by name:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
