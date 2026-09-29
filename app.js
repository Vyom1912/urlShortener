import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import requestIp from "request-ip";
import path from "path";

import { connectDB, getDBStatus } from "./config/db.js";
import { shortenerRoutes } from "./routes/shortener.routes.js";
import { authRoute } from "./routes/auth.routes.js";
import { verifyAuthentication } from "./middlewares/auth.middleware.js";

export const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONNECT DB
connectDB();

// Needed so req.protocol / secure cookies work behind Vercel's proxy
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.get("/favicon.ico", (req, res) => res.status(204).end());

// Deployment check: open /health to see if the database and required
// settings are working. Shows only yes/no for settings, never their values.
app.get("/health", async (req, res) => {
  await connectDB();
  const db = getDBStatus();
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "SESSION_SECRET",
    "RESEND_API_KEY",
    "FRONTEND_URL",
  ];
  const env = Object.fromEntries(
    required.map((key) => [
      key,
      key === "MONGO_URI"
        ? Boolean(process.env.MONGO_URI || process.env.MONGODB_URI)
        : Boolean(process.env[key]),
    ]),
  );
  const ok = db.state === "connected" && Object.values(env).every(Boolean);
  res.status(ok ? 200 : 503).json({
    ok,
    database: db,
    env,
    frontendUrl: process.env.FRONTEND_URL || null,
    runningOnVercel: Boolean(process.env.VERCEL),
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(import.meta.dirname, "public")));

// Make sure MongoDB is connected before any page that needs it
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(flash());
app.use(requestIp.mw());

app.use(verifyAuthentication);

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Auth routes first so a short code can never shadow /login, /profile, ...
app.use("/", authRoute);
app.use("/", shortenerRoutes);

// 404
app.use((req, res) => {
  res.status(404).render("404", { title: "Page not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);

  const dbDown = getDBStatus().state !== "connected";
  res.status(dbDown ? 503 : 500).render("404", {
    title: dbDown ? "Database unavailable" : "Something went wrong",
    status: dbDown ? 503 : 500,
    message: dbDown
      ? "We couldn't reach the database. Please try again in a moment."
      : undefined,
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
