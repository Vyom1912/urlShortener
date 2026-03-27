import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    valid: { type: Boolean, default: true },
    userAgent: String,
    ip: String,
  },
  { timestamps: true },
);

export const Session = mongoose.model("Session", sessionSchema);
