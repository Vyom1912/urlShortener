import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    token: String,
    expiresAt: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
    },
  },
  { timestamps: true },
);

export const VerifyEmailToken = mongoose.model("VerifyEmailToken", schema);
