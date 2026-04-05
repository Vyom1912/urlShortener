import fs from "fs/promises";
import path from "path";
import mjml2html from "mjml";
import ejs from "ejs";
import { sendEmail } from "../lib/send-email.js";

import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { VerifyEmailToken } from "../models/VerifyEmailToken.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";

import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

// USER
export const getUserByEmail = (email) => User.findOne({ email });

export const createUser = (data) => User.create(data);

export const findUserById = (id) => User.findById(id);

// PASSWORD
export const hashPassword = (p) => argon2.hash(p);
export const comparePassword = (h, p) => argon2.verify(h, p);

// SESSION
export const createSession = (userId, data) =>
  Session.create({ userId, ...data });

export const findSessionById = (id) => Session.findById(id);

export const clearUserSession = (id) => Session.findByIdAndDelete(id);

// JWT
export const createAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });

export const createRefreshToken = (id) =>
  jwt.sign({ sessionId: id }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });

export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
// AUTH
export const authenticateUser = async ({ req, res, user }) => {
  const session = await createSession(user._id, {
    ip: req.clientIp,
    userAgent: req.headers["user-agent"],
  });

  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    isEmailValid: user.isEmailValid,
    sessionId: session._id,
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(session._id);

  const config = { httpOnly: true, secure: true };

  res.cookie("access_token", accessToken, {
    ...config,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refresh_token", refreshToken, {
    ...config,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};

// REFRESH
export const refreshTokens = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const session = await Session.findById(decoded.sessionId);
    if (!session) return null;

    const user = await User.findById(session.userId);
    if (!user) return null;

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      sessionId: session._id,
    };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    //   expiresIn: "7d",
    // });
    const newRefreshToken = jwt.sign(
      { sessionId: session._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    return {
      newAccessToken,
      newRefreshToken,
      user: payload,
    };
  } catch (error) {
    console.log("❌ Refresh Token Error:", error.message);
    return null;
  }
};

// EMAIL
export const generateRandomToken = () =>
  crypto.randomInt(10000000, 99999999).toString();

export const insertVerifyEmailToken = ({ userId, token }) =>
  VerifyEmailToken.create({ userId, token });

export const findVerificationEmailToken = async ({ token, email }) => {
  const user = await User.findOne({ email });
  return VerifyEmailToken.findOne({
    userId: user._id,
    token,
    expiresAt: { $gte: new Date() },
  });
};

export const verifyUserEmailAndUpdate = (email) =>
  User.updateOne({ email }, { isEmailValid: true });

export const clearVerifyEmailToken = async (email) => {
  const user = await User.findOne({ email });
  return VerifyEmailToken.deleteMany({ userId: user._id });
};

export const updateUserByName = ({ userId, name }) =>
  User.findByIdAndUpdate(userId, { name });

const createVerifyEmailLink = (email, token) => {
  return `http://localhost:3001/verify-email-token?token=${token}&email=${email}`;
};
export const sendNewVerifyEmailLink = async ({ userId, email }) => {
  const randomToken = await generateRandomToken();

  await insertVerifyEmailToken({
    userId,
    token: randomToken,
  });

  const verifyEmailLink = createVerifyEmailLink(email, randomToken);

  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, "..", "emails", "verify-email.mjml"),
    "utf-8",
  );

  const filledTemplate = ejs.render(mjmlTemplate, {
    code: randomToken,
    link: verifyEmailLink,
  });

  const htmlOutput = mjml2html(filledTemplate).html;

  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: htmlOutput,
  });
};

// updateUserPassword
export const updateUserPassword = async ({ userId, newPassword }) => {
  const newHashedPassword = await hashPassword(newPassword);

  return await User.updateOne(
    { _id: userId },
    { $set: { password: newHashedPassword } },
  );
};

// findUserByEmail
export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

// createResetPasswordLink
export const createResetPasswordLink = async ({ userId, email }) => {
  const randomToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(randomToken)
    .digest("hex");

  try {
    await PasswordResetToken.deleteMany({ userId });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    throw err;
  }

  await PasswordResetToken.create({
    userId,
    tokenHash,
  });

  return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;
};

// getResetPasswordToken
export const getResetPasswordToken = async (token) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const data = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gte: new Date() },
  });

  return data;
};

// clearResetPasswordToken
export const clearResetPasswordToken = async (userId) => {
  return await PasswordResetToken.deleteMany({ userId });
};
