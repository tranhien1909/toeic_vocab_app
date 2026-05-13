const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT * FROM vocabularies', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:topicId', (req, res) => {
  const topicId = Number(req.params.topicId);
  const db = getDb();
  db.all('SELECT * FROM vocabularies WHERE topic_id = ?', [topicId], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
