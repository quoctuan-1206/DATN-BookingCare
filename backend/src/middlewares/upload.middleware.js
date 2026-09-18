import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");
export const LAB_RESULT_DIR = path.resolve(__dirname, "../../private-uploads/lab-results");
export const CLINICAL_RESULT_DIR = LAB_RESULT_DIR;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(LAB_RESULT_DIR)) {
  fs.mkdirSync(LAB_RESULT_DIR, { recursive: true });
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  },
});

// Middleware nhận 1 file ảnh (field name = "image")
export const uploadImageMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      const error = new Error("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF");
      error.statusCode = 400;
      return cb(error);
    }
    cb(null, true);
  },
}).single("image");

const LAB_RESULT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);
const LAB_RESULT_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);

const labResultStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LAB_RESULT_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

// Middleware nhận một file kết quả xét nghiệm (field name = "result_file")
export const uploadLabResultMiddleware = multer({
  storage: labResultStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!LAB_RESULT_TYPES.has(file.mimetype) || !LAB_RESULT_EXTENSIONS.has(ext)) {
      const error = new Error("Chỉ chấp nhận file PDF, DOC hoặc DOCX");
      error.statusCode = 400;
      return cb(error);
    }
    cb(null, true);
  },
}).single("result_file");

const CLINICAL_RESULT_TYPES = new Set([
  ...ALLOWED_TYPES,
  ...LAB_RESULT_TYPES,
  "video/mp4",
  "video/webm",
]);
const CLINICAL_RESULT_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".mp4",
  ".webm",
]);

// Tệp cận lâm sàng được lưu riêng tư và chỉ tải qua endpoint có kiểm tra quyền.
export const uploadClinicalResultMiddleware = multer({
  storage: labResultStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (
      !CLINICAL_RESULT_TYPES.has(file.mimetype) ||
      !CLINICAL_RESULT_EXTENSIONS.has(ext)
    ) {
      const error = new Error(
        "Chỉ chấp nhận JPG, PNG, WEBP, GIF, PDF, DOC, DOCX, MP4 hoặc WEBM",
      );
      error.statusCode = 400;
      return cb(error);
    }
    cb(null, true);
  },
}).single("attachment");
