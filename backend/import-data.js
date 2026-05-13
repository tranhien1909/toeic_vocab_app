const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database.sqlite');
const DATA_PATH = path.join(__dirname, '..', 'data', 'toeic-vocab.json');

if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found. Run npm run init-db first.');
  process.exit(1);
}

const raw = fs.readFileSync(DATA_PATH, 'utf8');
const data = JSON.parse(raw);

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  const tstmt = db.prepare(`INSERT INTO topics (id, name, description) VALUES (?, ?, ?)`);
  for (const t of data.topics) tstmt.run(t.id, t.name, t.description);
  tstmt.finalize();

  const vstmt = db.prepare(`INSERT INTO vocabularies (id, topic_id, word, pronunciation, meaning, word_type, collocation, example, example_meaning) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const v of data.vocabularies) {
    vstmt.run(v.id, v.topic_id, v.word, v.pronunciation, v.meaning, v.word_type, v.collocation || '', v.example || '', v.example_meaning || '');
  }
  vstmt.finalize();

  if (Array.isArray(data.questions)) {
    const qstmt = db.prepare(`INSERT INTO questions (id, vocabulary_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const q of data.questions) {
      qstmt.run(q.id, q.vocabulary_id, q.question_text, q.option_a || '', q.option_b || '', q.option_c || '', q.option_d || '', q.correct_answer || '', q.explanation || '');
    }
    qstmt.finalize();
  }

  console.log('Import completed.');
});

db.close();
