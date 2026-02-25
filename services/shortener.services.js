import { connectDB } from "../config/db.js";
import { ObjectId } from "mongodb";
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

  const links = await db.collection("short_links").find({ userId }).toArray();

  // 🔥 Normalize _id → id
  return links.map((link) => ({
    ...link,
    id: link._id.toString(),
  }));
};
// Find link by shortCode
// export const getShortlinkByShortCode = async (shortCode, userId) => {
//   const db = await connectDB();

//   return await db.collection("short_links").findOne({ shortCode, userId });
// };
export const getShortlinkByShortCode = async (shortCode) => {
  const db = await connectDB();

  // const query = userId
  //   ? { shortCode, userId } // when checking per user
  //   : { shortCode }; // when redirecting publicly

  // return await db.collection("short_links").findOne(query);
  return await db.collection("short_links").findOne({ shortCode });
};

//

export const findShortLinkById = async (id) => {
  const db = await connectDB();

  const result = await db
    .collection("short_links")
    .findOne({ _id: new ObjectId(id) });

  if (!result) return null;

  return {
    ...result,
    id: result._id.toString(),
  };
};

export const updateShortLink = async ({ id, url, shortCode, userId }) => {
  const db = await connectDB();

  return await db
    .collection("short_links")
    .updateOne({ _id: new ObjectId(id), userId }, { $set: { url, shortCode } });
};

export const deleteShortLinkById = async (id, userId) => {
  const db = await connectDB();

  return await db.collection("short_links").deleteOne({
    _id: new ObjectId(id),
    userId,
  });
};
