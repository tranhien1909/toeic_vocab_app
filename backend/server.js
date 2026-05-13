const express = require('express');
const path = require('path');
const cors = require('cors');

const topicsRouter = require('./routes/topics');
const vocabsRouter = require('./routes/vocabularies');
const questionsRouter = require('./routes/questions');
const wrongWordsRouter = require('./routes/wrongWords');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/topics', topicsRouter);
app.use('/api/vocabularies', vocabsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/wrong-words', wrongWordsRouter);

// progress endpoint
app.post('/api/progress', (req, res) => {
  const { vocabulary_id, correct } = req.body;
  if (!vocabulary_id) return res.status(400).json({ error: 'vocabulary_id required' });
  const db = require('./db').getDb();

  db.get('SELECT * FROM learning_progress WHERE vocabulary_id = ?', [vocabulary_id], (err, row) => {
    if (err) { db.close(); return res.status(500).json({ error: err.message }); }
    if (row) {
      const correct_count = row.correct_count + (correct ? 1 : 0);
      const wrong_count = row.wrong_count + (correct ? 0 : 1);
      db.run('UPDATE learning_progress SET correct_count = ?, wrong_count = ?, last_reviewed_at = datetime("now") WHERE vocabulary_id = ?', [correct_count, wrong_count, vocabulary_id], function(err2) {
        db.close();
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ vocabulary_id, correct_count, wrong_count });
      });
    } else {
      const correct_count = correct ? 1 : 0;
      const wrong_count = correct ? 0 : 1;
      db.run('INSERT INTO learning_progress (vocabulary_id, correct_count, wrong_count, last_reviewed_at) VALUES (?, ?, ?, datetime("now"))', [vocabulary_id, correct_count, wrong_count], function(err3) {
        db.close();
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ vocabulary_id, correct_count, wrong_count });
      });
    }
  });
});

// serve frontend
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
