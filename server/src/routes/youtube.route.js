import express from "express";
import { attachYouTubeVideo } from "../controllers/youtube.controller.js";

const router = express.Router();

router.post("/attach", attachYouTubeVideo);

export default router;
