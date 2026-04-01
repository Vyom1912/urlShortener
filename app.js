import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import requestIp from "request-ip";

import { connectDB } from "./config/db.js"; // ✅ NEW
import { shortenerRoutes } from "./routes/shortener.routes.js";
import { authRoute } from "./routes/auth.routes.js";
import { verifyAuthentication } from "./middlewares/auth.middleware.js";

export const app = express();
const PORT = process.env.PORT || 3000;
// const PORT = 3000;
console.log("RESEND KEY:", process.env.RESEND_API_KEY);
// ✅ CONNECT DB
connectDB();

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/favicon.ico", (req, res) => res.status(204));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
  }),
);

app.use(flash());
app.use(requestIp.mw());

app.use(verifyAuthentication);

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use("/", shortenerRoutes);
app.use("/", authRoute);

// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
export default app;
