import OpenAI from "openai";
import {
  GEMINI_API_KEY,
  GEMINI_EMBEDDINGS_MODEL,
} from "../../config/contants.js";

const openai = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

/**
 * Service for calling Gemini through the OpenAI-compatible API.
 * This includes embeddings, document-grounded answers, and AI-generated chat titles.
 */

export const getEmbeddings = async (text) => {
  // 1. Send the text to Gemini's embedding model
  const embedding = await openai.embeddings.create({
    model: GEMINI_EMBEDDINGS_MODEL,
    input: text,
    encoding_format: "float",
  });

  // 2. Return the raw embedding vector for ChromaDB storage or search
  return embedding.data[0].embedding;
  //console.log(embedding.data[0].embedding);
};

export const getTextResponse = async (userMsg, vectorData, history = []) => {
  const vectorStr =
    vectorData && vectorData.length > 0
      ? JSON.stringify(vectorData)
      : "No relevant documents found";

  const systemPrompt = `You are a precise document assistant. Answer the user's question using ONLY the provided PDF chunks below.
    ## Context (PDF Chunks)
    ${vectorStr}

    ## Instructions
    1. **Answer directly** using only the information in the chunks above
    2. **Cite sources** for every key fact using [Page X] format
    3. If the answer spans multiple pages, synthesize clearly
    4. If the chunks don't contain the answer, say: "The provided document chunks do not contain sufficient information to answer this."
    5. Keep responses concise unless the user asks for detail
    ## Output Format
    - **Answer**: [Direct response with inline citations]
    - **Key Details**: [Bullet points of important extracted data]
    - **Sources**: [Page numbers referenced]

    ## User Question
    {user_query}`;

  const validHistory = Array.isArray(history)
    ? history.filter((m) => m && m.role && m.content)
    : [];

  const messages = [
    { role: "system", content: systemPrompt },
    ...validHistory,
    { role: "user", content: userMsg },
  ];

  const response = await openai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error("No response from LLM");
  }

  return (
    response.choices[0].message.content ||
    "I apologize, but I couldn't generate a response."
  );
};

export const summarizeConversation = async (messages) => {
  const conversationText = messages
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "AI"}: ${m.role === "user" ? m.userMsg : m.aiResponse}`,
    )
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content:
          "Summarize this conversation into a brief context (2-3 sentences) that captures the key topics and questions discussed. Keep it concise.",
      },
      {
        role: "user",
        content: conversationText,
      },
    ],
  });

  return response.choices[0].message.content.trim();
};

export const generateChatTitle = async (userMsg) => {
  // 1. Ask the model to summarize the first user message into a short session title
  const response = await openai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content:
          "Create a short chat title from the user message. Max 6 words. Return only the title, without quotes or extra punctuation.",
      },
      {
        role: "user",
        content: userMsg,
      },
    ],
  });

  // 2. Normalize the title so it is safe to show directly in the chat sidebar
  const title = response.choices[0].message.content
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[.!?]+$/g, "");

  // 3. Fall back to a short slice of the user message if the model returns an empty title
  return title || userMsg.slice(0, 40);
};
