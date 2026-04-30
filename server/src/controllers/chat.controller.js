import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../database/postgres.db.js";
import {
  chats,
  chatSessionFiles,
  chatSessions,
  files,
} from "../database/schema.js";
import { searchVector } from "../services/chromadb.service.js";
import {
  generateChatTitle,
  getEmbeddings,
  getTextResponse,
} from "../services/llm.service.js";
import ApiError from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

const DEFAULT_CHAT_TITLE = "New chat";

const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

const getSessionForUser = async (sessionId, userId) => {
  const result = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.sessionId, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);

  return result[0];
};

export const createChatSession = async (req, res) => {
  try {
    const [session] = await db
      .insert(chatSessions)
      .values({
        userId: req.user.userId,
        title: DEFAULT_CHAT_TITLE,
      })
      .returning();

    return res.status(201).json({
      success: true,
      session,
      message: "Chat session created successfully",
    });
  } catch (error) {
    logger.error("Error creating chat session:", error.message);
    throw new ApiError(500, "Failed to create chat session");
  }
};

export const getChatSessions = async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, req.user.userId))
      .orderBy(desc(chatSessions.updatedAt));

    return res.json({
      success: true,
      sessions,
      message: "Chat sessions fetched successfully",
    });
  } catch (error) {
    logger.error("Error fetching chat sessions:", error.message);
    throw new ApiError(500, "Failed to fetch chat sessions");
  }
};

export const deleteChatSession = async (req, res) => {
  const sessionId = parseId(req.params.sessionId);
  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Invalid session ID" });
  }

  try {
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    await db.delete(chatSessions).where(eq(chatSessions.sessionId, sessionId));

    return res.json({
      success: true,
      message: "Chat session deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting chat session:", error.message);
    throw new ApiError(500, "Failed to delete chat session");
  }
};

export const getSessionFiles = async (req, res) => {
  const sessionId = parseId(req.params.sessionId);
  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Invalid session ID" });
  }

  try {
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const attachedFiles = await db
      .select({
        fileId: files.fileId,
        filePath: files.filePath,
        uploadedAt: files.uploadedAt,
      })
      .from(chatSessionFiles)
      .innerJoin(files, eq(chatSessionFiles.fileId, files.fileId))
      .where(eq(chatSessionFiles.sessionId, sessionId))
      .orderBy(desc(chatSessionFiles.createdAt));

    return res.json({
      success: true,
      files: attachedFiles,
      message: "Session files fetched successfully",
    });
  } catch (error) {
    logger.error("Error fetching session files:", error.message);
    throw new ApiError(500, "Failed to fetch session files");
  }
};

export const attachFileToSession = async (req, res) => {
  const sessionId = parseId(req.params.sessionId);
  const fileId = parseId(req.body.fileId);
  if (!sessionId || !fileId) {
    return res.status(400).json({ success: false, message: "Invalid session or file ID" });
  }

  try {
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const fileResult = await db
      .select()
      .from(files)
      .where(and(eq(files.fileId, fileId), eq(files.userId, req.user.userId)))
      .limit(1);

    if (!fileResult[0]) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    await db
      .insert(chatSessionFiles)
      .values({ sessionId, fileId })
      .onConflictDoNothing();

    return res.status(201).json({
      success: true,
      message: "File attached to session successfully",
    });
  } catch (error) {
    logger.error("Error attaching file to session:", error.message);
    throw new ApiError(500, "Failed to attach file to session");
  }
};

export const detachFileFromSession = async (req, res) => {
  const sessionId = parseId(req.params.sessionId);
  const fileId = parseId(req.params.fileId);
  if (!sessionId || !fileId) {
    return res.status(400).json({ success: false, message: "Invalid session or file ID" });
  }

  try {
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    await db
      .delete(chatSessionFiles)
      .where(
        and(
          eq(chatSessionFiles.sessionId, sessionId),
          eq(chatSessionFiles.fileId, fileId),
        ),
      );

    return res.json({
      success: true,
      message: "File detached from session successfully",
    });
  } catch (error) {
    logger.error("Error detaching file from session:", error.message);
    throw new ApiError(500, "Failed to detach file from session");
  }
};

export const getSessionMessages = async (req, res) => {
  const sessionId = parseId(req.params.sessionId);
  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Invalid session ID" });
  }

  try {
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const messages = await db
      .select()
      .from(chats)
      .where(and(eq(chats.sessionId, sessionId), eq(chats.userId, req.user.userId)))
      .orderBy(asc(chats.createdAt));

    return res.json({
      success: true,
      messages,
      message: "Session messages fetched successfully",
    });
  } catch (error) {
    logger.error("Error fetching session messages:", error.message);
    throw new ApiError(500, "Failed to fetch session messages");
  }
};

export const chatWithPdf = async (req, res) => {
  const sessionId = parseId(req.params.sessionId);
  const { userMsg } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Invalid session ID" });
  }
  if (!userMsg?.trim()) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }

  try {
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const attachedFiles = await db
      .select({ fileId: chatSessionFiles.fileId })
      .from(chatSessionFiles)
      .innerJoin(files, eq(chatSessionFiles.fileId, files.fileId))
      .where(
        and(
          eq(chatSessionFiles.sessionId, sessionId),
          eq(files.userId, req.user.userId),
        ),
      );

    if (attachedFiles.length === 0) {
      return res.json({
        success: false,
        message: "Attach at least one document to this chat before asking questions.",
      });
    }

    const fileIds = attachedFiles.map((file) => file.fileId);
    const embeddings = await getEmbeddings(userMsg);
    const results = await searchVector(embeddings, req.user.userId, fileIds);
    const responseFromAI = await getTextResponse(userMsg, results);

    const [savedMessage] = await db
      .insert(chats)
      .values({
        sessionId,
        userId: req.user.userId,
        userMsg,
        aiResponse: responseFromAI,
      })
      .returning();

    let title = session.title;
    const previousMessages = await db
      .select({ chatId: chats.chatId })
      .from(chats)
      .where(and(eq(chats.sessionId, sessionId), eq(chats.userId, req.user.userId)));

    if (session.title === DEFAULT_CHAT_TITLE && previousMessages.length === 1) {
      try {
        title = await generateChatTitle(userMsg);
      } catch (error) {
        logger.error("Error generating chat title:", error.message);
        title = userMsg.slice(0, 40);
      }
    }

    const [updatedSession] = await db
      .update(chatSessions)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.sessionId, sessionId))
      .returning();

    logger.info("Chat message saved successfully");

    return res.status(200).json({
      success: true,
      response: responseFromAI,
      chat: savedMessage,
      session: updatedSession,
      message: "Chat processed successfully",
    });
  } catch (error) {
    logger.error("Error in chatWithPdf:", error.message);
    throw new ApiError(500, "Failed to process chat request");
  }
};
