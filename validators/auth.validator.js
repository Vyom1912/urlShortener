import z from "zod";

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

export const verifyUserSchema = z.object({
  name: nameSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().length(8),
  email: z.string().email(),
});
