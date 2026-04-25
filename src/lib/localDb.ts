import Database from 'better-sqlite3';
import path from 'path';

// Define the path to the sqlite file
const dbPath = path.resolve(process.cwd(), 'local.db');

// Initialize the database
const db = new Database(dbPath);

// Create some default tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS local_storage (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
