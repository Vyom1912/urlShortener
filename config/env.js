// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

// Validate environment variables using Zod
// This prevents app from starting if required env variables are missing
export const env = z
  .object({
    PORT: z.coerce.number().default(3000),
    MONGODB_URI: z.string().min(1),
    MONGODB_DATABASE_NAME: z.string().min(1),
    JWT_SECRET: z.string().min(10), // 🔥 required for JWT security
  })
  .parse(process.env);
