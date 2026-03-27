import z from "zod";

export const shortenerSchema = z.object({
  url: z.string().url("Invalid URL"),
  shortCode: z.string().min(2, "Too short").max(50, "Too long"),
});
