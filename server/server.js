import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import http from "http";
import { app } from "./src/app.js";
import { client } from "./src/database/chroma.db.js";
const server = http.createServer(app);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
