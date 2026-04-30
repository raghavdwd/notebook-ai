import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/contants.js";

export const verifyJwtToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  // console.log(token);
  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
