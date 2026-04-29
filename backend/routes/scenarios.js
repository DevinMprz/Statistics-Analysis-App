const express = require("express");
const Scenario = require("../models/Scenario");

const router = express.Router();

/**
 * Validation functions for different tool types
 */
const validateData = (data, toolType) => {
  // Data object is flexible - validate based on toolType
  if (typeof data !== "object" || data === null) {
    throw new Error("Data must be an object");
  }

  switch (toolType) {
    case "minitool1":
      // Access the 'data' sub-object from the request body
      const scenarioData = data;
      // 1. Validate dataPoints array exists
      if (
        !scenarioData ||
        !scenarioData.dataPoints ||
        !Array.isArray(scenarioData.dataPoints)
      ) {
        throw new Error("Data must have a dataPoints array for minitool1");
      }

      // 2. Validate columns array exists
      if (!scenarioData.columns || !Array.isArray(scenarioData.columns)) {
        throw new Error("Data must have a columns array for minitool1");
      }

      // 3. (Optional) Validate originalFileName is a string or null
      if (
        scenarioData.originalFileName !== null &&
        typeof scenarioData.originalFileName !== "string"
      ) {
        throw new Error("originalFileName must be a string or null");
      }

      // 4. Validate each item in dataPoints
      return scenarioData.dataPoints.every(
        (item) =>
          typeof item === "object" &&
          typeof item.brand === "string" &&
          typeof item.lifespan === "number" &&
          item.lifespan >= 0 &&
          item.lifespan <= 150,
      );
    case "minitool2_cholesterol":
      // Minitool 2 - Cholesterol: data object should have dataBefore, dataAfter
      if (!data.dataBefore || !data.dataAfter) {
        throw new Error(
          "Cholesterol scenario must have dataBefore and dataAfter",
        );
      }
      return (
        Array.isArray(data.dataBefore) &&
        Array.isArray(data.dataAfter) &&
        data.dataBefore.every((item) => typeof item === "number") &&
        data.dataAfter.every((item) => typeof item === "number")
      );

    case "minitool2_speedtrap":
      // Minitool 2 - Speed Trap: data object should have dataBefore, dataAfter
      if (!data.dataBefore || !data.dataAfter) {
        throw new Error(
          "Speed trap scenario must have dataBefore and dataAfter",
        );
      }
      return (
        Array.isArray(data.dataBefore) &&
        Array.isArray(data.dataAfter) &&
        data.dataBefore.every((item) => typeof item === "number") &&
        data.dataAfter.every((item) => typeof item === "number")
      );

    case "minitool3":
      // Minitool 3: data object should have currentData array with x and y values
      if (!data.currentData || !Array.isArray(data.currentData)) {
        throw new Error("Minitool 3 scenario must have currentData array");
      }
      return data.currentData.every(
        (item) =>
          typeof item === "object" &&
          typeof item.x === "number" &&
          typeof item.y === "number",
      );

    default:
      throw new Error(
        "Invalid toolType. Supported: minitool1, minitool2_cholesterol, minitool2_speedtrap, minitool3",
      );
  }
};

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
    // 1. Destructure only the fields present in your new schema
    // Removed minLifespan and maxLifespan from destructuring
    const { name, description, toolType, data } = req.body;

    // 2. Basic Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Scenario name is required",
      });
    }

    if (!toolType) {
      return res.status(400).json({
        success: false,
        error: "toolType is required (minitool1, etc.)",
      });
    }

    if (!data) {
      return res.status(400).json({
        success: false,
        error: "Data is required",
      });
    }

    // 3. Structure Validation
    try {
      // Pass the nested 'data' object to the validator
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

    // 4. Create Scenario with the new structure
    const scenario = new Scenario({
      name,
      description: description || "",
      toolType,
      data, // This contains { originalFileName, columns, dataPoints }
      // minLifespan and maxLifespan are no longer top-level fields
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
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || "File upload failed.",
        });
      }
      next();
    });
  },
  uploadDataset,
);

module.exports = router;
