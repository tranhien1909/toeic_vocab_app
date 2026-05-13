const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  const sql = `SELECT w.id, w.vocabulary_id, w.created_at, v.word, v.meaning FROM wrong_words w JOIN vocabularies v ON w.vocabulary_id = v.id`;
  db.all(sql, (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { vocabulary_id } = req.body;
  if (!vocabulary_id) return res.status(400).json({ error: 'vocabulary_id required' });
  const db = getDb();
  const stmt = `INSERT INTO wrong_words (vocabulary_id) VALUES (?)`;
  db.run(stmt, [vocabulary_id], function(err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, vocabulary_id });
  });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const db = getDb();
  db.run('DELETE FROM wrong_words WHERE id = ?', [id], function(err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'wrong word not found' });
    res.json({ success: true, id });
  });
});

module.exports = router;
