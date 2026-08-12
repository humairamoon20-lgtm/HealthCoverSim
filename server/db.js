const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create or connect to the SQLite database
const dbPath = path.join(__dirname, 'healthcoversim.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Read and execute the init.sql schema
const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
db.exec(initSQL);

console.log('Database initialised at:', dbPath);

module.exports = db;
