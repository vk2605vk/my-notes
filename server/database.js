// server/database.js - SQLite Database Setup and Connection

const Database = require('better-sqlite3');
const path = require('path');

// 1. Specify the path to our SQLite database file in the project root
const dbPath = path.join(__dirname, '..', 'notes.db');

// 2. Open or create the database file
const db = new Database(dbPath);

// 3. Improve SQLite performance and concurrency using WAL (Write-Ahead Logging) mode
db.pragma('journal_mode = WAL');

// 4. Create the 'users' table if it does not exist already
// Each user has a unique username and a bcrypt-hashed password
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DA
    TETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
db.exec(createUsersTableQuery);

// 5. Create the 'notes' table if it does not exist already
// Note: user_id links each note to the user who created it
const createNotesTableQuery = `
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;
db.exec(createNotesTableQuery);

// 6. Migration check: If the notes table was created in an earlier version without user_id,
// we safely alter the table to add the user_id column without losing existing data.
const notesColumns = db.pragma('table_info(notes)');
const hasUserId = notesColumns.some(col => col.name === 'user_id');
if (!hasUserId) {
  db.exec('ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES users(id)');
  console.log('Migrated database: added user_id column to notes table.');
}

// 7. Migration check: If the users table does not have a 'role' column yet,
// we safely add it and assign every existing user the 'User' role.
const usersColumns = db.pragma('table_info(users)');
const hasRole = usersColumns.some(col => col.name === 'role');
if (!hasRole) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'User'");
  console.log("Migrated database: added role column to users table.");
}

// Promote 'sonal' to Super Admin so you have full master access to test all features!
db.prepare("UPDATE users SET role = 'Super Admin' WHERE username = 'sonal'").run();

console.log('Database initialized successfully: users (with roles) and notes tables ready.');

// 7. Export the database connection
module.exports = db;
