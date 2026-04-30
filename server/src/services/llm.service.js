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

export const getTextResponse = async (userMsg, vectorData) => {
  // 1. Build a chat completion request using the user question and retrieved document chunks
  const response = await openai.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content: `Based on user query you have to provide user a structured and formatted response from provide a pdf chunked data. you have to provide user page source and important data related to user query.Here is pdf vectorData: ${JSON.stringify(
          vectorData,
        )}`,
      },
      {
        role: "user",
        content: userMsg,
      },
    ],
  });

  // 2. Return only the assistant's answer text to the controller
  return response.choices[0].message.content;
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
