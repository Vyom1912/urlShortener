import crypto from "crypto";
import { isValidObjectId } from "mongoose";
import { ShortLink } from "../models/ShortLink.js";
import { User } from "../models/User.js";

export const getAllShortLinks = (userId) =>
  ShortLink.find({ userId }).sort({ createdAt: -1 });

// Short codes are unique per user, not globally
export const getUserShortLinkByShortCode = (userId, shortCode) =>
  ShortLink.findOne({ userId, shortCode });

// Legacy "/<shortCode>" links (created before per-user handles).
// If several users now share a code, the original (oldest) one wins.
export const getLegacyShortLink = (shortCode) =>
  ShortLink.findOne({ shortCode }).sort({ createdAt: 1 });

export const insertShortLink = (data) => ShortLink.create(data);

// Only returns the link if it belongs to the given user
export const findUserShortLinkById = (id, userId) =>
  isValidObjectId(id) ? ShortLink.findOne({ _id: id, userId }) : null;

export const updateShortLink = ({ id, userId, url, shortCode }) =>
  ShortLink.findOneAndUpdate({ _id: id, userId }, { url, shortCode });

export const deleteShortLinkById = (id, userId) =>
  isValidObjectId(id) ? ShortLink.deleteOne({ _id: id, userId }) : null;

export const incrementShortLinkClicks = (id) =>
  ShortLink.updateOne({ _id: id }, { $inc: { clicks: 1 } });

// ---------------- HANDLES ----------------

// No look-alike characters (0/o, 1/l/i)
const HANDLE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const HANDLE_LENGTH = 5;

const randomHandle = () =>
  Array.from(
    { length: HANDLE_LENGTH },
    () => HANDLE_ALPHABET[crypto.randomInt(HANDLE_ALPHABET.length)],
  ).join("");

export const findUserByHandle = (handle) =>
  User.findOne({ handle: String(handle).toLowerCase() });

// Returns the user's handle, creating one the first time it's needed
export const ensureUserHandle = async (userId) => {
  const user = await User.findById(userId).select("handle");
  if (!user) return null;
  if (user.handle) return user.handle;

  for (let attempt = 0; attempt < 10; attempt++) {
    const handle = randomHandle();
    if (await User.exists({ handle })) continue;
    try {
      // Only set it if another request hasn't already done so
      const updated = await User.findOneAndUpdate(
        { _id: userId, handle: { $exists: false } },
        { $set: { handle } },
        { new: true },
      );
      if (updated) return updated.handle;
      return (await User.findById(userId).select("handle")).handle;
    } catch (err) {
      if (err.code !== 11000) throw err; // duplicate → try another
    }
  }
  throw new Error("Could not generate a unique handle");
};
