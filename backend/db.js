const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');

function getDb() {
  const db = new sqlite3.Database(DB_PATH);
  return db;
}

module.exports = { getDb, DB_PATH };
