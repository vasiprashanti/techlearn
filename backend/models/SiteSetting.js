import mongoose from "mongoose";

const homepagePriceCardSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ["skill", "placement"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    badge: { type: String, required: true, trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    priceLabel: { type: String, required: true, trim: true, maxlength: 40 },
    buttonText: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    features: {
      type: [{ type: String, trim: true, maxlength: 160 }],
      required: true,
      validate: {
        validator: (features) => features.length > 0 && features.length <= 12,
        message: "Each homepage card needs between 1 and 12 features.",
      },
    },
    featured: { type: Boolean, default: false },
  },
  { _id: false }
);

const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    cards: {
      type: [homepagePriceCardSchema],
      required: true,
      validate: {
        validator: (cards) =>
          cards.length === 2 &&
          new Set(cards.map((card) => card.key)).size === 2,
        message: "Homepage pricing must contain one skill and one placement card.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSetting ||
  mongoose.model("SiteSetting", siteSettingSchema);
