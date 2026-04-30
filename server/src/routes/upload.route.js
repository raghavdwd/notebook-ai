import express from "express";
import {
  handlePdfUpload,
  getUploadedFiles,
  deleteUploadedFiles,
} from "../controllers/upload.controller.js";
import { upload } from "../services/multer.service.js";

const router = express.Router();

router.post("/", upload.single("pdfFile"), handlePdfUpload);
router.get("/", getUploadedFiles);
router.delete("/:fileId", deleteUploadedFiles);

export default router;
