const express = require("express");
const Scenario = require("../models/Scenario");
const upload = require("../config/multerConfig");
const { uploadDataset } = require("../controllers/uploadController");
const { validateCanonical } = require("../utils/scenarioValidator");

const router = express.Router();

// Thin wrapper kept for backwards compatibility within this file.
// All validation logic lives in utils/scenarioValidator.js (single source of truth).
const validateData = (data, toolType) => validateCanonical(data, toolType);

/**
 * GET /api/scenarios
 * Retrieve all scenarios
 */
router.get("/", async (req, res) => {
  try {
    const scenarios = await Scenario.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: scenarios.length,
      data: scenarios,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/scenarios/tool/:toolType
 * Retrieve all scenarios for a specific tool type
 */
router.get("/tool/:toolType", async (req, res) => {
  try {
    const validToolTypes = [
      "minitool1",
      "minitool2_cholesterol",
      "minitool2_speedtrap",
      "minitool3",
    ];
    if (!validToolTypes.includes(req.params.toolType)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid toolType. Must be minitool1, minitool2_cholesterol, minitool2_speedtrap, or minitool3",
      });
    }

    const scenarios = await Scenario.find({
      toolType: req.params.toolType,
    }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: scenarios.length,
      data: scenarios,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/scenarios/:id
 * Retrieve a single scenario by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found",
      });
    }
    res.json({
      success: true,
      data: scenario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/scenarios
 * Create a new scenario
 * Body: { name, description, toolType, data }
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, toolType, data, minLifespan, maxLifespan } =
      req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Scenario name is required",
      });
    }

    if (!toolType) {
      return res.status(400).json({
        success: false,
        error:
          "toolType is required (minitool1, minitool2_cholesterol, minitool2_speedtrap, or minitool3)",
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: "Data is required",
      });
    }

    // Validate data structure based on toolType
    try {
      if (!validateData(data, toolType)) {
        return res.status(400).json({
          success: false,
          error: `Data structure is invalid for ${toolType}`,
        });
      }
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message,
      });
    }

    const scenario = new Scenario({
      name,
      description: description || "",
      toolType,
      data,
      minLifespan: minLifespan || null,
      maxLifespan: maxLifespan || null,
    });

    await scenario.save();
    res.status(201).json({
      success: true,
      message: "Scenario created successfully",
      data: scenario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/scenarios/:id
 * Update an existing scenario
 * Body: { name, description, data, minLifespan, maxLifespan }
 */
router.put("/:id", async (req, res) => {
  try {
    const { name, description, data, minLifespan, maxLifespan } = req.body;

    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found",
      });
    }

    // Update fields if provided
    if (name) scenario.name = name;
    if (description !== undefined) scenario.description = description;
    if (data) {
      // Validate new data structure
      if (!validateData(data, scenario.toolType)) {
        return res.status(400).json({
          success: false,
          error: `Data structure is invalid for ${scenario.toolType}`,
        });
      }
      scenario.data = data;
      // `data` is a Mixed-typed field, so Mongoose cannot detect deep mutations
      // automatically. We mark it dirty explicitly to guarantee the write.
      scenario.markModified("data");
    }
    if (minLifespan !== undefined) scenario.minLifespan = minLifespan;
    if (maxLifespan !== undefined) scenario.maxLifespan = maxLifespan;

    await scenario.save();
    res.json({
      success: true,
      message: "Scenario updated successfully",
      data: scenario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario
 */
router.delete("/:id", async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: "Scenario not found",
      });
    }
    res.json({
      success: true,
      message: "Scenario deleted successfully",
      data: scenario,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/scenarios/upload
 * Upload a CSV or Excel file, parse it, validate it, and save as a Scenario.
 *
 * The multer error handler wraps the upload middleware so that
 * file-type and file-size errors return a clean 400 instead of crashing.
 */
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || "File upload failed.",
      });
    }
    next();
  });
}, uploadDataset);

module.exports = router;
