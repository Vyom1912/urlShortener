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
  updateUserByName,
  updateUserPassword,
  findUserByEmail,
  createResetPasswordLink,
  getResetPasswordToken,
  clearResetPasswordToken,
} from "../services/auth.services.js";

import { getAllShortLinks } from "../services/shortener.services.js";

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

  const userExist = await findUserByEmail(email);
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

  const user = await findUserByEmail(email);
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
  console.log("USER:", req.user);
  if (!req.user) return res.redirect("/login");

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const links = await getAllShortLinks(user._id);
  console.log("REQ.USER:", req.user);
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
export const postChangePassword = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const result = verifyPasswordSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessage = result.error.issues.map((err) => err.message);
    req.flash("errors", errorMessage);
    return res.redirect("/change-password");
  }

  const { currentPassword, newPassword } = result.data;

  const user = await findUserById(req.user.id);

  const isPasswordValid = await comparePassword(user.password, currentPassword);
  if (!isPasswordValid) {
    req.flash("error", "Invalid current password");
    return res.redirect("/change-password");
  }

  await updateUserPassword({
    userId: req.user.id,
    newPassword,
  });

  return res.redirect("/profile");
};
// getResetPasswordPage
export const getForgotPasswordPage = async (req, res) => {
  return res.render("auth/forgot-password", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
  });
};
// postForgotPassword
export const postForgotPassword = async (req, res) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    const errorMessages = result.error.issues.map((err) => err.message);
    // req.flash('errors', errorMessages[0]);
    errorMessages.forEach((msg) => req.flash("errors", msg));
    return res.redirect("/reset-password");
  }
  // success case

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
    // console.log('html: ', html);

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html,
    });
    req.flash("formSubmitted", true);
  }
  return res.redirect("/reset-password");
};
// getResetPasswordTokenPage
export const getResetPasswordTokenPage = async (req, res) => {
  const { token } = req.params;
  const passwordResetToken = await getResetPasswordToken(token);

  if (!passwordResetToken) {
    req.flash("errors", "Invalid or expired reset password token");
    return res.render("auth/wrong-reset-password-token");
  }

  return res.render("auth/reset-password", {
    token,
    errors: req.flash("errors"),
    formSubmitted: req.flash("formSubmitted")[0],
  });
};
// postResetPasswordToken
export const postResetPasswordToken = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token);

  if (!passwordResetData) {
    req.flash("errors", "Invalid or expired reset password token");
    return res.render("auth/wrong-reset-password-token");
  }

  // const { data, error } = verifyResetPasswordSchema.safeParse({
  //   newPassword: req.body.newPassword,
  //   confirmPassword: req.body.confirmNewPassword,
  // });
  const { data, error } = verifyResetPasswordSchema.safeParse(req.body);
  if (error) {
    const errorMessage = error.errors.map((err) => err.message);
    req.flash("errors", errorMessage);
    return res.redirect(`/reset-password/${token}`);
  }

  const { newPassword } = data;

  const user = await findUserById(passwordResetData.userId);
  // if (!user) {
  //   req.flash('errors', 'User not found');
  //   return res.redirect(`/reset-password/${token}`);
  // }

  await clearResetPasswordToken(passwordResetData.userId);
  await updateUserPassword({
    userId: user._id,
    newPassword,
  });
  return res.redirect("/login");
};
