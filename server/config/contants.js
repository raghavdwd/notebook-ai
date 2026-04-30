import { config } from "dotenv";

config({ path: "./.env" });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const GEMINI_EMBEDDINGS_MODEL = "gemini-embedding-001";
export const CHROMADB_API_KEY = process.env.CHROMADB_API_KEY;
export const JWT_SECRET = process.env.MY_JWT_SECRET;
//console.log(JWT_SECRET);
