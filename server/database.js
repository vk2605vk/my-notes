// server/database.js - SQLite Database Setup and Connection

const Database = require('better-sqlite3');
const path = require('path');

// 1. Specify the path to our SQLite database file in the project root
const dbPath = path.join(__dirname, '..', 'notes.db');

// 2. Open or create the database file
// If notes.db doesn't exist, better-sqlite3 will automatically create it for us.
const db = new Database(dbPath);

// 3. Improve SQLite performance and concurrency using WAL (Write-Ahead Logging) mode
db.pragma('journal_mode = WAL');

// 4. Create the 'notes' table if it does not exist already
// We define the table structure (schema) with 5 specific columns:
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

db.exec(createTableQuery);

console.log('Database initialized successfully: notes.db');

// 5. Export the database connection so other files (like server.js) can run queries
module.exports = db;
