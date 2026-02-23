import {
  getUserByEmail,
  createUser,
  hashPassword,
  comparePassword,
  generateToken,
} from "../services/auth.services.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validators/auth.validator.js";
// ---------------------------------------------------------
// getRegisterPage // Show register page
// ---------------------------------------------------------
export const getRegisterPage = (req, res) => {
  return res.render("auth/register", { errors: req.flash("error") }); // ✅ correct
};
// ---------------------------------------------------------
// getLoginPage // Show login page
// ---------------------------------------------------------
export const getLoginPage = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  return res.render("auth/login", { errors: req.flash("error") }); // ✅ correct
};
// ---------------------------------------------------------
// postRegister // Handle registration
// ---------------------------------------------------------
export const postRegister = async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  // 🔥 Validate request body
  const result = registerUserSchema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0].message;
    req.flash("error", firstError);
    return res.redirect("/register");
  }

  const { name, email, password } = result.data;

  // 🔥 Check if user already exists
  const userExist = await getUserByEmail(email);
  if (userExist) {
    req.flash("error", "User already exists with this email");
    return res.redirect("/register");
  }

  // 🔐 Hash password before saving
  const hashedPassword = await hashPassword(password);

  await createUser({
    name,
    email,
    password: hashedPassword,
  });

  return res.redirect("/login");
};
// ---------------------------------------------------------
// postLogin
// ---------------------------------------------------------
export const postLogin = async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  // 🔥 Validate request body
  const result = loginUserSchema.safeParse(req.body);

  if (!result.success) {
    const firstError = result.error.issues[0].message;
    req.flash("error", firstError);
    return res.redirect("/login");
  }

  const { email, password } = result.data;

  const user = await getUserByEmail(email);

  if (!user) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  // 🔐 Compare hashed password
  const isPasswordValid = await comparePassword(user.password, password);

  if (!isPasswordValid) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  // 🔥 Generate JWT token
  const token = generateToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });

  // 🔐 Secure cookie settings (important)
  res.cookie("access_token", token, {
    httpOnly: true, // JS cannot access cookie
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.redirect("/");
};

// ---------------------------------------------------------
// logoutUser
// ---------------------------------------------------------
export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("user");
  return res.redirect("/login");
};
