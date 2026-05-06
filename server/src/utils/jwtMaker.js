import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_REFRESH_SECRET } from "../../config/contants.js";
export const createJwtToken = (
  userEmail,
  userId,
  rememberMe = false,
  tokenVersion = 0,
) => {
  const accessTokenPayload = {
    email: userEmail,
    userId: userId,
    type: "access",
  };

  const refreshTokenPayload = {
    email: userEmail,
    userId: userId,
    type: "refresh",
    rememberMe,
    tokenVersion,
  };

  const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: rememberMe ? "30d" : "7d",
  });
  return { accessToken, refreshToken };
};

export const createAccessToken = (userEmail, userId) => {
  return jwt.sign(
    { email: userEmail, userId: userId, type: "access" },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
};
