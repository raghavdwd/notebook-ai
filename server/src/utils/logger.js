import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const targets = [];

if (isDev) {
  targets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss",
      ignore: "pid,hostname",
      levelFirst: true,
    },
    level: "debug",
  });
} else {
  targets.push({
    target: "pino/file",
    options: {
      destination: "./logs/app.log",
      mkdir: true,
    },
    level: "info",
  });
}

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev ? { targets } : undefined,
});

// export default logger;
