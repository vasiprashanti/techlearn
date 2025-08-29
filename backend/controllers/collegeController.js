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

    // Search for coding rounds if model exists
    let allCodingRounds = [];
    try {
      const CodingRound = (await import("../models/CodingRound.js")).default;
      allCodingRounds = await CodingRound.find({
        college: new RegExp(`^${collegeName}$`, "i"),
      });
    } catch (err) {
      console.log("CodingRound model error:", err.message);
      allCodingRounds = [];
    }

    // If no MCQs AND no coding rounds found, return not found
    if (
      (!allMcqs || allMcqs.length === 0) &&
      (!allCodingRounds || allCodingRounds.length === 0)
    ) {
      return res.status(404).json({
        success: false,
        message: `No tests found for college: "${collegeName}"`,
        foundMcqs: 0,
        foundCodingRounds: 0,
      });
    }

    // Return summary details for MCQs (no questions)
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
      type: "mcq",
    }));

    // Return summary details for coding rounds (no problems)
    const allCodingRoundDetails = allCodingRounds.map((round) => ({
      _id: round._id,
      title: round.title,
      college: round.college,
      date: round.date,
      duration: round.duration,
      isActive: round.isActive,
      linkId: round.linkId,
      totalAttempts: round.totalAttempts,
      createdAt: round.createdAt,
      updatedAt: round.updatedAt,
      type: "coding",
    }));

    return res.status(200).json({
      success: true,
      college: collegeName,
      totalTests: allMcqDetails.length + allCodingRoundDetails.length,
      mcqs: allMcqDetails,
      codingRounds: allCodingRoundDetails,
    });
  } catch (error) {
    console.error("Error fetching college by name:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
