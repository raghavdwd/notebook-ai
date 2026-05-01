import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import authRoute from "./routes/auth.route.js";
import uploadRoute from "./routes/upload.route.js";
import chatRoute from "./routes/chat.route.js";
import userRoute from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import { verifyJwtToken } from "./middlewares/auth.middleware.js";
import { CLIENT_APP_URL } from "../config/contants.js";

export const app = express();

//endpoint logs
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  }),
);
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(compression({ level: -1 }));
app.use(morgan("dev"));
app.use(
  cors({
    origin: [CLIENT_APP_URL, "http://localhost:5173", "http://localhost:3001"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//api endpoints
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/chat", verifyJwtToken, chatRoute);
app.use("/api/v1/users", verifyJwtToken, userRoute);
app.use("/api/v1/upload", verifyJwtToken, uploadRoute);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Notebook API");
});
