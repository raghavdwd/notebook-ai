import { getChromaCollection } from "../database/chroma.db.js";
import { v4 as uuid } from "uuid";

/**
 * Service for storing, searching, and deleting vectors in ChromaDB.
 * This keeps vector metadata scoped by user and document for session-specific retrieval.
 */

// Helper function to sanitize metadata because Chroma only accepts primitive metadata values
function normalizeMetadata(meta) {
  if (meta == null) return null;

  if (typeof meta === "object") {
    // Convert object/array metadata into JSON strings before writing to Chroma
    return JSON.stringify(meta);
  }

  if (["string", "number", "boolean"].includes(typeof meta)) {
    return meta;
  }

  return String(meta);
}

// Helper function to normalize different embedding response shapes into a plain number array
function normalizeEmbedding(emb) {
  if (emb == null) throw new TypeError("embedding is null/undefined");

  if (typeof emb === "object" && Array.isArray(emb.embedding)) {
    emb = emb.embedding;
  }
  if (
    Array.isArray(emb) &&
    emb.length &&
    typeof emb[0] === "object" &&
    Array.isArray(emb[0].embedding)
  ) {
    emb = emb[0].embedding;
  }
  if (ArrayBuffer.isView(emb)) {
    emb = Array.from(emb);
  }
  if (!Array.isArray(emb)) {
    throw new TypeError("embedding must be an array");
  }
  if (!emb.every((x) => typeof x === "number" && Number.isFinite(x))) {
    throw new TypeError("embedding contains non-numeric values");
  }
  return emb;
}

export const addVector = async ({
  id,
  embedding,
  text,
  userId,
  fileId,
  metadata = {},
}) => {
  // 1. Normalize the embedding before sending it to ChromaDB
  const vec = normalizeEmbedding(embedding);

  // 2. Flatten metadata so every metadata value is primitive or stringified
  const flatMetadata = {};
  for (const [key, value] of Object.entries(metadata)) {
    flatMetadata[key] = normalizeMetadata(value);
  }
  try {
    const collection = await getChromaCollection();

    // 3. Store the document text, vector, and search metadata in ChromaDB
    const res = await collection.add({
      ids: [id],
      documents: [String(text ?? "")],
      metadatas: [{ userId, fileId, ...flatMetadata }],
      embeddings: [vec],
    });
    console.log(res);

    // 4. Return the generated vector ID to the upload controller
    return { id };
  } catch (error) {
    // 5. Log vector insert failures for debugging upload issues
    console.error("Error adding vector:", error);
  }
};

export const searchVector = async (embedding, userId, fileIds, n_results = 4) => {
  // 1. Validate that the query embedding is a plain number array
  if (
    !Array.isArray(embedding) ||
    !embedding.every((x) => typeof x === "number")
  ) {
    throw new Error("Invalid embedding: must be an array of numbers");
  }
  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    throw new Error("At least one file ID is required for vector search");
  }

  // 2. Search only vectors owned by the user and attached to the active session
  const collection = await getChromaCollection();

  return await collection.query({
    queryEmbeddings: [embedding],
    n_results,
    where: {
      $and: [{ userId: { $eq: userId } }, { fileId: { $in: fileIds } }],
    },
  });
};

export const deleteVector = async (id) => {
  // 1. Ensure a vector ID is provided before attempting deletion
  if (!id) {
    throw new Error("Vector ID is required for deletion");
  }
  try {
    const collection = await getChromaCollection();

    // 2. Delete the vector from ChromaDB by ID
    const res = await collection.delete({
      ids: [id],
    });
    console.log("🗑️ Vector deleted:", res);
  } catch (error) {
    // 3. Log vector delete failures for debugging cleanup issues
    console.error("Error deleting vector:", error);
  }
};
