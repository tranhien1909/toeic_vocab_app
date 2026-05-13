const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/:topicId', (req, res) => {
  const topicId = Number(req.params.topicId);
  const db = getDb();
  const sql = `SELECT q.* FROM questions q
  JOIN vocabularies v ON q.vocabulary_id = v.id
  WHERE v.topic_id = ?`;
  db.all(sql, [topicId], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
