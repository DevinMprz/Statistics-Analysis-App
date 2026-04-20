const express = require("express");
const upload = require("../config/multerConfig");
const { uploadDataset } = require("../controllers/uploadController");

const router = express.Router();

/**
 * POST /api/datasets/upload
 * Upload a CSV or Excel file, parse it, validate it, and save as a Scenario.
 *
 * The multer error handler wraps the upload middleware so that
 * file-type and file-size errors return a clean 400 instead of crashing.
 *
 * For listing, fetching, or deleting the created scenarios,
 * use the existing /api/scenarios endpoints.
 */
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      // Multer-specific errors (file too large, wrong type, etc.)
      return res.status(400).json({
        success: false,
        error: err.message || "File upload failed.",
      });
    }
    // If multer succeeded, continue to the controller
    next();
  });
}, uploadDataset);

module.exports = router;
