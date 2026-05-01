import express from "express";
import {
  handleUserLogin,
  handleUserSignUp,
  handleRefreshToken,
  handleVerifyEmail,
  handleResendVerification,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", handleUserSignUp);
router.post("/login", handleUserLogin);
router.post("/refresh", handleRefreshToken);
router.get("/verify-email", handleVerifyEmail);
router.post("/resend-verification", handleResendVerification);

export default router;
