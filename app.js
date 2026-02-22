import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import { shortenerRouter } from "./routes/shortener.routes.js";
import { dbClient } from "./config/db.js";
import { authRoute } from "./routes/auth.routes.js";
import { verifyAuthentication } from "./middlewares/verify-auth-middleware.js";

await dbClient.connect();
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
    secret: "v-secret",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(flash());

app.use(verifyAuthentication);

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

/* ---------------- ROUTES ---------------- */
app.use("/", shortenerRouter);
app.use("/", authRoute);
// 🔥 MUST BE LAST ROUTE BEFORE 404
import { redirectToShortCode } from "./controllers/postshortner.controller.js";
app.get("/:shortCode", redirectToShortCode);

/* ---------------- 404 ---------------- */
app.use((req, res) => {
  res.status(404).render("404", { title: "404" });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
