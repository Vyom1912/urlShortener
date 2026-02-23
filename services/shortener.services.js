import { connectDB } from "../config/db.js";

// Insert short link linked to specific user
export const insertShortLink = async ({ url, shortCode, userId }) => {
  const db = await connectDB();

  const result = await db.collection("short_links").insertOne({
    url,
    shortCode,
    userId, // 🔥 link belongs to this user
    clicks: 0,
    createdAt: new Date(),
  });

  return result.insertedId;
};

// Get all links for logged-in user only
export const getAllShortLinksByUser = async (userId) => {
  const db = await connectDB();

  return await db.collection("short_links").find({ userId }).toArray();
};

// Find link by shortCode
export const getShortlinkByShortCode = async (shortCode) => {
  const db = await connectDB();

  return await db.collection("short_links").findOne({ shortCode });
};
