import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/contants.js";

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

export const createJwtToken = (userEmail, userId, rememberMe = false) => {
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
  };

  try {
    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET, {
      expiresIn: rememberMe ? "30d" : "7d",
    });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
  }
};

export const createAccessToken = (userEmail, userId) => {
  return jwt.sign(
    { email: userEmail, userId: userId, type: "access" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};
