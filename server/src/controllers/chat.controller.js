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
  summarizeConversation,
} from "../services/llm.service.js";
import ApiError from "../utils/ApiError.js";

const DEFAULT_CHAT_TITLE = "New chat";

// Helper function to safely parse route params into numeric IDs
const parseId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
};

// Helper function to fetch a session only if it belongs to the authenticated user
const getSessionForUser = async (sessionId, userId) => {
  const result = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.sessionId, sessionId),
        eq(chatSessions.userId, userId),
      ),
    )
    .limit(1);

  return result[0];
};

/**
 * Controller for handling chat sessions and session-scoped chat messages.
 * This includes creating sessions, attaching documents, fetching history, and chatting with selected documents.
 */

export const createChatSession = async (req, res) => {
  try {
    // 1. Create a new empty chat session for the authenticated user
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
    console.error("Error creating chat session:", { message: error.message });
    throw new ApiError(500, "Failed to create chat session");
  }
};

export const getChatSessions = async (req, res) => {
  try {
    // 1. Fetch all sessions owned by the authenticated user, newest activity first
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
    console.error("Error fetching chat sessions:", { message: error.message });
    throw new ApiError(500, "Failed to fetch chat sessions");
  }
};

export const deleteChatSession = async (req, res) => {
  // 1. Parse and validate the session ID from request params
  const sessionId = parseId(req.params.sessionId);
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }

  try {
    // 2. Verify that the session exists and belongs to the authenticated user
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // 3. Delete the session; related messages and file attachments cascade from schema constraints
    await db.delete(chatSessions).where(eq(chatSessions.sessionId, sessionId));

    return res.json({
      success: true,
      message: "Chat session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat session:", { message: error.message });
    throw new ApiError(500, "Failed to delete chat session");
  }
};

export const getSessionFiles = async (req, res) => {
  // 1. Parse and validate the session ID from request params
  const sessionId = parseId(req.params.sessionId);
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }

  try {
    // 2. Verify that the session exists and belongs to the authenticated user
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // 3. Fetch all documents attached to this specific chat session
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
    console.error("Error fetching session files:", { message: error.message });
    throw new ApiError(500, "Failed to fetch session files");
  }
};

export const attachFileToSession = async (req, res) => {
  // 1. Parse and validate the session ID and file ID
  const sessionId = parseId(req.params.sessionId);
  const fileId = parseId(req.body.fileId);
  if (!sessionId || !fileId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid session or file ID" });
  }

  try {
    // 2. Verify that the session exists and belongs to the authenticated user
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // 3. Verify that the file exists in the user's global document library
    const fileResult = await db
      .select()
      .from(files)
      .where(and(eq(files.fileId, fileId), eq(files.userId, req.user.userId)))
      .limit(1);

    if (!fileResult[0]) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // 4. Attach the document to the session; duplicate attachments are ignored
    await db
      .insert(chatSessionFiles)
      .values({ sessionId, fileId })
      .onConflictDoNothing();

    return res.status(201).json({
      success: true,
      message: "File attached to session successfully",
    });
  } catch (error) {
    console.error("Error attaching file to session:", { message: error.message });
    throw new ApiError(500, "Failed to attach file to session");
  }
};

export const detachFileFromSession = async (req, res) => {
  // 1. Parse and validate the session ID and file ID
  const sessionId = parseId(req.params.sessionId);
  const fileId = parseId(req.params.fileId);
  if (!sessionId || !fileId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid session or file ID" });
  }

  try {
    // 2. Verify that the session exists and belongs to the authenticated user
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // 3. Remove the document from this session without deleting it from the global library
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
    console.error("Error detaching file from session:", { message: error.message });
    throw new ApiError(500, "Failed to detach file from session");
  }
};

export const getSessionMessages = async (req, res) => {
  // 1. Parse and validate the session ID from request params
  const sessionId = parseId(req.params.sessionId);
  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }

  try {
    // 2. Verify that the session exists and belongs to the authenticated user
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // 3. Fetch chat messages only from the selected session
    const messages = await db
      .select()
      .from(chats)
      .where(
        and(eq(chats.sessionId, sessionId), eq(chats.userId, req.user.userId)),
      )
      .orderBy(asc(chats.createdAt));

    return res.json({
      success: true,
      messages,
      message: "Session messages fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching session messages:", { message: error.message });
    throw new ApiError(500, "Failed to fetch session messages");
  }
};

export const chatWithPdf = async (req, res) => {
  // 1. Parse the active session ID and user message from the request
  const sessionId = parseId(req.params.sessionId);
  const { userMsg } = req.body;

  if (!sessionId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid session ID" });
  }
  if (!userMsg?.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Message is required" });
  }

  try {
    // 2. Verify that the session exists and belongs to the authenticated user
    const session = await getSessionForUser(sessionId, req.user.userId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    // 3. Fetch the document IDs attached to this session for scoped vector search
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
      // 4. Stop early if the session does not have any selected documents
      return res.json({
        success: false,
        message:
          "Attach at least one document to this chat before asking questions.",
      });
    }

    // 5. Fetch session messages and prepare history
    const previousMessages = await db
      .select()
      .from(chats)
      .where(
        and(eq(chats.sessionId, sessionId), eq(chats.userId, req.user.userId)),
      )
      .orderBy(asc(chats.createdAt));

    let history = [];
    if (session.contextSummary) {
      history.push({
        role: "system",
        content: `Previous conversation summary: ${session.contextSummary}`,
      });
    }

    const recentMessages = previousMessages.slice(-10);
    for (const msg of recentMessages) {
      history.push({ role: "user", content: msg.userMsg });
      history.push({ role: "assistant", content: msg.aiResponse });
    }

    // 6. If more than 10 messages, trigger compaction
    if (previousMessages.length > 10) {
      console.log("Triggering conversation compaction");
      try {
        const summary = await summarizeConversation(previousMessages);
        if (summary) {
          await db
            .update(chatSessions)
            .set({ contextSummary: summary })
            .where(eq(chatSessions.sessionId, sessionId));
          console.log("Conversation compacted successfully");
        }
      } catch (err) {
        console.error("Error during compaction:", { message: err.message });
      }
    }

    // 7. Embed the user question and search only within the selected session documents
    const fileIds = attachedFiles.map((file) => file.fileId);
    let results = [];
    try {
      const embeddings = await getEmbeddings(userMsg);
      results = await searchVector(embeddings, req.user.userId, fileIds);
    } catch (err) {
      console.error("Error in vector search:", err.message);
      console.error("fileIds:", { fileIds });
      results = [];
    }

    console.log("History length:", history.length);

    // 8. Generate an AI response using the scoped document chunks and history
    try {
      var responseFromAI = await getTextResponse(userMsg, results, history);
    } catch (err) {
      console.error("Error in getTextResponse:", err.message);
      console.error("Error stack:", err.stack);
      if (err.response?.data) {
        console.error("Error response data:", JSON.stringify(err.response.data));
      }
      throw err;
    }

    // 9. Save the user message and AI response in this chat session
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

    // 10. Check if this was the first saved message in the session
    if (session.title === DEFAULT_CHAT_TITLE && previousMessages.length === 0) {
      try {
        // 11. Generate a short AI title after the first successful message
        title = await generateChatTitle(userMsg);
      } catch (error) {
        console.error("Error generating chat title:", { message: error.message });
        title = userMsg.slice(0, 40);
      }
    }

    // 12. Update the session title and activity timestamp
    const [updatedSession] = await db
      .update(chatSessions)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.sessionId, sessionId))
      .returning();

    console.log("Chat message saved successfully");

    return res.status(200).json({
      success: true,
      response: responseFromAI,
      chat: savedMessage,
      session: updatedSession,
      message: "Chat processed successfully",
    });
  } catch (error) {
    console.error("Error in chatWithPdf:", { message: error.message });
    console.error("Stack:", { stack: error.stack });
    throw new ApiError(500, "Failed to process chat request");
  }
};
