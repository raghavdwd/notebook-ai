import express from "express";
import {
  handleUserLogin,
  handleUserSignUp,
  handleRefreshToken,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", handleUserSignUp);
router.post("/login", handleUserLogin);
router.post("/refresh", handleRefreshToken);

export default router;
