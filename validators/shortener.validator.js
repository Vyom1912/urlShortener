import { z } from "zod";

export const shortenerSchema = z.object({
  url: z
    .string({ required_error: "URL is required" })
    .trim()
    .url({ message: "Invalid URL" })
    .max(1024, { message: "URL must be less than 1024 characters long" }),
  shortCode: z
    .string({ required_error: "Shortcode is required" })
    .trim()
    .min(2, { message: "Shortcode must be at least 2 characters long" })
    .max(50, { message: "Shortcode must be less than 50 characters" }),
});
