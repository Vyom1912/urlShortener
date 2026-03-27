import mongoose from "mongoose";

const shortLinkSchema = new mongoose.Schema(
  {
    url: String,
    shortCode: { type: String, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const ShortLink = mongoose.model("ShortLink", shortLinkSchema);
