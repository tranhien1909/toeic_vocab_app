const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');

if (fs.existsSync(DB_PATH)) {
  console.log('Removing existing database...');
  fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // topics
  db.run(`CREATE TABLE topics (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT
  )`);

  // vocabularies
  db.run(`CREATE TABLE vocabularies (
    id INTEGER PRIMARY KEY,
    topic_id INTEGER,
    word TEXT,
    pronunciation TEXT,
    meaning TEXT,
    word_type TEXT,
    collocation TEXT,
    example TEXT,
    example_meaning TEXT,
    FOREIGN KEY(topic_id) REFERENCES topics(id)
  )`);

  // questions
  db.run(`CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    vocabulary_id INTEGER,
    question_text TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT,
    explanation TEXT,
    FOREIGN KEY(vocabulary_id) REFERENCES vocabularies(id)
  )`);

  // learning_progress
  db.run(`CREATE TABLE learning_progress (
    id INTEGER PRIMARY KEY,
    vocabulary_id INTEGER UNIQUE,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    last_reviewed_at TEXT,
    FOREIGN KEY(vocabulary_id) REFERENCES vocabularies(id)
  )`);

  // wrong_words
  db.run(`CREATE TABLE wrong_words (
    id INTEGER PRIMARY KEY,
    vocabulary_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(vocabulary_id) REFERENCES vocabularies(id)
  )`);

  console.log('Database initialized at', DB_PATH);
});

db.close();
