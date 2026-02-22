import { ObjectId } from "mongodb";
import { db } from "../config/db.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

// Get users collection helper
const usersCollection = () => db.collection("users");

// Get user by email
export const getUserByEmail = async (email) => {
  return await usersCollection().findOne({ email });
};

// Create a user
export const createUser = async ({ name, email, password }) => {
  const result = await usersCollection().insertOne({
    name,
    email,
    password,
    createdAt: new Date(),
  });

  return result.insertedId; // Similar to $returningId()
};

// Hash password using argon2
export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

// Compare password using argon2
export const comparePassword = async (hashedPassword, plainPassword) => {
  return await argon2.verify(hashedPassword, plainPassword);
};

// Generate JWT token
export const generateToken = ({ id, name, email }) => {
  return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Verify JWT token
export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
