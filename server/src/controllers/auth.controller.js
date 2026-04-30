import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createJwtToken, createAccessToken } from "../utils/jwtMaker.js";
import { db } from "../database/postgres.db.js";
import { userData } from "../database/schema.js";
import { eq } from "drizzle-orm";

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

export const handleRefreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const user = await db
      .select()
      .from(userData)
      .where(eq(userData.userId, decoded.userId));

    if (user.length === 0) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      createJwtToken(user[0].email, user[0].userId);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: decoded.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    res.clearCookie("refreshToken");
    return res.status(401).json({ success: false, error: "Invalid or expired refresh token" });
  }
};

/**
 * Controller for handling authentication-related operations.
 * This includes user signup, user login, and user logout.
 */

export const handleUserSignUp = async (req, res) => {
  // 1. Extract required signup fields from the request body
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "All fields are required" });
  }

  // 2. Check if a user already exists with the provided email
  const existingUser = await db
    .select()
    .from(userData)
    .where(eq(userData.email, email));
  if (existingUser.length > 0) {
    return res
      .status(409)
      .json({ success: false, error: "User already exists" });
  }

  // 3. Hash the password before saving it in the database
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create the user record and return the generated user ID
  const [newUser] = await db
    .insert(userData)
    .values({ name, email, password: hashedPassword })
    .returning({ userId: userData.userId });

  const { accessToken, refreshToken } = createJwtToken(email, newUser.userId);

  // 5. Store the refresh token in an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 6. Return the access token to the client
  return res.status(201).json({
    success: true,
    data: { accessToken },
    message: "SignUp successful",
  });
};

export const handleUserLogin = async (req, res) => {
  // 1. Extract login credentials from the request body
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Please provide email and password" });
  }

  // 2. Fetch the user record for the provided email
  const user = await db.select().from(userData).where(eq(userData.email, email));
  if (user.length === 0) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  // 3. Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user[0].password);
  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid email or password" });
  }

  // 4. Create access and refresh tokens for the authenticated user
  const { accessToken, refreshToken } = createJwtToken(email, user[0].userId, rememberMe);

  // 5. Store the refresh token in an HTTP-only cookie
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge,
  });

  // 6. Return the access token and basic user profile to the client
  return res.status(200).json({
    success: true,
    data: {
      accessToken,
      user: {
        userId: user[0].userId,
        name: user[0].name,
        email: user[0].email,
      },
    },
    message: "Login successful",
  });
};

export const handleUserLogout = async (req, res) => {
  // 1. Clear the refresh token cookie from the browser
  res.clearCookie("refreshToken");

  // 2. Confirm logout to the client
  return res.status(200).json({ success: true, message: "Logout successful" });
};
