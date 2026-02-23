import { verifyJWTToken } from "../services/auth.services.js";

// Middleware runs before routes
// It checks if user has valid JWT cookie
export const verifyAuthentication = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const decodedToken = verifyJWTToken(token);
    req.user = decodedToken; // make user available in all routes
    // console.log(` req.user: `, req.user);
  } catch (error) {
    req.user = null;
  }
  return next();
};
// you can add any property to req
// but
// Avoid overwriting existing properties like req.user, req.body, req.params, etc. to prevent conflicts with Express's built-in properties and middleware. Instead, use a custom property name like req.authUser or req.currentUser to store authenticated user information without risking unintended side effects.
// use req.user for Authenticated user information, but make sure to set it to null or undefined when the user is not authenticated to avoid confusion in downstream middleware and route handlers.
// group custom properties under req.custom if needed to avoid cluttering the req object and to provide a clear namespace for your custom data. For example, you could use req.custom.user to store authenticated user information, which helps prevent conflicts with existing properties and keeps your code organized.
// keep data light in the cookie, and use it to fetch the user data from the database in the middleware, and then attach it to the req object for further use in the route handlers. This way, you can avoid storing large amounts of data in the cookie while still having access to the necessary user information throughout your application.
