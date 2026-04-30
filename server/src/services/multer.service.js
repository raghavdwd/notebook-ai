import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Service for configuring Multer file uploads.
 * This stores uploaded files on disk before they are parsed and embedded.
 */

// 1. Resolve the local uploads directory from the current server working directory
const uploadDir = path.join(process.cwd(), "uploads");

// 2. Create the uploads directory if it does not exist yet
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configure Multer disk storage for uploaded documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Upload directory
  },
  filename: (req, file, cb) => {
    // 4. Generate a unique filename while preserving the original extension
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    const baseName = path.basename(
      file.originalname,
      path.extname(file.originalname),
    );
    cb(null, baseName + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// 5. Export the configured Multer middleware for upload routes
export const upload = multer({ storage });
