import z from "zod";
import { RESERVED_CODES } from "./shortener.validator.js";

const nameSchema = z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters")
  .max(100, "Name too long");

const emailSchema = z.string().trim().email("Invalid email");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerUserSchema = loginUserSchema.extend({
  name: nameSchema,
});

// Public username used in short links: /<handle>/<shortCode>
const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or less")
  .regex(
    /^[a-z0-9][a-z0-9_-]*$/,
    "Username can only use letters, numbers, - and _ (and must start with a letter or number)",
  )
  .refine((h) => !RESERVED_CODES.includes(h), {
    message: "That username is reserved, please choose another",
  });

export const verifyUserSchema = z.object({
  name: nameSchema,
  handle: handleSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().length(8),
  email: z.string().email(),
});

// ---------------------------------------------------------
export const verifyPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current Password is required!" }),

    newPassword: z
      .string()
      .min(6, { message: "New Password must be at least 6 characters long." })
      .max(100, {
        message: "New Password must be no more than 100 characters.",
      }),

    confirmPassword: z
      .string()
      .min(6, {
        message: "Confirm Password must be at least 6 characters long.",
      })
      .max(100, {
        message: "Confirm Password must be no more than 100 characters.",
      }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const verifyResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "New Password must be at least 6 characters long." })
      .max(100, {
        message: "New Password must be no more than 100 characters.",
      }),
    confirmPassword: z
      .string()
      .min(6, {
        message: "Confirm Password must be at least 6 characters long.",
      })
      .max(100, {
        message: "Confirm Password must be no more than 100 characters.",
      }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
