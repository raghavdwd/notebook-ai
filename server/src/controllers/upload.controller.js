import { chunkPdf } from "../services/langchain.service.js";
import { getEmbeddings } from "../services/llm.service.js";
import { v4 as uuidv4 } from "uuid";
import { addVector } from "../services/chromadb.service.js";
import { logger } from "../utils/logger.js";
import ApiError from "../utils/ApiError.js";
import { db } from "../database/postgres.db.js";
import {
  chatSessionFiles,
  chatSessions,
  files,
  userData,
} from "../database/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Controller for handling PDF uploads and related operations.
 * This includes uploading PDFs, fetching uploaded files, and deleting files.
 */

export const handlePdfUpload = async (req, res) => {
  try {
    // 1. Read the optional session ID so uploads can be auto-attached to the active chat
    const sessionId = req.query.sessionId
      ? Number.parseInt(req.query.sessionId, 10)
      : null;

    // 2. Fetch the user from the database using the email from the authenticated request
    const userResult = await db
      .select({ userId: userData.userId })
      .from(userData)
      .where(eq(userData.email, req.user.email))
      .limit(1);
    const user = userResult[0];

    logger.info("Uploaded file:", req.file);

    // 3. If user not found, return a 404 error
    if (!user) {
      throw new ApiError(404, "User not found", [req.user.email]);
    }

    // 4. If sessionId is provided, verify that the session exists and belongs to the user
    if (sessionId) {
      const sessionResult = await db
        .select()
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.sessionId, sessionId),
            eq(chatSessions.userId, user.userId),
          ),
        )
        .limit(1);

      // 5. If session not found, return a 404 error
      if (!sessionResult[0]) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
        });
      }
    }

    // 6. Load and split the uploaded PDF into page-level documents
    const pages = await chunkPdf(req.file.path);

    // 7. Save the uploaded document in the user's global document library
    const [file] = await db
      .insert(files)
      .values({
        userId: user.userId,
        filePath: req.file.filename,
      })
      .returning();

    // 8. For each chunked page, generate embeddings and store in ChromaDB with metadata
    const addResults = await Promise.all(
      pages.map(async (page) => {
        const embedding = await getEmbeddings(page.pageContent);
        const id = uuidv4();

        const vectorResult = await addVector({
          id,
          embedding,
          userId: req.user.userId,
          fileId: file.fileId,
          text: page.pageContent,
          metadata: page.metadata,
        });

        console.log("🧩 Vector inserted with ID:", vectorResult.id);

        return vectorResult.id;
      }),
    );

    // 9. If sessionId was provided, associate the uploaded file with the chat session
    if (sessionId) {
      await db
        .insert(chatSessionFiles)
        .values({
          sessionId,
          fileId: file.fileId,
        })
        .onConflictDoNothing();
    }

    logger.info(`Added ${addResults.length} page vectors successfully.`);
    return res.json({
      success: true,
      file,
      count: addResults.length,
      message: "PDF uploaded and processed successfully",
    });
  } catch (error) {
    // 10. Convert upload failures into a consistent API error
    logger.error("❌ Error in PDF upload handling:", error);
    throw new ApiError(500, "Failed to process PDF upload", [error.message]);
  }
};

export const getUploadedFiles = async (req, res) => {
  try {
    // 1. Fetch the user from the database using the authenticated email
    const userResult = await db
      .select({ userId: userData.userId })
      .from(userData)
      .where(eq(userData.email, req.user.email))
      .limit(1);
    const user = userResult[0];

    // 2. If user not found, return a 404 error
    if (!user) {
      throw new ApiError(404, "User not found", [req.user.email]);
    }

    // 3. Fetch all documents in the user's global document library
    const fetchedFiles = await db
      .select({
        fileId: files.fileId,
        filePath: files.filePath,
        uploadedAt: files.uploadedAt,
      })
      .from(files)
      .where(eq(files.userId, user.userId));

    // 4. Return the uploaded documents to the client
    return res.json({
      success: true,
      files: fetchedFiles,
      message: "Files fetched successfully",
    });
  } catch (error) {
    // 5. Convert fetch failures into a consistent API error
    logger.error("❌ Error in fetching uploaded files:", error);
    throw new ApiError(500, "Failed to fetch uploaded files", [error.message]);
  }
};

export const deleteUploadedFiles = async (req, res) => {
  // 1. Read the authenticated user ID and requested file ID
  const userId = req.user.userId;
  const fileId = parseInt(req.params.fileId, 10);

  try {
    // 2. Verify that the requested file exists and belongs to this user
    const fileResult = await db
      .select()
      .from(files)
      .where(and(eq(files.fileId, fileId), eq(files.userId, userId)))
      .limit(1);
    const file = fileResult[0];

    // 3. If file not found, return a 404 error
    if (!file) {
      throw new ApiError(404, "File not found", [fileId]);
    }

    console.log(file);

    // 4. Delete the file record; session attachments cascade from schema constraints
    await db.delete(files).where(eq(files.fileId, fileId));

    // 5. Confirm deletion to the client
    return res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    // 6. Convert delete failures into a consistent API error
    logger.error("❌ Error in deleting uploaded files:", error);
    throw new ApiError(500, "Failed to delete uploaded files", [error.message]);
  }
};
