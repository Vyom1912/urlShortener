import {
  createUser,
  hashPassword,
  comparePassword,
  authenticateUser,
  clearUserSession,
  findUserById,
  findVerificationEmailToken,
  verifyUserEmailAndUpdate,
  clearVerifyEmailToken,
  sendNewVerifyEmailLink,
  updateUserProfile,
  isHandleTaken,
  updateUserPassword,
  findUserByEmail,
  createResetPasswordLink,
  getResetPasswordToken,
  clearResetPasswordToken,
} from "../services/auth.services.js";

import {
  getAllShortLinks,
  ensureUserHandle,
} from "../services/shortener.services.js";

import {
  loginUserSchema,
  registerUserSchema,
  verifyEmailSchema,
  verifyUserSchema,
  verifyPasswordSchema,
  forgotPasswordSchema,
  verifyResetPasswordSchema,
} from "../validators/auth.validator.js";
import { getHtmlFromMjmlTemplate } from "../lib/get-html-from-template.js";
import { sendEmail } from "../lib/send-email.js";

const issuesToMessages = (error) => error.issues.map((issue) => issue.message);

// The access token caches name / isEmailValid. Dropping it forces the
// middleware to mint a fresh one (from the refresh token) on the next request.
const refreshUserToken = (res) => res.clearCookie("access_token");

// ---------------- REGISTER ----------------
// getRegisterPage
export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("auth/register", {
    title: "Create account",
    errors: req.flash("error"),
    old: req.flash("old")[0] || {},
  });
};
// postRegister
export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  const result = registerUserSchema.safeParse(req.body);

  if (!result.success) {
    req.flash("error", result.error.issues[0].message);
    req.flash("old", { name: req.body?.name, email: req.body?.email });
    return res.redirect("/register");
  }

  const { name, email, password } = result.data;

  const userExist = await findUserByEmail(email);
  if (userExist) {
    req.flash("error", "An account with this email already exists");
    req.flash("old", { name, email });
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

  req.flash(
    "success",
    `Welcome, ${name}! Check your inbox to verify your email.`,
  );
  return res.redirect("/");
};

// ---------------- LOGIN ----------------
// getLoginPage
export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("auth/login", {
    title: "Log in",
    errors: req.flash("error"),
    success: req.flash("success"),
    old: req.flash("old")[0] || {},
  });
};
// postLogin
export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  const result = loginUserSchema.safeParse(req.body);

  if (!result.success) {
    req.flash("error", result.error.issues[0].message);
    req.flash("old", { email: req.body?.email });
    return res.redirect("/login");
  }

  const { email, password } = result.data;

  const user = await findUserByEmail(email);
  const valid = user && (await comparePassword(user.password, password));

  if (!valid) {
    req.flash("error", "Invalid email or password");
    req.flash("old", { email });
    return res.redirect("/login");
  }

  await authenticateUser({ req, res, user });

  return res.redirect("/");
};

// ---------------- PROFILE ----------------

export const getProfilePage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const [links, handle] = await Promise.all([
    getAllShortLinks(user._id),
    ensureUserHandle(user._id),
  ]);
  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  return res.render("auth/profile", {
    title: "Profile",
    success: req.flash("success"),
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      handle,
      isEmailValid: user.isEmailValid,
      createdAt: user.createdAt,
      linksCount: links.length,
      totalClicks,
    },
  });
};

// ---------------- LOGOUT ----------------

export const logoutUser = async (req, res) => {
  if (req.user?.sessionId) await clearUserSession(req.user.sessionId);

  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.clearCookie("user");

  return res.redirect("/login");
};

// ---------------- VERIFY EMAIL ----------------

export const getVerifyEmailPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const user = await findUserById(req.user.id);
  if (!user || user.isEmailValid) return res.redirect("/profile");

  return res.render("auth/verify-email", {
    title: "Verify email",
    email: user.email,
    errors: req.flash("errors"),
    success: req.flash("success"),
  });
};

export const resendVerificationLink = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const user = await findUserById(req.user.id);
  if (!user || user.isEmailValid) return res.redirect("/profile");

  await sendNewVerifyEmailLink({
    userId: user._id,
    email: user.email,
  });

  req.flash("success", "A new verification email is on its way.");
  res.redirect("/verify-email");
};

export const verifyEmailToken = async (req, res) => {
  const { data, error } = verifyEmailSchema.safeParse(req.query);

  const token = error ? null : await findVerificationEmailToken(data);

  if (!token) {
    if (req.user) {
      req.flash("errors", "That code is invalid or has expired");
      return res.redirect("/verify-email");
    }
    return res.status(400).render("404", {
      title: "Link expired",
      status: 400,
      message: "This verification link is invalid or has expired.",
    });
  }

  await verifyUserEmailAndUpdate(data.email);
  await clearVerifyEmailToken(data.email);

  refreshUserToken(res);
  req.flash("success", "Your email is verified 🎉");
  return res.redirect(req.user ? "/profile" : "/login");
};

// ---------------- EDIT PROFILE ----------------

export const getEditProfilePage = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const old = req.flash("old")[0];
  const currentHandle = await ensureUserHandle(user._id);

  return res.render("auth/edit-profile", {
    title: "Edit profile",
    name: old?.name ?? user.name,
    handle: old?.handle ?? currentHandle,
    currentHandle,
    host: `${req.protocol}://${req.get("host")}`,
    errors: req.flash("errors"),
  });
};

export const postEditProfile = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const { data, error } = verifyUserSchema.safeParse(req.body);

  const fail = (messages) => {
    req.flash("errors", messages);
    req.flash("old", { name: req.body?.name, handle: req.body?.handle });
    return res.redirect("/edit-profile");
  };

  if (error) return fail(issuesToMessages(error));

  if (await isHandleTaken(data.handle, req.user.id)) {
    return fail("That username is already taken");
  }

  try {
    await updateUserProfile({
      userId: req.user.id,
      name: data.name,
      handle: data.handle,
    });
  } catch (err) {
    // Someone grabbed the same username at the same moment
    if (err.code === 11000) return fail("That username is already taken");
    throw err;
  }

  refreshUserToken(res);
  req.flash("success", "Profile updated");
  res.redirect("/profile");
};

// ---------------- CHANGE PASSWORD ----------------

export const getChangePasswordPage = (req, res) => {
  if (!req.user) return res.redirect("/login");

  return res.render("auth/change-password", {
    title: "Change password",
    errors: req.flash("errors"),
  });
};
export const postChangePassword = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const result = verifyPasswordSchema.safeParse(req.body);
  if (!result.success) {
    req.flash("errors", issuesToMessages(result.error));
    return res.redirect("/change-password");
  }

  const { currentPassword, newPassword } = result.data;

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const isPasswordValid = await comparePassword(user.password, currentPassword);
  if (!isPasswordValid) {
    req.flash("errors", "Your current password is incorrect");
    return res.redirect("/change-password");
  }

  await updateUserPassword({
    userId: req.user.id,
    newPassword,
  });

  req.flash("success", "Password changed successfully");
  return res.redirect("/profile");
};

// ---------------- FORGOT / RESET PASSWORD ----------------
// getForgotPasswordPage
export const getForgotPasswordPage = async (req, res) => {
  return res.render("auth/forgot-password", {
    title: "Forgot password",
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
  });
};
// postForgotPassword
export const postForgotPassword = async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    req.flash("errors", issuesToMessages(result.error));
    return res.redirect("/reset-password");
  }

  const user = await findUserByEmail(result.data.email);

  if (user) {
    const resetPasswordLink = await createResetPasswordLink({
      userId: user._id,
      email: user.email,
    });

    const html = await getHtmlFromMjmlTemplate("reset-password-email", {
      name: user.name,
      link: resetPasswordLink,
    });

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html,
    });
  }

  // Always show the same message so emails can't be enumerated
  req.flash("formSubmitted", true);
  return res.redirect("/reset-password");
};
// getResetPasswordTokenPage
export const getResetPasswordTokenPage = async (req, res) => {
  const { token } = req.params;
  const passwordResetToken = await getResetPasswordToken(token);

  if (!passwordResetToken) {
    return res.render("auth/wrong-reset-password-token", {
      title: "Invalid link",
    });
  }

  return res.render("auth/reset-password", {
    title: "Reset password",
    token,
    errors: req.flash("errors"),
  });
};
// postResetPasswordToken
export const postResetPasswordToken = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token);

  if (!passwordResetData) {
    return res.render("auth/wrong-reset-password-token", {
      title: "Invalid link",
    });
  }

  const { data, error } = verifyResetPasswordSchema.safeParse(req.body);
  if (error) {
    req.flash("errors", issuesToMessages(error));
    return res.redirect(`/reset-password/${token}`);
  }

  const user = await findUserById(passwordResetData.userId);
  await clearResetPasswordToken(passwordResetData.userId);

  if (!user) {
    return res.render("auth/wrong-reset-password-token", {
      title: "Invalid link",
    });
  }

  await updateUserPassword({
    userId: user._id,
    newPassword: data.newPassword,
  });

  req.flash(
    "success",
    "Password reset! You can log in with your new password.",
  );
  return res.redirect("/login");
};
