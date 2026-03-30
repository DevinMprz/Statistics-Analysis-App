const express = require("express");
const Scenario = require("../models/Scenario");

const router = express.Router();

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
 * Body: { name, description, data, minLifespan, maxLifespan }
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, data, minLifespan, maxLifespan } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Scenario name is required",
      });
    }

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: "Data array is required",
      });
    }

    const scenario = new Scenario({
      name,
      description: description || "",
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
    if (data) scenario.data = data;
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

module.exports = router;
