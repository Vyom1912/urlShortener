import mongoose from "mongoose";
import { ShortLink } from "../models/ShortLink.js";

// Fail after 8s instead of letting every query hang
mongoose.set("bufferTimeoutMS", 8000);

let connectionPromise = null;
let lastError = null;

// Never expose credentials from a connection string in logs / health output
const redact = (message = "") =>
  message.replace(/mongodb(\+srv)?:\/\/[^\s"']+/gi, "mongodb://<redacted>");

// Safe to call on every request: the connection is created once and reused.
// If connecting fails, the next call tries again (important on Vercel, where
// a warm instance would otherwise stay broken after one failed cold start).
export const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    lastError = "MONGO_URI environment variable is not set";
    console.error(`❌ DB Connection Error: ${lastError}`);
    return Promise.resolve();
  }

  connectionPromise = mongoose
    .connect(uri, { serverSelectionTimeoutMS: 8000 })
    .then(async () => {
      lastError = null;
      console.log("✅ MongoDB Connected");

      // Replaces the old global unique index on shortCode with the
      // per-user one ({ userId, shortCode }). No-op once in sync.
      await ShortLink.syncIndexes();
    })
    .catch((error) => {
      lastError = redact(`${error.name}: ${error.message}`);
      console.error("❌ DB Connection Error:", lastError);
      connectionPromise = null; // allow a retry on the next request
    });

  return connectionPromise;
};

const STATES = ["disconnected", "connected", "connecting", "disconnecting"];

export const getDBStatus = () => ({
  state: STATES[mongoose.connection.readyState] || "unknown",
  database: mongoose.connection.readyState === 1 ? mongoose.connection.name : null,
  error: lastError,
});

// import mongoose from "mongoose";
// import { env } from "./env.js";

// export const connectDB = async () => {
//   try {
//     await mongoose.connect(env.MONGODB_URI, {
//       dbName: env.MONGODB_DATABASE_NAME,
//     });
//     console.log("✅ MongoDB Connected");
//   } catch (error) {
//     console.error("❌ DB Connection Error:", error);
//     process.exit(1);
//   }
// };

// ----------------------------------------------------------------

// import { MongoClient } from "mongodb";
// import { env } from "./env.js";

// let client;
// let database;

// // Reuse DB connection (important for serverless like Vercel)
// export const connectDB = async () => {
//   if (database) return database; // if already connected, reuse

//   client = new MongoClient(env.MONGODB_URI);
//   await client.connect();

//   database = client.db(env.MONGODB_DATABASE_NAME);
//   return database;
// };
// ----------------------------------------------------------------
// for MongoDB Cloud Server
// import { MongoClient } from "mongodb";
// import { env } from "./env.js";

// export const dbClient = new MongoClient(env.MONGODB_URI, {
//   tls: true,
//   serverApi: { version: "1", strict: true, deprecationErrors: true },
// });
// export const db = dbClient.db(env.MONGODB_DATABASE_NAME);

// ----------------------------------------------------------------

// for MongoDB Local Server
// import { MongoClient } from "mongodb";
// import { env } from "./env.js";

// export const dbClient = new MongoClient(env.MONGODB_URI);

// export const db = dbClient.db(env.MONGODB_DATABASE_NAME);

// the difference is the options passed to MongoClient constructor for cloud server
// and the absence of those options for local server.
// Also, the connection string in .env file will differ for cloud and local server.
// For cloud server, it will be something like mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
// For local server, it will be something like mongodb://localhost:27017
// Make sure to uncomment the appropriate code based on your MongoDB setup.
// Also, ensure that the .env file has the correct MONGODB_URI for your setup.
// For local server, the .env file should have MONGODB_URI=mongodb://localhost:27017
// For cloud server, it should have the appropriate connection string provided by your MongoDB Atlas cluster.
