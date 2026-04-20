const path = require("path");
const XLSX = require("xlsx");
const Papa = require("papaparse");
const Scenario = require("../models/Scenario");

/**
 * Parse a CSV buffer into an array of objects.
 * Uses PapaParse with header mode so each row becomes { col1: val, col2: val, ... }.
 */
function parseCsv(buffer) {
  const text = buffer.toString("utf-8");
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // auto-converts numbers
  });

  if (result.errors.length > 0) {
    // Filter out only fatal errors (not just warnings)
    const fatalErrors = result.errors.filter((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    if (fatalErrors.length > 0) {
      throw new Error(
        `CSV parsing error: ${fatalErrors.map((e) => e.message).join("; ")}`,
      );
    }
  }

  return result.data;
}

/**
 * Parse an Excel buffer into an array of objects.
 * Reads only the first sheet and converts it to JSON with headers.
 */
function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (workbook.SheetNames.length === 0) {
    throw new Error("Excel file contains no sheets.");
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON — first row is used as header
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

  return rows;
}

// Valid toolType values matching the Scenario model enum
const VALID_TOOL_TYPES = [
  "minitool1",
  "minitool2_cholesterol",
  "minitool2_speedtrap",
  "minitool3",
];

/**
 * Validate that parsed data points meet the minimum requirements:
 * - Non-empty array
 * - Each row is an object
 * - Numeric columns actually contain numbers (coerce when possible)
 *
 * Returns the cleaned data points array.
 */
function validateDataPoints(dataPoints, toolType) {
  if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
    throw new Error("Parsed file is empty or contains no data rows.");
  }

  // Ensure every item is a plain object (not null / undefined / primitive)
  for (let i = 0; i < dataPoints.length; i++) {
    if (typeof dataPoints[i] !== "object" || dataPoints[i] === null) {
      throw new Error(`Row ${i + 1} is not a valid data object.`);
    }
  }

  // Minitool-specific validations
  const columns = Object.keys(dataPoints[0]);

  switch (toolType) {
    case "minitool1":
      // Minitool 1 (battery bars): expects at least a numeric "lifespan" column
      if (!columns.some((c) => c.toLowerCase() === "lifespan")) {
        throw new Error(
          "Missing required column 'lifespan' for Minitool 1. Found columns: " +
            columns.join(", "),
        );
      }
      break;

    case "minitool2_cholesterol":
    case "minitool2_speedtrap":
      // Minitool 2 (cholesterol / speedtrap): expects numeric data columns
      // At minimum, there should be at least one numeric column
      {
        const hasNumeric = dataPoints.some((row) =>
          Object.values(row).some((v) => typeof v === "number" && !isNaN(v)),
        );
        if (!hasNumeric) {
          throw new Error(
            "Minitool 2 datasets must contain at least one numeric column.",
          );
        }
      }
      break;

    case "minitool3":
      // Minitool 3 (scatter plot): expects 'x' and 'y' columns
      {
        const lowerCols = columns.map((c) => c.toLowerCase());
        if (!lowerCols.includes("x") || !lowerCols.includes("y")) {
          throw new Error(
            "Missing required columns 'x' and/or 'y' for Minitool 3. Found columns: " +
              columns.join(", "),
          );
        }
      }
      break;
  }

  // Coerce numeric-looking strings to numbers across all rows
  const cleaned = dataPoints.map((row) => {
    const cleanedRow = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        const num = Number(trimmed);
        cleanedRow[key] = trimmed !== "" && !isNaN(num) ? num : trimmed;
      } else {
        cleanedRow[key] = value;
      }
    }
    return cleanedRow;
  });

  return cleaned;
}

/**
 * POST /api/datasets/upload
 *
 * Expects a multipart/form-data request with:
 *   - file: the CSV or Excel file
 *   - name: (string) scenario name
 *   - description: (string, optional) scenario description
 *   - toolType: (string) one of: minitool1, minitool2_cholesterol, minitool2_speedtrap, minitool3
 */
async function uploadDataset(req, res) {
  try {
    // --- 1. Check that a file was provided ---
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded. Please select a .csv, .xls, or .xlsx file.",
      });
    }

    // --- 2. Extract and validate metadata from the request body ---
    const { name, description, toolType } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Scenario name is required.",
      });
    }

    if (!VALID_TOOL_TYPES.includes(toolType)) {
      return res.status(400).json({
        success: false,
        error:
          "toolType must be one of: " +
          VALID_TOOL_TYPES.join(", ") +
          ". Received: " +
          toolType,
      });
    }

    // --- 3. Parse the file based on its extension ---
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawData;

    try {
      if (ext === ".csv") {
        rawData = parseCsv(req.file.buffer);
      } else if (ext === ".xls" || ext === ".xlsx") {
        rawData = parseExcel(req.file.buffer);
      } else {
        // Should not reach here because of multer filter, but just in case
        return res.status(400).json({
          success: false,
          error: `Unsupported file format "${ext}".`,
        });
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: "File parsing failed: " + parseError.message,
      });
    }

    // --- 4. Validate the parsed data ---
    let dataPoints;
    try {
      dataPoints = validateDataPoints(rawData, toolType);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: "Data validation failed: " + validationError.message,
      });
    }

    // --- 5. Save to MongoDB as a Scenario ---
    const scenario = await Scenario.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      toolType,
      data: {
        originalFileName: req.file.originalname,
        columns: Object.keys(dataPoints[0]),
        dataPoints,
      },
    });

    // --- 6. Return success ---
    return res.status(200).json({
      success: true,
      message: `Scenario "${scenario.name}" uploaded successfully with ${dataPoints.length} data points.`,
      data: scenario,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error while processing the upload.",
    });
  }
}

module.exports = { uploadDataset };
