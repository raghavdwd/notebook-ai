import { searchVector } from "../services/chromadb.service.js";
import { getEmbeddings, getTextResponse } from "../services/llm.service.js";
import ApiError from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { db } from "../database/postgres.db.js";
import { userData, files, chats } from "../database/schema.js";
import { eq } from "drizzle-orm";

export const chatWithPdf = async (req, res) => {
  const { userMsg } = req.body;
  const userResult = await db
    .select({ userId: userData.userId })
    .from(userData)
    .where(eq(userData.email, req.user.email))
    .limit(1);
  const user = userResult[0];

  logger.info(userMsg);

  try {
    const fetchedFiles = await db
      .select({ chatId: files.chatId })
      .from(files)
      .where(eq(files.userId, user.userId));

    if (!fetchedFiles || fetchedFiles.length === 0) {
      return res.json({
        success: false,
        message: "No files uploaded. Please upload files to start chatting.",
      });
    }

    const chatId = fetchedFiles[0].chatId;
    // console.log("chatid", chatId);

    const embeddings = await getEmbeddings(userMsg);
    // console.log("embedding length", embeddings.length);

    const vectorRows = await db
      .select({ vectorId: files.vectorId })
      .from(files)
      .where(eq(files.userId, req.user.userId));
    const vectorIds = vectorRows.map((row) => row.vectorId);
    // console.log("vectorIds", vectorIds);

    const results = await searchVector(embeddings, req.user.userId);
    // console.log("chroma results", results);

    const responseFromAI = await getTextResponse(userMsg, results);

    await db.insert(chats).values({
      userId: user.userId,
      userMsg: userMsg,
      aiResponse: responseFromAI,
    });

    logger.info("Chat history saved successfully");

    return res.status(200).json({
      success: true,
      response: responseFromAI,
      message: "Chat processed successfully",
    });
  } catch (error) {
    console.log(error);
    logger.error("Error in chatWithPdf:", error.message);
    throw new ApiError("Failed to process chat request", 500);
  }
};
