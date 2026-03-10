const { getDb, resetDb } = require('../models/db');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');

let cachedColumns = [];

/**
 * Parse CSV buffer into rows array
 */
function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer.toString('utf-8'));
    stream
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/**
 * Parse XLSX buffer into rows array
 */
function parseXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/**
 * Sanitize column name for SQLite (replace spaces/special chars with _)
 */
function sanitizeCol(col) {
  return col.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
}

/**
 * Load dataset from file buffer into SQLite
 */
async function loadDataset(buffer, originalname) {
  const ext = originalname.split('.').pop().toLowerCase();

  let rows = [];
  if (ext === 'csv') {
    rows = await parseCsv(buffer);
  } else if (['xlsx', 'xls'].includes(ext)) {
    rows = parseXlsx(buffer);
  } else {
    throw new Error('Unsupported file type. Please upload CSV or XLSX.');
  }

  if (rows.length === 0) throw new Error('File is empty or could not be parsed.');

  const originalColumns = Object.keys(rows[0]);
  const sanitizedColumns = originalColumns.map(sanitizeCol);

  // Drop & recreate dataset table
  resetDb();
  const db = getDb();

  const colDefs = sanitizedColumns.map(c => `"${c}" TEXT`).join(', ');
  db.exec(`CREATE TABLE IF NOT EXISTS dataset (${colDefs})`);
  db.exec(`CREATE TABLE IF NOT EXISTS dataset_meta (key TEXT PRIMARY KEY, value TEXT)`);

  // Store original→sanitized column mapping
  const colMap = {};
  originalColumns.forEach((orig, i) => { colMap[orig] = sanitizedColumns[i]; });
  db.prepare(`INSERT OR REPLACE INTO dataset_meta (key, value) VALUES (?, ?)`).run('col_map', JSON.stringify(colMap));
  db.prepare(`INSERT OR REPLACE INTO dataset_meta (key, value) VALUES (?, ?)`).run('original_columns', JSON.stringify(originalColumns));

  // Insert rows in transaction
  const placeholders = sanitizedColumns.map(() => '?').join(', ');
  const insertStmt = db.prepare(`INSERT INTO dataset (${sanitizedColumns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`);

  const insertMany = db.transaction((data) => {
    for (const row of data) {
      const values = originalColumns.map(col => {
        const v = row[col];
        return v !== undefined && v !== null ? String(v) : '';
      });
      insertStmt.run(values);
    }
  });
  insertMany(rows);

  cachedColumns = originalColumns;

  return {
    columns: originalColumns,
    rowCount: rows.length,
    message: `Dataset loaded successfully with ${rows.length} rows and ${originalColumns.length} columns.`
  };
}

/**
 * Get stored column names
 */
function getColumns() {
  if (cachedColumns.length > 0) return cachedColumns;
  try {
    const db = getDb();
    const meta = db.prepare(`SELECT value FROM dataset_meta WHERE key = 'original_columns'`).get();
    if (meta) {
      cachedColumns = JSON.parse(meta.value);
      return cachedColumns;
    }
  } catch (e) { /* no dataset loaded yet */ }
  return [];
}

/**
 * Execute a structured query plan against SQLite
 */
function executeQuery(plan) {
  const db = getDb();

  // Get column mapping
  const meta = db.prepare(`SELECT value FROM dataset_meta WHERE key = 'col_map'`).get();
  if (!meta) throw new Error('No dataset loaded. Please upload a file first.');
  const colMap = JSON.parse(meta.value);

  const originalCols = getColumns();

  // Helper: find sanitized column name (case-insensitive)
  function getSanitized(col) {
    // Direct match
    if (colMap[col]) return colMap[col];
    // Case-insensitive
    const found = Object.keys(colMap).find(k => k.toLowerCase() === col.toLowerCase());
    if (found) return colMap[found];
    // Partial match
    const partial = Object.keys(colMap).find(k => k.toLowerCase().includes(col.toLowerCase()));
    if (partial) return colMap[partial];
    return null;
  }

  const xSan = getSanitized(plan.x_column || plan.group_by);
  const ySan = getSanitized(plan.y_column);
  const groupSan = getSanitized(plan.group_by || plan.x_column);

  if (!xSan) throw new Error(`Column "${plan.x_column}" not found. Available columns: ${originalCols.join(', ')}`);
  if (plan.aggregation !== 'none' && !ySan) throw new Error(`Column "${plan.y_column}" not found. Available: ${originalCols.join(', ')}`);

  // Build WHERE clause from filters
  const whereConditions = [];
  const params = [];
  if (plan.filters && plan.filters.length > 0) {
    for (const f of plan.filters) {
      const fSan = getSanitized(f.column);
      if (fSan) {
        whereConditions.push(`LOWER("${fSan}") = LOWER(?)`);
        params.push(f.value);
      }
    }
  }
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  let sql = '';
  let rows = [];

  if (plan.aggregation === 'none' || plan.chart_type === 'scatter') {
    // Raw data for scatter
    sql = `SELECT "${xSan}", "${ySan}" FROM dataset ${whereClause} LIMIT 500`;
    rows = db.prepare(sql).all(...params);
    rows = rows.map(r => ({ x: r[xSan], y: isNaN(r[ySan]) ? r[ySan] : parseFloat(r[ySan]) }));
  } else {
    // Aggregated data
    const aggFn = {
      sum: `SUM(CAST("${ySan}" AS REAL))`,
      mean: `AVG(CAST("${ySan}" AS REAL))`,
      count: `COUNT(*)`,
      max: `MAX(CAST("${ySan}" AS REAL))`,
      min: `MIN(CAST("${ySan}" AS REAL))`
    }[plan.aggregation] || `SUM(CAST("${ySan}" AS REAL))`;

    sql = `
      SELECT "${groupSan}" as x_val, ${aggFn} as y_val
      FROM dataset
      ${whereClause}
      GROUP BY "${groupSan}"
      ORDER BY y_val DESC
      LIMIT 30
    `;
    rows = db.prepare(sql).all(...params);
    rows = rows.map(r => ({
      x: r.x_val || 'Unknown',
      y: r.y_val !== null ? parseFloat(Number(r.y_val).toFixed(2)) : 0
    }));
  }

  if (rows.length === 0) {
    throw new Error('No data found for this query. Try with different filters or columns.');
  }

  return { rows, sql: sql.trim(), xColumn: plan.x_column, yColumn: plan.y_column };
}

module.exports = { loadDataset, executeQuery, getColumns };
