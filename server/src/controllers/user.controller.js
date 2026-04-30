import { db } from "../database/postgres.db.js";
import { chats } from "../database/schema.js";
import { eq, asc } from "drizzle-orm";

export const getChatHistory = async (req, res) => {
  const userId = req.user.userId;

  try {
    const chatHistory = await db.select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(asc(chats.createdAt));

    res.json({
      success: true,
      chatHistory,
      message: "history processed successfully",
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};
