import { dbClient } from "../config/db-client.js";
await dbClient.connect();
import { env } from "../config/env.js";

const db = dbClient.db(env.MONGODB_DATABASE_NAME);

const shortenerCollection = db.collection("shorteners");

export const loadLinks = async () => {
  return await shortenerCollection.find().toArray();
};

export const saveLinks = async (links) => {
  return await shortenerCollection.insertOne(links);
};

export const getLinkByShortCode = async (shortCode) => {
  return await shortenerCollection.find({ shortCode: shortCode });
};
