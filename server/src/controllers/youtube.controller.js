import { v4 as uuidv4 } from "uuid";
import { and, eq } from "drizzle-orm";
import { db } from "../database/postgres.db.js";
import { chatSessionFiles, chatSessions, files, userData } from "../database/schema.js";
import { getEmbeddings } from "../services/llm.service.js";
import { addVector, deleteVector } from "../services/chromadb.service.js";
import {
  extractVideoId,
  fetchTranscript,
  chunkTranscriptByTime,
  formatTimestamp,
} from "../services/youtube.service.js";
import ApiError from "../utils/ApiError.js";

export const attachYouTubeVideo = async (req, res) => {
  try {
    const { url } = req.body;
    const rawSessionId = req.body.sessionId;
    const sessionId = rawSessionId == null || rawSessionId === ""
      ? null
      : Number(rawSessionId);

    if (!url?.trim()) {
      return res.status(400).json({ success: false, message: "YouTube URL is required" });
    }
    if (sessionId !== null && (!Number.isInteger(sessionId) || sessionId <= 0)) {
      return res.status(400).json({ success: false, message: "Invalid sessionId" });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ success: false, message: "Invalid YouTube URL" });
    }

    const userResult = await db
      .select({ userId: userData.userId })
      .from(userData)
      .where(eq(userData.email, req.user.email))
      .limit(1);
    const user = userResult[0];
    if (!user) throw new ApiError(404, "User not found");

    if (sessionId) {
      const sessionResult = await db
        .select()
        .from(chatSessions)
        .where(and(eq(chatSessions.sessionId, sessionId), eq(chatSessions.userId, user.userId)))
        .limit(1);
      if (!sessionResult[0]) {
        return res.status(404).json({ success: false, message: "Session not found" });
      }
    }

    const rawTranscript = await fetchTranscript(videoId);
    if (!rawTranscript || rawTranscript.length === 0) {
      return res.status(400).json({ success: false, message: "No transcript available for this video" });
    }

    const chunks = chunkTranscriptByTime(rawTranscript);
    const fullText = rawTranscript.map((s) => s.text).join(" ");

    const existingFileResult = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.userId, user.userId),
          eq(files.filePath, videoId),
          eq(files.sourceType, "youtube"),
        ),
      )
      .limit(1);
    const existingFile = existingFileResult[0];
    if (existingFile) {
      if (sessionId) {
        await db.insert(chatSessionFiles).values({ sessionId, fileId: existingFile.fileId }).onConflictDoNothing();
      }
      return res.json({
        success: true,
        file: existingFile,
        chunkCount: chunks.length,
        message: "YouTube video is already attached",
      });
    }

    const [file] = await db
      .insert(files)
      .values({
        userId: user.userId,
        filePath: videoId,
        sourceType: "youtube",
        transcriptText: fullText,
      })
      .returning();

    const addResults = [];
    try {
      for (const chunk of chunks) {
        const embedding = await getEmbeddings(chunk.text);
        const id = uuidv4();
        const vectorResult = await addVector({
          id,
          embedding,
          userId: req.user.userId,
          fileId: file.fileId,
          text: chunk.text,
          metadata: {
            sourceType: "youtube",
            startTime: chunk.startTime,
            endTime: chunk.endTime,
            videoUrl: `https://youtu.be/${videoId}?t=${Math.floor(chunk.startTime)}`,
          },
        });
        if (!vectorResult?.id) {
          throw new Error("Failed to add transcript chunk vector");
        }
        addResults.push(vectorResult.id);
      }
    } catch (vectorError) {
      const cleanupResults = await Promise.allSettled(
        addResults.map((vectorId) => deleteVector(vectorId)),
      );
      cleanupResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("Failed to delete vector during rollback:", {
            vectorId: addResults[index],
            error: result.reason?.message || String(result.reason),
          });
        }
      });
      await db.delete(files).where(eq(files.fileId, file.fileId));
      throw vectorError;
    }

    if (sessionId) {
      await db.insert(chatSessionFiles).values({ sessionId, fileId: file.fileId }).onConflictDoNothing();
    }

    return res.json({
      success: true,
      file,
      chunkCount: addResults.length,
      message: "YouTube video attached and indexed successfully",
    });
  } catch (error) {
    console.error("Error attaching YouTube video:", error);
    const lowerMessage = error.message?.toLowerCase?.() || "";
    if (lowerMessage.includes("transcript is disabled")) {
      return res.status(400).json({ success: false, message: "Transcripts are disabled for this video" });
    }
    if (
      lowerMessage.includes("could not find any transcripts")
      || lowerMessage.includes("no transcript")
    ) {
      return res.status(400).json({ success: false, message: "No transcript available for this video" });
    }
    if (
      lowerMessage.includes("video unavailable")
      || lowerMessage.includes("video is unavailable")
      || lowerMessage.includes("not available")
    ) {
      return res.status(404).json({ success: false, message: "The requested YouTube video is unavailable" });
    }
    if (
      lowerMessage.includes("too many requests")
      || lowerMessage.includes("rate limit")
      || lowerMessage.includes("429")
    ) {
      return res.status(429).json({ success: false, message: "YouTube transcript service rate limit reached. Try again shortly." });
    }
    throw new ApiError(500, "Failed to attach YouTube video", [error.message]);
  }
};
