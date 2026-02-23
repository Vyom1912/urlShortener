import { MongoClient } from "mongodb";
import { env } from "./env.js";

let client;
let database;

// Reuse DB connection (important for serverless like Vercel)
export const connectDB = async () => {
  if (database) return database; // if already connected, reuse

  client = new MongoClient(env.MONGODB_URI);
  await client.connect();

  database = client.db(env.MONGODB_DATABASE_NAME);
  return database;
};
