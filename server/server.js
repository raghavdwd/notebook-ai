import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./src/app.js";
import { logger } from "./src/utils/logger.js";

const port = process.env.PORT || 3000;
const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFile === invokedFile) {
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

export default app;
