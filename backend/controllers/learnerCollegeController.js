import College from "../models/College.js";
import {
  FUZZY_MATCH_THRESHOLD,
  collegeSimilarity,
  normalizeCollegeName,
  tidyCollegeName,
} from "../utils/collegeName.js";

const DEMO_COLLEGE_NAME = "Public Demo College";
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publicCollege = (college) => ({
  id: String(college._id),
  name: college.name,
  city: college.city || "",
});

const listSelectableColleges = () =>
  College.find({ status: "Active", name: { $ne: DEMO_COLLEGE_NAME } })
    .select("name city")
    .lean();

/** GET /api/colleges/search?q= - existing colleges a learner can pick from. */
export const searchColleges = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 80);
    const filter = { status: "Active", name: { $ne: DEMO_COLLEGE_NAME } };
    if (q) filter.name = { $regex: escapeRegex(q), $options: "i", $ne: DEMO_COLLEGE_NAME };
    const colleges = await College.find(filter).select("name city").sort({ name: 1 }).limit(15).lean();
    return res.json({ success: true, colleges: colleges.map(publicCollege) });
  } catch (error) {
    console.error("College search error:", error);
    return res.status(500).json({ success: false, message: "Could not load colleges." });
  }
};

/**
 * POST /api/colleges/resolve
 * Body: { name, confirmNew? }
 * - exact match after normalization -> returns the existing college
 * - close match -> returns it as a suggestion (no duplicate is created)
 * - no match (or the learner confirmed) -> adds the college to the list
 * The college is NOT linked to a profile here; saving the profile does that.
 */
export const resolveCollege = async (req, res) => {
  try {
    const rawName = String(req.body?.name || "");
    const name = tidyCollegeName(rawName);
    if (name.length < 3 || name.length > 120 || !/[a-zA-Z]/.test(name)) {
      return res.status(400).json({ success: false, message: "Enter a valid college name (3-120 characters)." });
    }

    const colleges = await listSelectableColleges();
    const wanted = normalizeCollegeName(name);

    const exact = colleges.find((college) => normalizeCollegeName(college.name) === wanted);
    if (exact) {
      return res.json({ success: true, action: "existing", college: publicCollege(exact) });
    }

    let best = null;
    let bestScore = 0;
    for (const college of colleges) {
      const score = collegeSimilarity(college.name, name);
      if (score > bestScore) {
        best = college;
        bestScore = score;
      }
    }
    if (best && bestScore >= FUZZY_MATCH_THRESHOLD && !req.body?.confirmNew) {
      return res.json({ success: true, action: "suggest", college: publicCollege(best), input: name });
    }

    try {
      const created = await College.create({ name });
      return res.status(201).json({ success: true, action: "created", college: publicCollege(created) });
    } catch (error) {
      if (error?.code === 11000) {
        const existing = await College.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") }).lean();
        if (existing) return res.json({ success: true, action: "existing", college: publicCollege(existing) });
      }
      throw error;
    }
  } catch (error) {
    console.error("College resolve error:", error);
    return res.status(500).json({ success: false, message: "Could not save the college. Please try again." });
  }
};
