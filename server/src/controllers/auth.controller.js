import bcrypt from "bcrypt";
import { createJwtToken } from "../utils/jwtMaker.js";
import { db } from "../database/postgres.db.js";
import { userData } from "../database/schema.js";
import { eq } from "drizzle-orm";

export const handleUserSignUp = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  const existingUser = await db.select().from(userData).where(eq(userData.email, email));
  if (existingUser.length > 0) {
    return res.status(409).json({ success: false, error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [newUser] = await db.insert(userData).values({ name, email, password: hashedPassword }).returning({ userId: userData.userId });

  const { accessToken, refreshToken } = createJwtToken(email, newUser.userId);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    data: { accessToken },
    message: "SignUp successful",
  });
};

export const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Please provide email and password" });
  }

  const user = await db.select().from(userData).where(eq(userData.email, email));
  if (user.length === 0) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user[0].password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, error: "Invalid email or password" });
  }

  const { accessToken, refreshToken } = createJwtToken(email, user[0].userId);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    data: { accessToken, user: { userId: user[0].userId, name: user[0].name, email: user[0].email } },
    message: "Login successful",
  });
};

export const handleUserLogout = async (req, res) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({ success: true, message: "Logout successful" });
};
