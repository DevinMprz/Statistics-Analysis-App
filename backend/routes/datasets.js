const express = require("express");
const upload = require("../config/multerConfig");
const { uploadDataset } = require("../controllers/uploadController");
const Scenario = require("../models/Scenario");

const router = express.Router();

/**
 * POST /api/datasets/upload
 * Upload a CSV or Excel file, parse it, validate it, and save as a Scenario.
 *
 * The multer error handler wraps the upload middleware so that
 * file-type and file-size errors return a clean 400 instead of crashing.
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

/**
 * GET /api/datasets
 * Retrieve all uploaded scenarios (metadata only — excludes bulky data by default).
 */
router.get("/", async (req, res) => {
  try {
    const scenarios = await Scenario.find()
      .select("-data") // omit data for listing
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: scenarios.length,
      data: scenarios,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/datasets/:id
 * Retrieve a single uploaded scenario by ID (includes data).
 */
router.get("/:id", async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, error: "Scenario not found." });
    }
    res.json({ success: true, data: scenario });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/datasets/:id
 * Delete an uploaded scenario by ID.
 */
router.delete("/:id", async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, error: "Scenario not found." });
    }
    res.json({ success: true, message: "Scenario deleted." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
