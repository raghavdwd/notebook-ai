import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 900, // Limit each IP to 900 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter specifically for auth endpoints (login, signup, resend-verification)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
