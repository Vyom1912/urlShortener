import mongoose from "mongoose";

const shortLinkSchema = new mongoose.Schema(
  {
    url: String,
    shortCode: { type: String, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clicks: { type: Number, default: 0 },
  },
  // Indexes are applied with syncIndexes() in config/db.js, which also drops
  // the old globally-unique shortCode index.
  { timestamps: true, autoIndex: false },
);

// A short code only has to be unique for its owner, so two users
// can both have "/gh" under their own handle.
shortLinkSchema.index({ userId: 1, shortCode: 1 }, { unique: true });

export const ShortLink = mongoose.model("ShortLink", shortLinkSchema);
