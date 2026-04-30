import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Upload directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    const baseName = path.basename(
      file.originalname,
      path.extname(file.originalname),
    );
    cb(null, baseName + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
