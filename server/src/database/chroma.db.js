import { CloudClient } from "chromadb";
import { CHROMADB_API_KEY } from "../../config/contants.js";

async function initChroma() {
  const client = new CloudClient({
    apiKey: CHROMADB_API_KEY,
    tenant: "11489e26-4f87-43cf-9a04-80b0a61aa74e",
    database: "notebook-lm",
  });
  console.log("ChromaDB CloudClient created.");

  const collection = await client.getOrCreateCollection({
    name: "notebook-lm",
  });
  console.log("ChromaDB collection ready.");

  return { client, collection };
}

export const { client, collection } = await initChroma();
