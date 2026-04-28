const multer = require("multer");
const path = require("path");

// Allowed MIME types and extensions for CSV and Excel files
const ALLOWED_MIMES = [
  "text/csv",
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

const ALLOWED_EXTENSIONS = [".csv", ".xls", ".xlsx"];

// 5 MB file size limit
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Multer configuration:
 * - Memory storage (no temp files on disk)
 * - File type filter for CSV/Excel only
 * - 5MB size limit
 */
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new Error(
          `Invalid file extension "${ext}". Only .csv, .xls, and .xlsx files are allowed.`,
        ),
        false,
      );
    }

    // Some systems may not set the MIME type correctly, so we check extension first
    // and treat MIME as a secondary check (log warning but don't reject)
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      console.warn(
        `Warning: file "${file.originalname}" has unexpected MIME type "${file.mimetype}", but extension is valid.`,
      );
    }

    cb(null, true);
  },
});

module.exports = upload;
