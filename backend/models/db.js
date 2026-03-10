const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'dataset.db');

let _db = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
  }
  return _db;
}

function resetDb() {
  const db = getDb();
  db.exec(`DROP TABLE IF EXISTS dataset`);
  db.exec(`DROP TABLE IF EXISTS dataset_meta`);
}

module.exports = { getDb, resetDb };
