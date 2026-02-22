import { db } from "../config/db.js";

// Helper to access collection
const shortLinksCollection = () => db.collection("short_links");

// Get all short links
export const getAllShortLinks = async () => {
  return await shortLinksCollection().find().toArray();
};

// Get short link by shortCode
export const getShortlinkByShortCode = async (shortCode) => {
  return await shortLinksCollection().findOne({ shortCode });
};

// Insert short link
export const insertShortLink = async ({ url, shortCode }) => {
  const result = await shortLinksCollection().insertOne({
    url,
    shortCode,
    createdAt: new Date(),
  });

  return result.insertedId;
};
