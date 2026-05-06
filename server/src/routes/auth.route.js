import express from "express";
import {
  handleUserLogin,
  handleUserSignUp,
  handleRefreshToken,
  handleVerifyEmail,
  handleResendVerification,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../utils/rate-limit.js";

const router = express.Router();

router.post("/signup", authLimiter, handleUserSignUp);
router.post("/login", authLimiter, handleUserLogin);
router.post("/refresh", handleRefreshToken);
router.get("/verify-email", handleVerifyEmail);
router.post("/resend-verification", authLimiter, handleResendVerification);

export default router;
