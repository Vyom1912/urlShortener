import {
  getUserByEmail,
  createUser,
  hashPassword,
  comparePassword,
  generateToken,
} from "../services/auth.services.js";

// ---------------------------------------------------------
// getRegisterPage
// ---------------------------------------------------------
export const getRegisterPage = (req, res) => {
  return res.render("auth/register", { errors: req.flash("error") }); // ✅ correct
};
// ---------------------------------------------------------
// getLoginPage
// ---------------------------------------------------------
export const getLoginPage = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  return res.render("auth/login", { errors: req.flash("error") }); // ✅ correct
};
// ---------------------------------------------------------
// postLogin
// -----------------------------------------------------
export const postLogin = async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  const isPasswordValid = await comparePassword(user.password, password);

  if (!isPasswordValid) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  const token = generateToken({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  });

  res.cookie("access_token", token, {
    httpOnly: true,
  });

  return res.redirect("/");
};
// ---------------------------------------------------------
// postRegister
// ---------------------------------------------------------
export const postRegister = async (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }

  const { name, email, password } = req.body;

  const userExist = await getUserByEmail(email);
  if (userExist) {
    req.flash("error", "User already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await hashPassword(password);

  const userId = await createUser({
    name,
    email,
    password: hashedPassword,
  });

  console.log("Created user:", userId);

  return res.redirect("/login");
};
// ---------------------------------------------------------
export const getMe = async (req, res) => {
  // console.log(req.user);
  if (!req.user) {
    return res.send("not authenticated");
  }
  return res.send(`Welcome ${req.user.name}-${req.user.email}`);
};

export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("user");
  return res.redirect("/login");
};
