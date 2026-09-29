import {
  verifyJWTToken,
  refreshTokens,
  getCookieConfig,
} from "../services/auth.services.js";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";

export const verifyAuthentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  req.user = null;

  if (!accessToken && !refreshToken) return next();

  if (accessToken) {
    try {
      const decoded = verifyJWTToken(accessToken);
      req.user = decoded;
      return next();
    } catch {
      // expired / invalid access token → try the refresh token below
    }
  }

  if (refreshToken) {
    const tokens = await refreshTokens(refreshToken);

    if (!tokens) {
      // Stale refresh token: drop it so we don't retry on every request
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      return next();
    }

    const { newAccessToken, newRefreshToken, user } = tokens;
    req.user = user;

    const baseConfig = getCookieConfig();

    res.cookie("access_token", newAccessToken, {
      ...baseConfig,
      maxAge: ACCESS_TOKEN_EXPIRY,
    });

    res.cookie("refresh_token", newRefreshToken, {
      ...baseConfig,
      maxAge: REFRESH_TOKEN_EXPIRY,
    });
  }

  return next();
};
