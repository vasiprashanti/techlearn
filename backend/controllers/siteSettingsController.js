import SiteSetting from "../models/SiteSetting.js";

export const DEFAULT_HOMEPAGE_PRICING = [
  {
    key: "skill",
    title: "SKILL PROGRAM",
    badge: "BEGINNER FRIENDLY",
    price: 399,
    priceLabel: "one-time",
    buttonText: "START LEARNING",
    description:
      "Pick a skill and build real ability through structured learning, daily practice and hands-on work.",
    features: [
      "DSA with Java or Python",
      "AI, ML & Generative AI",
      "Structured roadmap with concept-wise notes",
      "Daily tasks, challenges & quizzes",
      "Weekly assessments & progress tracking",
      "Monthly mini-project ideas + course certificate",
    ],
    featured: false,
  },
  {
    key: "placement",
    title: "PLACEMENT PROGRAM",
    badge: "MOST POPULAR",
    price: 799,
    priceLabel: "one-time",
    buttonText: "START PREPARING",
    description:
      "A focused preparation system for students who want to become interview-ready and improve their chances of landing a job.",
    features: [
      "Structured DSA practice",
      "Aptitude & Core CS preparation",
      "Company & role-based interview questions",
      "Daily placement tasks & challenges",
      "Mock interview + feedback report",
      "Jobs & internships board",
    ],
    featured: true,
  },
];

const settingKey = "homepage-pricing";

function normalizeCards(input) {
  if (!Array.isArray(input) || input.length !== 2) {
    const error = new Error("Provide both homepage pricing cards.");
    error.status = 400;
    throw error;
  }

  const expectedKeys = new Set(["skill", "placement"]);
  const seenKeys = new Set();
  return input.map((card) => {
    if (!card || !expectedKeys.has(card.key) || seenKeys.has(card.key)) {
      const error = new Error("Homepage pricing must have one skill and one placement card.");
      error.status = 400;
      throw error;
    }
    seenKeys.add(card.key);

    const textFields = ["title", "badge", "priceLabel", "buttonText", "description"];
    for (const field of textFields) {
      if (typeof card[field] !== "string" || !card[field].trim()) {
        const error = new Error(`${field} is required for each pricing card.`);
        error.status = 400;
        throw error;
      }
    }
    if (
      card.title.length > 100 || card.badge.length > 80 ||
      card.priceLabel.length > 40 || card.buttonText.length > 60 ||
      card.description.length > 600
    ) {
      const error = new Error("A homepage pricing field exceeds its allowed length.");
      error.status = 400;
      throw error;
    }

    const price = Number(card.price);
    if (!Number.isFinite(price) || price < 0 || price > 10000000) {
      const error = new Error("Price must be a valid non-negative amount.");
      error.status = 400;
      throw error;
    }
    if (!Array.isArray(card.features) || card.features.length < 1 || card.features.length > 12) {
      const error = new Error("Each card needs between 1 and 12 features.");
      error.status = 400;
      throw error;
    }
    const features = card.features.map((feature) => String(feature).trim()).filter(Boolean);
    if (!features.length || features.some((feature) => feature.length > 160)) {
      const error = new Error("Card features must be non-empty and no longer than 160 characters.");
      error.status = 400;
      throw error;
    }

    return {
      key: card.key,
      title: card.title.trim(),
      badge: card.badge.trim(),
      price,
      priceLabel: card.priceLabel.trim(),
      buttonText: card.buttonText.trim(),
      description: card.description.trim(),
      features,
      featured: card.key === "placement",
    };
  }).sort((left, right) => left.key === "skill" ? -1 : right.key === "skill" ? 1 : 0);
}

export async function getHomepagePricing(_req, res, next) {
  try {
    const setting = await SiteSetting.findOne({ key: settingKey }).lean();
    return res.json({ cards: setting?.cards?.length ? setting.cards : DEFAULT_HOMEPAGE_PRICING });
  } catch (error) {
    return next(error);
  }
}

export async function saveHomepagePricing(req, res, next) {
  try {
    const cards = normalizeCards(req.body?.cards);
    const setting = await SiteSetting.findOneAndUpdate(
      { key: settingKey },
      { $set: { cards } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json({ cards: setting.cards });
  } catch (error) {
    return next(error);
  }
}
