import {
  getUserByEmail,
  createUser,
  hashPassword,
  comparePassword,
  authenticateUser,
  clearUserSession,
  findUserById,
  insertVerifyEmailToken,
  findVerificationEmailToken,
  verifyUserEmailAndUpdate,
  clearVerifyEmailToken,
  sendNewVerifyEmailLink,
  updateUserByName,
} from "../services/auth.services.js";

import { getAllShortLinks } from "../services/shortener.services.js";

import {
  loginUserSchema,
  registerUserSchema,
  verifyEmailSchema,
  verifyUserSchema,
} from "../validators/auth.validator.js";

// ---------------- REGISTER ----------------

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("auth/register", { errors: req.flash("error") });
};

export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  const result = registerUserSchema.safeParse(req.body);

  if (!result.success) {
    req.flash("error", result.error.issues[0].message);
    return res.redirect("/register");
  }

  const { name, email, password } = result.data;

  const userExist = await getUserByEmail(email);
  if (userExist) {
    req.flash("error", "User already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  await authenticateUser({ req, res, user });

  await sendNewVerifyEmailLink({
    userId: user._id,
    email,
  });

  return res.redirect("/");
};

// ---------------- LOGIN ----------------

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("auth/login", { errors: req.flash("error") });
};

export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  const result = loginUserSchema.safeParse(req.body);

  if (!result.success) {
    req.flash("error", result.error.issues[0].message);
    return res.redirect("/login");
  }

  const { email, password } = result.data;

  const user = await getUserByEmail(email);
  if (!user) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  const valid = await comparePassword(user.password, password);
  if (!valid) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  res.cookie("user", user.name);

  await authenticateUser({ req, res, user });

  return res.redirect("/");
};

// ---------------- PROFILE ----------------

export const getProfilePage = async (req, res) => {
  if (!req.user) return res.send("Not Logged In");

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const links = await getAllShortLinks(user._id);

  return res.render("auth/profile", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      createdAt: user.createdAt,
      links,
    },
  });
};

// ---------------- LOGOUT ----------------

export const logoutUser = async (req, res) => {
  await clearUserSession(req.user.sessionId);

  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.clearCookie("user");

  return res.redirect("/login");
};

// ---------------- VERIFY EMAIL ----------------

export const getVerifyEmailPage = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);
  if (!user || user.isEmailValid) return res.redirect("/");

  return res.render("auth/verify-email", {
    email: user.email,
    user,
    previewUrl: null,
  });
};

export const resendVerificationLink = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);
  if (!user || user.isEmailValid) return res.redirect("/");

  await sendNewVerifyEmailLink({
    userId: user._id,
    email: user.email,
  });

  res.redirect("/verify-email");
};

export const verifyEmailToken = async (req, res) => {
  const { data, error } = verifyEmailSchema.safeParse(req.query);

  if (error) {
    return res.send("Verification link invalid or expired");
  }

  const token = await findVerificationEmailToken(data);

  if (!token) {
    return res.send("Verification link invalid or expired");
  }

  await verifyUserEmailAndUpdate(data.email);
  await clearVerifyEmailToken(data.email);

  return res.redirect("/profile");
};

// ---------------- EDIT PROFILE ----------------

export const getEditProfilePage = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).send("User not found");

  return res.render("auth/edit-profile", {
    name: user.name,
    user,
    errors: req.flash("errors"),
  });
};

export const postEditProfile = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const { data, error } = verifyUserSchema.safeParse(req.body);

  if (error) {
    req.flash(
      "errors",
      error.errors.map((e) => e.message),
    );
    return res.redirect("/edit-profile");
  }

  await updateUserByName({
    userId: req.user.id,
    name: data.name,
  });

  res.redirect("/profile");
};

// ---------------- CHANGE PASSWORD (UI ONLY) ----------------

export const getChangePasswordPage = (req, res) => {
  if (!req.user) return res.redirect("/");

  return res.render("auth/change-password", {
    user: req.user,
    errors: req.flash("errors"),
  });
};
