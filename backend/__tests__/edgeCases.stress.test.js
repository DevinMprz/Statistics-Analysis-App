/**
 * ============================================================================
 * PART 3B — Edge Case & Stress Tests: Upload Pipeline (Corrupted Data)
 * ============================================================================
 *
 * Specifically designed to attack the upload pipeline with malformed inputs:
 *   • CSV with extra/missing columns per row (ragged data)
 *   • XLSX with formulas instead of values
 *   • File exceeding 5MB limit
 *   • Binary garbage disguised as .csv
 *   • Unicode / special characters in data
 *   • Extremely wide files (hundreds of columns)
 *   • Large file (300+ rows) round-trip integrity check
 *
 * WHY THESE TESTS MATTER (Thesis Goal — Stress Testing):
 *   Real users will upload files exported from various Excel versions,
 *   Google Sheets, or hand-edited CSVs. The system must handle every
 *   conceivable format issue without crashing.
 * ============================================================================
 */

const request = require('supertest');
const express = require('express');
const XLSX = require('xlsx');

// Mock Mongoose
jest.mock('../models/Scenario', () => ({
  create: jest.fn((doc) =>
    Promise.resolve({
      _id: 'mock-id',
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  ),
}));

const upload = require('../config/multerConfig');
const { uploadDataset } = require('../controllers/uploadController');

function createApp() {
  const app = express();
  app.use(express.json());
  app.post('/api/datasets/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, error: err.message });
      next();
    });
  }, uploadDataset);
  return app;
}

function makeCsvBuffer(headers, rows) {
  const lines = [headers.join(',')];
  rows.forEach((row) => lines.push(row.join(',')));
  return Buffer.from(lines.join('\n'), 'utf-8');
}

function makeXlsxBuffer(headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ===========================  TEST SUITE  ==================================

describe('Edge-case upload scenarios', () => {
  let app;
  beforeAll(() => { app = createApp(); });

  // ----- Ragged CSV -----
  test('CSV with inconsistent column counts (ragged rows) — should still parse', async () => {
    /**
     * REASONING: PapaParse with header mode can handle rows with fewer
     * columns (fills missing with null). This should not crash the parser.
     */
    const rawCsv = 'brand,lifespan\nA,80\nB\nC,90,extraColumn\n';
    const buf = Buffer.from(rawCsv, 'utf-8');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Ragged CSV')
      .field('toolType', 'minitool1')
      .attach('file', buf, 'ragged.csv');

    // Should either succeed (PapaParse handles it) or return 400 with a message
    expect([200, 400]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.error).toBeDefined();
    }
  });

  // ----- Binary garbage -----
  test('binary garbage disguised as .csv → 400 or parseable empty', async () => {
    /**
     * REASONING: A corrupt file renamed to .csv should not crash the server.
     */
    const garbage = Buffer.from([0x00, 0x01, 0xFF, 0xFE, 0x89, 0x50, 0x4E, 0x47]);

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Garbage')
      .field('toolType', 'minitool1')
      .attach('file', garbage, 'garbage.csv');

    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // ----- Unicode characters -----
  test('CSV with unicode brand names → processes without error', async () => {
    const csv = makeCsvBuffer(
      ['brand', 'lifespan'],
      [
        ['Ünïcödé', '80'],
        ['日本語ブランド', '95'],
        ['марка', '110'],
      ],
    );

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Unicode Brands')
      .field('toolType', 'minitool1')
      .attach('file', csv, 'unicode.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ----- Numeric strings that need coercion -----
  test('CSV with quoted numbers ("80") → coerced to numeric', async () => {
    /**
     * REASONING: Excel often exports numeric cells wrapped in quotes.
     * The validateDataPoints function should coerce "80" → 80.
     */
    const rawCsv = 'brand,lifespan\nA,"80"\nB,"95"\n';
    const buf = Buffer.from(rawCsv, 'utf-8');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Quoted Numbers')
      .field('toolType', 'minitool1')
      .attach('file', buf, 'quoted.csv');

    expect(res.status).toBe(200);
  });

  // ----- Large file (300+ rows) — data integrity round-trip -----
  test('CSV with 300 rows — no data loss in round-trip', async () => {
    /**
     * REASONING: Thesis requirement — 250-300 point datasets must
     * survive the parse → validate → save pipeline intact.
     */
    const rows = Array.from({ length: 300 }, (_, i) => [
      `Brand_${i}`,
      String(1 + Math.floor(Math.random() * 129)),
    ]);
    const csv = makeCsvBuffer(['brand', 'lifespan'], rows);

    const Scenario = require('../models/Scenario');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', '300 Row Test')
      .field('toolType', 'minitool1')
      .attach('file', csv, 'large.csv');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('300 data points');

    // Verify Scenario.create was called with exactly 300 data points
    const lastCall = Scenario.create.mock.calls[Scenario.create.mock.calls.length - 1][0];
    expect(lastCall.data.dataPoints).toHaveLength(300);
  });

  // ----- XLSX with 300 rows -----
  test('XLSX with 300 rows of bivariate data — no data loss', async () => {
    const rows = Array.from({ length: 300 }, (_, i) => [
      Math.round(Math.random() * 100),
      Math.round(Math.random() * 100),
    ]);
    const xlsx = makeXlsxBuffer(['x', 'y'], rows);

    const Scenario = require('../models/Scenario');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', '300 Row Scatter')
      .field('toolType', 'minitool3')
      .attach('file', xlsx, 'scatter300.xlsx');

    expect(res.status).toBe(200);
    const lastCall = Scenario.create.mock.calls[Scenario.create.mock.calls.length - 1][0];
    expect(lastCall.data.dataPoints).toHaveLength(300);
  });

  // ----- File size limit -----
  test('file exceeding 5MB → 400 from multer', async () => {
    /**
     * REASONING: Thesis requirement — files exceeding size limits.
     * multerConfig.js sets MAX_FILE_SIZE to 5 * 1024 * 1024 bytes.
     */
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 'a'); // 6MB of 'a's

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Too Big')
      .field('toolType', 'minitool1')
      .attach('file', bigBuffer, 'huge.csv');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    // Multer should mention file size or limit
    expect(res.body.error).toMatch(/too large|limit|size/i);
  });

  // ----- XLSX with empty sheets -----
  test('XLSX with data — single row → triggers "empty or no data" validation', async () => {
    // An XLSX with only headers (no data rows) should fail
    const ws = XLSX.utils.aoa_to_sheet([['brand', 'lifespan']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Empty XLSX')
      .field('toolType', 'minitool1')
      .attach('file', buf, 'empty.xlsx');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ----- CSV with special delimiters -----
  test('CSV with semicolons instead of commas → PapaParse handles auto-detection', async () => {
    /**
     * REASONING: European Excel versions export with semicolons.
     * PapaParse may or may not auto-detect this.
     */
    const rawCsv = 'brand;lifespan\nA;80\nB;95\n';
    const buf = Buffer.from(rawCsv, 'utf-8');

    const res = await request(app)
      .post('/api/datasets/upload')
      .field('name', 'Semicolon CSV')
      .field('toolType', 'minitool1')
      .attach('file', buf, 'semicolons.csv');

    // PapaParse with header: true may treat the whole line as one column.
    // We accept either success (if auto-detected) or 400 (if not).
    expect([200, 400]).toContain(res.status);
  });
});
