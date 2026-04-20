import mongoose from "mongoose";
import Resource from "../models/Resource.js";

const RESOURCE_CATEGORIES = ["Courses", "Important Topics", "Resume Templates"];

export const listUserResources = async (req, res) => {
  try {
    const category = String(req.query.category || "").trim();
    const query = {};

    if (category) {
      if (!RESOURCE_CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid resource category.",
        });
      }
      query.category = category;
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: resources });
  } catch (error) {
    console.error("listUserResources error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch resources." });
  }
};

export const recordUserResourceView = async (req, res) => {
  try {
    const { resourceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ success: false, message: "Invalid resourceId." });
    }

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }

    return res.status(200).json({ success: true, data: resource });
  } catch (error) {
    console.error("recordUserResourceView error:", error);
    return res.status(500).json({ success: false, message: "Failed to record resource view." });
  }
};
