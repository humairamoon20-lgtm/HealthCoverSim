const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');


const dbPath = path.join(__dirname, 'healthcoversim.db');
const db = new Database(dbPath);


db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');


const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
db.exec(initSQL);

console.log('Database initialised at:', dbPath);

module.exports = db;
