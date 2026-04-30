import express from "express";
import {
  attachFileToSession,
  chatWithPdf,
  createChatSession,
  deleteChatSession,
  detachFileFromSession,
  getChatSessions,
  getSessionFiles,
  getSessionMessages,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/sessions", createChatSession);
router.get("/sessions", getChatSessions);
router.delete("/sessions/:sessionId", deleteChatSession);

router.get("/sessions/:sessionId/files", getSessionFiles);
router.post("/sessions/:sessionId/files", attachFileToSession);
router.delete("/sessions/:sessionId/files/:fileId", detachFileFromSession);

router.get("/sessions/:sessionId/messages", getSessionMessages);
router.post("/sessions/:sessionId/messages", chatWithPdf);

export default router;
