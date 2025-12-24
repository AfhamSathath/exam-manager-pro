import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload directories if they don't exist
const uploadDirs = ["uploads/papers", "uploads/signatures"];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage config
const paperStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "paperFile") cb(null, "uploads/papers");
    else if (file.fieldname === "signatureFile") cb(null, "uploads/signatures");
    else cb(new Error("Invalid file field"), null);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "paperFile" && file.mimetype === "application/pdf") cb(null, true);
  else if (
    file.fieldname === "signatureFile" &&
    (file.mimetype === "image/png" || file.mimetype === "image/jpeg")
  ) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

export const uploadFiles = multer({ storage: paperStorage, fileFilter }).fields([
  { name: "paperFile", maxCount: 1 },
  { name: "signatureFile", maxCount: 1 },
]);
