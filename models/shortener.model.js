import { db } from "../config/db.js";

const collection = db.collection("urls");

export const loadLinks = async () => {
  // return await collection.find().toArray();
  const docs = await collection.find().toArray();

  return docs.reduce((acc, doc) => {
    acc[doc.shortCode] = doc.url;
    return acc;
  }, {});
};

export const saveLinks = async ({ url, shortCode }) => {
  return await collection.insertOne({ url, shortCode });
};

export const getLinkByShortCode = async (shortCode) => {
  return await collection.findOne({ shortCode: shortCode });
};
