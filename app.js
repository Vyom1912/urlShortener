import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import requestIp from "request-ip";
import path from "path";

import { connectDB } from "./config/db.js";
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

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(import.meta.dirname, "public")));
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
  res.status(500).render("404", {
    title: "Something went wrong",
    status: 500,
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
