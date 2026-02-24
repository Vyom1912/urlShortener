// import dotenv from "dotenv";
// dotenv.config();
import { env } from "./config/env.js";
import express from "express";
import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import { verifyAuthentication } from "./middlewares/auth.middleware.js";
import { authRoute } from "./routes/auth.routes.js";
import { shortenerRouter } from "./routes/shortener.routes.js";
import { redirectToShortCode } from "./controllers/shortener.controller.js";

await connectDB(); // connect to DB once
console.log("MongoDB connected");

const app = express();

/* ---------------- SETTINGS FIRST ---------------- */
app.set("view engine", "ejs");
app.set("views", "./views");

/* ---------------- MIDDLEWARES ---------------- */
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cookieParser());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(flash());
app.use(verifyAuthentication);

// Make user available in templates
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

/* ---------------- ROUTES ---------------- */
app.use("/", authRoute);
app.use("/", shortenerRouter);
// 🔥 MUST BE LAST ROUTE BEFORE 404
// app.get("/:shortCode", redirectToShortCode);

/* ---------------- 404 ---------------- */
app.use((req, res) => {
  res.status(404).render("404", { title: "404" });
});

/* ---------------- SERVER ---------------- */
// const PORT = process.env.PORT || 3000;
const PORT = env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
