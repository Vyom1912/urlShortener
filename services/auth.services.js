import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { ObjectId } from "mongodb";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

/* =====================================================
   USER FUNCTIONS
===================================================== */

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

/* =====================================================
   PASSWORD FUNCTIONS
===================================================== */

// Hash password securely using Argon2
export const hashPassword = async (password) => {
  return await argon2.hash(password);
};

// Compare entered password with stored hash
export const comparePassword = async (hashed, plain) => {
  return await argon2.verify(hashed, plain);
};

// Generate JWT token
// export const generateToken = (payload) => {
//   return jwt.sign(payload, env.JWT_SECRET, {
//     expiresIn: "30d",
//   });
// };

/* =====================================================
   SESSION FUNCTIONS
===================================================== */

// Get sessions collection
const sessionsCollection = async () => {
  const db = await connectDB();
  return db.collection("sessions");
};

// Create session
export const createSession = async (userId, { ip, userAgent }) => {
  const collection = await sessionsCollection();

  const result = await collection.insertOne({
    userId: new ObjectId(userId),
    valid: true,
    ip,
    userAgent,
    createdAt: new Date(),
  });

  return result.insertedId;
};

// Find session by ID
export const findSessionById = async (sessionId) => {
  const collection = await sessionsCollection();

  return await collection.findOne({
    _id: new ObjectId(sessionId),
  });
};

// Invalidate session (Logout)
export const clearUserSession = async (sessionId) => {
  const collection = await sessionsCollection();

  return await collection.updateOne(
    { _id: new ObjectId(sessionId) },
    { $set: { valid: false } },
  );
};

/* =====================================================
   TOKEN FUNCTIONS
===================================================== */

// Create Access Token
export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign({ id, name, email, sessionId }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

// Create Refresh Token
export const createRefreshToken = (sessionId) => {
  return jwt.sign({ sessionId }, env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

// Verify JWT token
export const verifyJWTToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
/* =====================================================
   FIND USER BY ID
===================================================== */

export const findUserById = async (userId) => {
  const collection = await usersCollection();

  return await collection.findOne({
    _id: new ObjectId(userId),
  });
};

/* =====================================================
   REFRESH TOKENS
===================================================== */

export const refreshTokens = async (refreshToken) => {
  try {
    const decoded = verifyJWTToken(refreshToken);

    const session = await findSessionById(decoded.sessionId);
    if (!session || !session.valid) {
      throw new Error("Invalid session");
    }

    const user = await findUserById(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userInfo = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      sessionId: session._id.toString(),
    };

    const newAccessToken = createAccessToken(userInfo);
    const newRefreshToken = createRefreshToken(session._id.toString());

    return { newAccessToken, newRefreshToken, user: userInfo };
  } catch (error) {
    console.log(error);
    throw new Error("Invalid refresh token");
  }
};
/* =====================================================
   AUTHENTICATE USER (LOGIN HELPER)
===================================================== */

export const authenticateUser = async ({ req, res, user }) => {
  const sessionId = await createSession(user._id.toString(), {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = createAccessToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    sessionId: sessionId.toString(),
  });

  const refreshToken = createRefreshToken(sessionId.toString());

  const baseConfig = {
    httpOnly: true,
    // secure: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};
