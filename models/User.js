import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    isEmailValid: { type: Boolean, default: false },
    // Public namespace for this user's short links: /<handle>/<shortCode>
    handle: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
