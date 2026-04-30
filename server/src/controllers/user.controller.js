import { db } from "../database/postgres.db.js";
import { chats } from "../database/schema.js";
import { eq, asc } from "drizzle-orm";

/**
 * Controller for handling user-specific data reads.
 * This currently includes fetching chat history for the authenticated user.
 */

export const getChatHistory = async (req, res) => {
  // 1. Read the authenticated user ID from the JWT middleware
  const userId = req.user.userId;

  try {
    // 2. Fetch all chat messages created by this user in chronological order
    const chatHistory = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(asc(chats.createdAt));

    // 3. Return the chat history to the client
    res.json({
      success: true,
      chatHistory,
      message: "history processed successfully",
    });
  } catch (error) {
    // 4. Return a generic error if chat history cannot be loaded
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};
