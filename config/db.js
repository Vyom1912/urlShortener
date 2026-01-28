// for MongoDB Cloud Server
import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const dbClient = new MongoClient(env.MONGODB_URI, {
  tls: true,
  serverApi: { version: "1", strict: true, deprecationErrors: true },
});
export const db = dbClient.db(env.MONGODB_DATABASE_NAME);

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
