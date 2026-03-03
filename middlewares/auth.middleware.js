import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";
import { verifyJWTToken, refreshTokens } from "../services/auth.services.js";

export const verifyAuthentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  req.user = null;
  // If no tokens → continue
  if (!accessToken && !refreshToken) {
    return next();
  }
  // ✅ If access token exists → verify it
  if (accessToken) {
    try {
      const decodedToken = verifyJWTToken(accessToken);
      req.user = decodedToken;
      return next();
    } catch (error) {
      // Access token invalid → clear it
      res.clearCookie("access_token");
    }
  }
  // ✅ If refresh token exists → try to refresh
  if (refreshToken) {
    try {
      const { newAccessToken, newRefreshToken, user } =
        await refreshTokens(refreshToken);

      req.user = user;

      const baseConfig = {
        httpOnly: true,
        // secure: true, // Set to true in production (requires HTTPS)
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      };
      res.cookie("access_token", newAccessToken, {
        ...baseConfig,
        maxAge: ACCESS_TOKEN_EXPIRY, // 15 minutes
      });
      res.cookie("refresh_token", newRefreshToken, {
        ...baseConfig,
        maxAge: REFRESH_TOKEN_EXPIRY, // 7 days
      });
      return next();
    } catch (error) {
      console.log(error);
      // 🔥 IMPORTANT: clear invalid cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
    }
  }
  return next();
};
// --------------------------------------------------------------------
// export const verifyAuthentication = (req, res, next) => {
//   const token = req.cookies.access_token;
//   if (!token) {
//     req.user = null;
//     return next();
//   }
//   try {
//     const decodedToken = verifyJWTToken(token);
//     req.user = decodedToken;
//     // console.log(` req.user: `, req.user);
//   } catch (error) {
//     req.user = null;
//   }
//   return next();
// };
// you can add any property to req
// but
// Avoid overwriting existing properties like req.user, req.body, req.params, etc. to prevent conflicts with Express's built-in properties and middleware. Instead, use a custom property name like req.authUser or req.currentUser to store authenticated user information without risking unintended side effects.
// use req.user for Authenticated user information, but make sure to set it to null or undefined when the user is not authenticated to avoid confusion in downstream middleware and route handlers.
// group custom properties under req.custom if needed to avoid cluttering the req object and to provide a clear namespace for your custom data. For example, you could use req.custom.user to store authenticated user information, which helps prevent conflicts with existing properties and keeps your code organized.
// keep data light in the cookie, and use it to fetch the user data from the database in the middleware, and then attach it to the req object for further use in the route handlers. This way, you can avoid storing large amounts of data in the cookie while still having access to the necessary user information throughout your application.
