import express from "express";
import { getChatHistory, getUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", getUserProfile);

router.get("/chatHistory", getChatHistory);

export default router;
