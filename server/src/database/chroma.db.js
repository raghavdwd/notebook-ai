import { CloudClient } from "chromadb";
import { logger } from "../utils/logger.js";
import { CHROMADB_API_KEY } from "../../config/contants.js";

let chromaPromise;

async function initChroma() {
  const client = new CloudClient({
    apiKey: CHROMADB_API_KEY,
    tenant: "11489e26-4f87-43cf-9a04-80b0a61aa74e",
    database: "notebook-lm",
  });
  logger.info("ChromaDB CloudClient created.");

  const collection = await client.getOrCreateCollection({
    name: "notebook-lm",
  });
  logger.info("ChromaDB collection ready.");

  return { client, collection };
}

export function getChroma() {
  if (!chromaPromise) {
    chromaPromise = initChroma();
  }

  return chromaPromise;
}

export async function getChromaCollection() {
  const { collection } = await getChroma();

  return collection;
}
