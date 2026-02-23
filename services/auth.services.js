import { connectDB } from "../config/db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Get users collection
const usersCollection = async () => {
  const db = await connectDB();
  return db.collection("users");
};

// Get user by email
export const getUserByEmail = async (email) => {
  const collection = await usersCollection();
  return await collection.findOne({ email });
};

// Create new user
export const createUser = async ({ name, email, password }) => {
  const collection = await usersCollection();

  const result = await collection.insertOne({
    name,
    email,
    password,
    createdAt: new Date(),
  });

  return result.insertedId;
};

// Hash password securely using Argon2
export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

// Compare entered password with stored hash
export const comparePassword = async (hashed, plain) => {
  return await argon2.verify(hashed, plain);
};

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Verify JWT token
export const verifyJWTToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
