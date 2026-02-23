import { z } from "zod";

// Schema for login validation
export const loginUserSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .min(5, "Email must be at least 5 characters long")
    .max(255, "Email must be less than 255 characters long"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(255, "Password must be less than 255 characters long"),
});

// Schema for register validation
export const registerUserSchema = loginUserSchema.extend({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name must be less than 100 characters long"),
});
