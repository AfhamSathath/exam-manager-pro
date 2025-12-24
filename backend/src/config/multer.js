import multer from "multer";
import fs from "fs";
import path from "path";

const uploadRoot = path.join(process.cwd(), "uploads");
const papersPath = path.join(uploadRoot, "papers");
const signaturesPath = path.join(uploadRoot, "signatures");

// Ensure upload directories exist
[papersPath, signaturesPath].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "paperFile") cb(null, papersPath);
    else if (file.fieldname === "signatureFile") cb(null, signaturesPath);
    else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF and image files are allowed"), false);
  }
  cb(null, true);
};

// Max file size 10MB
const limits = { fileSize: 10 * 1024 * 1024 };

// Export Multer middleware
// Use `.fields()` to accept multiple file fields
export const uploadFiles = multer({ storage, fileFilter, limits }).fields([
  { name: "paperFile", maxCount: 1 },
  { name: "signatureFile", maxCount: 1 },
]);
