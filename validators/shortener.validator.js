import z from "zod";

// Paths used by the app itself — a short code must never shadow them
export const RESERVED_CODES = [
  "login",
  "register",
  "logout",
  "profile",
  "edit",
  "delete",
  "edit-profile",
  "change-password",
  "reset-password",
  "verify-email",
  "verify-email-token",
  "resend-verification-link",
  "style.css",
  "favicon.ico",
  "404",
  "api",
  "admin",
];

export const shortenerSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Please enter a valid URL (including https://)")
    .refine((u) => /^https?:\/\//i.test(u), {
      message: "URL must start with http:// or https://",
    }),
  shortCode: z
    .string()
    .trim()
    .max(50, "Short code is too long (max 50 characters)")
    .refine((c) => c === "" || c.length >= 2, {
      message: "Short code must be at least 2 characters",
    })
    .refine((c) => c === "" || /^[a-zA-Z0-9_-]+$/.test(c), {
      message: "Short code can only contain letters, numbers, - and _",
    })
    .refine((c) => !RESERVED_CODES.includes(c.toLowerCase()), {
      message: "That short code is reserved, please choose another",
    })
    .optional()
    .default(""),
});
