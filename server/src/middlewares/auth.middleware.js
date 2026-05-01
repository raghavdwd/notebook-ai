import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/contants.js";
import { db } from "../database/postgres.db.js";
import { userData } from "../database/schema.js";
import { eq } from "drizzle-orm";

export const verifyJwtToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  // console.log(token);
  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db
      .select()
      .from(userData)
      .where(eq(userData.userId, decoded.userId));

    if (user.length === 0) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    if (user[0].verificationToken || user[0].verificationExpiry) {
      return res.status(403).json({ success: false, error: "Email not verified" });
    }

    req.user = { email: decoded.email, userId: decoded.userId };
    console.log("in mid", req.user);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, error: "Token expired" });
    }
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};
