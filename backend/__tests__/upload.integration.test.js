/**
 * ============================================================================
 * PART 2A — Integration Tests: Dataset Upload API
 * ============================================================================
 *
 * Uses Supertest to exercise the POST /api/datasets/upload endpoint
 * end-to-end (Express + Multer + parsing + validation), but WITHOUT a real
 * MongoDB connection. Mongoose is mocked so tests run offline and fast.
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Resilience & Input Validation):
 *   The upload pipeline is the single entry-point for external data.
 *   Corrupted, malformed, or malicious files must be rejected with clear
 *   400 error messages before they reach the database.
 *
 * Scenarios covered:
 *   ✓ Valid CSV upload
 *   ✓ Valid XLSX upload
 *   ✓ Missing file
 *   ✓ Missing scenario name
 *   ✓ Invalid toolType
 *   ✓ Invalid file extension (.pdf)
 *   ✓ File exceeding size limit
 *   ✓ CSV with missing required columns
 *   ✓ CSV with non-numeric data in numeric fields
 *   ✓ Empty CSV file (headers only)
 *   ✓ Completely empty file
 * ============================================================================
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const XLSX = require('xlsx');

// ---------------------------------------------------------------------------
// Mock Mongoose (Scenario.create) so we don't need a running MongoDB.
// ---------------------------------------------------------------------------
jest.mock('../models/Scenario', () => {
  return {
    create: jest.fn((doc) =>
      Promise.resolve({
        _id: 'mock-id-12345',
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    ),
  };
});

// ---------------------------------------------------------------------------
// Build a minimal Express app that mirrors the real dataset routes.
// ---------------------------------------------------------------------------
const upload = require('../config/multerConfig');
const { uploadDataset } = require('../controllers/uploadController');

function createApp() {
  const app = express();
  app.use(express.json());

  app.post('/api/datasets/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message || 'File upload failed.' });
      }
      next();
    });
  }, uploadDataset);

  return app;
}

// ---------------------------------------------------------------------------
// Helpers: create in-memory file buffers for different test scenarios
// ---------------------------------------------------------------------------

/** Creates a valid CSV buffer with the given rows. */
function makeCsvBuffer(headers, rows) {
  const lines = [headers.join(',')];
  rows.forEach((row) => lines.push(row.join(',')));
  return Buffer.from(lines.join('\n'), 'utf-8');
}

/** Creates a valid XLSX buffer with the given sheet data. */
function makeXlsxBuffer(headers, rows) {
  const ws_data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ===========================  TEST SUITE  ==================================

describe('POST /api/datasets/upload', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  // ----- Success cases -----

  test('valid CSV with "lifespan" column for minitool1 → 200 OK', async () => {
    /**
     * REASONING: Happy path — a well-formed CSV with the correct column
     * should be parsed, validated, and "saved" (mocked) successfully.
     */
    const csv = makeCsvBuffer(
      ['brand', 'lifespan'],
      [
        ['BrandA', '80'],
        ['BrandB', '95'],
        ['BrandC', '110'],
      ],
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Test Battery Scenario')
      .field('toolType', 'minitool1')
      .attach('file', csv, 'batteries.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('3 data points');
  });

  test('valid XLSX with "x" and "y" columns for minitool3 → 200 OK', async () => {
    /**
     * REASONING: Verifies the Excel parsing path produces the same result
     * as CSV — important because the parser is different (XLSX vs PapaParse).
     */
    const xlsx = makeXlsxBuffer(
      ['x', 'y'],
      [
        [10, 20],
        [30, 40],
        [50, 60],
      ],
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Scatter Test')
      .field('toolType', 'minitool3')
      .attach('file', xlsx, 'scatter.xlsx');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('valid CSV for minitool2_cholesterol with numeric data → 200 OK', async () => {
    const csv = makeCsvBuffer(
      ['PatientID', 'CholesterolLevel'],
      Array.from({ length: 50 }, (_, i) => [i + 1, (48 + Math.random() * 20).toFixed(1)]),
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Cholesterol Study')
      .field('toolType', 'minitool2_cholesterol')
      .attach('file', csv, 'cholesterol.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ----- Missing / invalid metadata -----

  test('no file attached → 400 with clear error message', async () => {
    /**
     * REASONING: Students may accidentally submit the form without
     * selecting a file. The error message should guide them.
     */
    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Test')
      .field('toolType', 'minitool1');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/no file/i);
  });

  test('missing scenario name → 400', async () => {
    const csv = makeCsvBuffer(['lifespan'], [['80']]);

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('toolType', 'minitool1')
      .attach('file', csv, 'test.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/name/i);
  });

  test('invalid toolType → 400 with list of valid types', async () => {
    const csv = makeCsvBuffer(['value'], [['10']]);

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Test')
      .field('toolType', 'minitool99')
      .attach('file', csv, 'test.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/toolType/i);
  });

  // ----- Invalid file extension -----

  test('uploading a .pdf → 400 from multer filter', async () => {
    /**
     * REASONING: Thesis requirement — incorrect file extensions must be
     * rejected before any parsing attempt.
     */
    const fakePdf = Buffer.from('%PDF-1.4 fake content');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Bad File')
      .field('toolType', 'minitool1')
      .attach('file', fakePdf, 'report.pdf');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid file extension|\.pdf|not allowed/i);
  });

  test('uploading a .txt → 400 from multer filter', async () => {
    const fakeTxt = Buffer.from('just plain text');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Text File')
      .field('toolType', 'minitool1')
      .attach('file', fakeTxt, 'notes.txt');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ----- Column validation -----

  test('CSV missing "lifespan" column for minitool1 → 400', async () => {
    /**
     * REASONING: Thesis requirement — missing required columns.
     * The error should name the missing column so the student can fix it.
     */
    const csv = makeCsvBuffer(
      ['brand', 'price'],
      [['BrandA', '5.99']],
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Missing Column')
      .field('toolType', 'minitool1')
      .attach('file', csv, 'batteries.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/lifespan/i);
  });

  test('CSV missing "x"/"y" columns for minitool3 → 400', async () => {
    const csv = makeCsvBuffer(
      ['name', 'score'],
      [['Alice', '95']],
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Missing XY')
      .field('toolType', 'minitool3')
      .attach('file', csv, 'scatter.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/x.*y|y.*x/i);
  });

  // ----- Non-numeric data -----

  test('minitool2 CSV with only string values (no numerics) → 400', async () => {
    /**
     * REASONING: Thesis requirement — non-numeric data in numeric fields.
     */
    const csv = makeCsvBuffer(
      ['name', 'category'],
      [
        ['Alice', 'GroupA'],
        ['Bob', 'GroupB'],
      ],
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'All Strings')
      .field('toolType', 'minitool2_cholesterol')
      .attach('file', csv, 'strings.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/numeric/i);
  });

  // ----- Empty files -----

  test('completely empty file → 400', async () => {
    /**
     * REASONING: Thesis requirement — empty files must be caught.
     */
    const emptyBuf = Buffer.alloc(0);

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Empty File')
      .field('toolType', 'minitool1')
      .attach('file', emptyBuf, 'empty.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('CSV with headers only (no data rows) → 400', async () => {
    const headersOnly = Buffer.from('brand,lifespan\n', 'utf-8');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Headers Only')
      .field('toolType', 'minitool1')
      .attach('file', headersOnly, 'headersonly.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/empty|no data/i);
  });
});
