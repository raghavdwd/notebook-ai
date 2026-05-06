import { CloudClient } from "chromadb";
import {
  CHROMADB_API_KEY,
  CHROMADB_COLLECTION,
  CHROMADB_DATABASE,
  CHROMADB_TENANT,
} from "../../config/contants.js";

let chromaPromise;

async function initChroma() {
  if (!CHROMADB_API_KEY) {
    throw new Error("CHROMADB_API_KEY is required to connect to ChromaDB Cloud");
  }

  const client = new CloudClient({
    apiKey: CHROMADB_API_KEY,
    tenant: CHROMADB_TENANT,
    database: CHROMADB_DATABASE,
  });
  console.log("ChromaDB CloudClient created.");

  const collection = await client.getOrCreateCollection({
    name: CHROMADB_COLLECTION,
  });
  console.log("ChromaDB collection ready.");

  return { client, collection };
}

export function getChroma() {
  chromaPromise ??= initChroma().catch((error) => {
    chromaPromise = undefined;
    throw error;
  });

  return chromaPromise;
}

export async function getChromaCollection() {
  const { collection } = await getChroma();
  return collection;
}
