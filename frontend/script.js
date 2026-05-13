const API_BASE = '/api';
const app = document.getElementById('app');
const loadingEl = document.getElementById('loading');

function showLoading(v=true){loadingEl.style.display = v ? 'block' : 'none'}

function speakEnglish(text) {
  if (!('speechSynthesis' in window)) {
    alert('Trình duyệt này không hỗ trợ phát âm tiếng Anh.');
    return;
  }

  if (!text) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find((voice) =>
    /^en(-|_)/i.test(voice.lang) || /english/i.test(voice.name)
  );

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

async function fetchJson(url){
  showLoading(true);
  const res = await fetch(url);
  showLoading(false);
  return res.json();
}

function navTo(page, payload) {
  if (page === 'home') renderHome();
  if (page === 'topics') renderTopics();
  if (page === 'dashboard') renderDashboard();
  if (page === 'wrong') renderWrongWords();
}

document.getElementById('nav-home').addEventListener('click', ()=>navTo('home'));
document.getElementById('nav-topics').addEventListener('click', ()=>navTo('topics'));
document.getElementById('nav-dashboard').addEventListener('click', ()=>navTo('dashboard'));
document.getElementById('nav-wrong').addEventListener('click', ()=>navTo('wrong'));

async function renderHome(){
  const topics = await fetchJson(API_BASE + '/topics');
  const vocabs = await fetchJson(API_BASE + '/vocabularies');
  const learned = vocabs.filter(v=>false).length;

  app.innerHTML = '';
  const container = document.createElement('div'); container.className='container';
  const hero = document.createElement('div'); hero.className='hero';
  const content = document.createElement('div'); content.className='content';
  content.innerHTML = `<h1>Học từ vựng TOEIC — Nâng band tiếng Anh</h1><p>Giao diện tối giản, responsive, có flashcard, minigame và dashboard.</p><div style="margin-top:12px"><button id="start" class="btn">Bắt đầu học</button></div>`;
  hero.appendChild(content);
  const stats = document.createElement('div'); stats.innerHTML = `<div class="card"><h3>Tổng số từ</h3><p class="muted">${vocabs.length}</p></div><div style="height:12px"></div>`;
  hero.appendChild(stats);
  container.appendChild(hero);
  app.appendChild(container);

  document.getElementById('start').addEventListener('click', ()=>navTo('topics'));
}

async function renderTopics(){
  const topics = await fetchJson(API_BASE + '/topics');
  const vocabs = await fetchJson(API_BASE + '/vocabularies');
  app.innerHTML = '';
  const container = document.createElement('div'); container.className='container';
  const head = document.createElement('div'); head.className='section-head';
  head.innerHTML = `
    <div>
      <h2>Danh sách chủ đề TOEIC</h2>
      <p>Chọn chế độ học phù hợp: Study, Flashcard hoặc Minigame.</p>
    </div>
    <div class="section-chip">${topics.length} chủ đề • ${vocabs.length} từ vựng</div>
  `;
  const grid = document.createElement('div'); grid.className='grid';
  const template = document.getElementById('topic-card');
  for (const t of topics) {
    const count = vocabs.filter(v => v.topic_id === t.id).length;
    const node = template.content.cloneNode(true);
    node.querySelector('.topic-name').textContent = t.name;
    node.querySelector('.topic-desc').textContent = `${t.description} • ${count} từ`;
    node.querySelector('.btn.study').addEventListener('click', ()=>renderStudy(t.id, t.name));
    node.querySelector('.btn.flash').addEventListener('click', ()=>renderFlashcards(t.id, t.name));
    node.querySelector('.btn.quiz').addEventListener('click', ()=>renderQuiz(t.id, t.name));
    grid.appendChild(node);
  }
  container.appendChild(head);
  container.appendChild(grid);
  app.appendChild(container);
}

async function renderStudy(topicId, topicName){
  const vocabs = await fetchJson(`${API_BASE}/vocabularies/${topicId}`);
  let idx = 0;
  function show(){
    const v = vocabs[idx];
    app.innerHTML = '';
    const c = document.createElement('div'); c.className='container';
    const card = document.createElement('div'); card.className='card vocab-card';
    card.innerHTML = `<div class="vocab-word">${v.word} <span class="muted">${v.pronunciation||''}</span></div>
    <div>${v.meaning}</div>
    <div class="muted">${v.word_type} • ${v.collocation}</div>
    <div style="margin-top:8px">${v.example}<div class="muted">${v.example_meaning}</div></div>
    <div class="controls" style="margin-top:12px">
      <button class="btn btn-ghost" id="speak">🔊 Pronounce</button>
      <button class="btn" id="prev">Previous</button>
      <button class="btn" id="remember">Đã nhớ</button>
      <button class="btn" id="review">Cần ôn lại</button>
      <button class="btn" id="next">Next</button>
    </div>`;
    c.appendChild(card); app.appendChild(c);

    document.getElementById('prev').addEventListener('click', ()=>{ if(idx>0){idx--;show()} });
    document.getElementById('next').addEventListener('click', ()=>{ if(idx<vocabs.length-1){idx++;show()} });
    document.getElementById('speak').addEventListener('click', ()=>speakEnglish(v.word));
    document.getElementById('remember').addEventListener('click', async ()=>{ await fetch(API_BASE+'/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabulary_id:v.id,correct:true})}); alert('Đã lưu: Đã nhớ'); });
    document.getElementById('review').addEventListener('click', async ()=>{ await fetch(API_BASE+'/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabulary_id:v.id,correct:false})}); await fetch(API_BASE+'/wrong-words',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabulary_id:v.id})}); alert('Đã lưu: Cần ôn lại'); });
  }
  show();
}

async function renderFlashcards(topicId, topicName){
  const vocabs = await fetchJson(`${API_BASE}/vocabularies/${topicId}`);
  let idx = 0;
  app.innerHTML='';
  const c = document.createElement('div'); c.className='container';
  const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='20px'; wrap.style.flexWrap='wrap';
  const fc = document.createElement('div'); fc.className='flashcard';
  const inner = document.createElement('div'); inner.className='card-inner';
  const front = document.createElement('div'); front.className='card-face card-front';
  const back = document.createElement('div'); back.className='card-face card-back';
  inner.appendChild(front); inner.appendChild(back); fc.appendChild(inner);
  const ctrl = document.createElement('div'); ctrl.style.display='flex'; ctrl.style.flexDirection='column'; ctrl.style.gap='8px';
  const speak = document.createElement('button'); speak.className='btn btn-ghost'; speak.textContent='🔊 Pronounce';
  const prev = document.createElement('button'); prev.className='btn'; prev.textContent='Previous';
  const next = document.createElement('button'); next.className='btn'; next.textContent='Next';
  ctrl.appendChild(speak); ctrl.appendChild(prev); ctrl.appendChild(next);
  wrap.appendChild(fc); wrap.appendChild(ctrl); c.appendChild(wrap); app.appendChild(c);

  function show(){
    const v = vocabs[idx];
    front.innerHTML = `<div style="font-size:1.4rem">${v.word}</div>`;
    back.innerHTML = `<div style="text-align:left"><strong>${v.meaning}</strong><div class="muted">${v.word_type} • ${v.pronunciation}</div><p style="margin-top:8px">${v.example}<div class="muted">${v.example_meaning}</div></p></div>`;
    inner.classList.remove('flipped');
  }
  fc.addEventListener('click', ()=>inner.classList.toggle('flipped'));
  speak.addEventListener('click', ()=>speakEnglish(vocabs[idx]?.word));
  prev.addEventListener('click', ()=>{ if(idx>0){idx--;show()} });
  next.addEventListener('click', ()=>{ if(idx<vocabs.length-1){idx++;show()} });
  show();
}

async function renderQuiz(topicId, topicName){
  const questions = await fetchJson(`${API_BASE}/questions/${topicId}`);
  if (!questions.length){ alert('No questions for this topic'); return; }
  let idx=0; let score=0; let streak=0;
  function show(){
    const q = questions[idx];
    const progressPercent = Math.round((idx / questions.length) * 100);
    app.innerHTML='';
    const c = document.createElement('div'); c.className='container';
    const card = document.createElement('div'); card.className='card quiz';
    card.innerHTML = `
      <div class="quiz-top">
        <div>
          <div><strong>Question ${idx+1}/${questions.length}</strong></div>
          <div class="muted">Topic: ${topicName}</div>
        </div>
        <div class="quiz-meta">
          <span class="pill">Score: ${score}</span>
          <span id="combo-badge" class="combo-badge ${streak >= 2 ? 'active' : ''}">🔥 Combo x${streak}</span>
        </div>
      </div>
      <div class="progress-track"><div id="progress-fill" class="progress-fill" style="width:${progressPercent}%"></div></div>
      <div class="question-text">${q.question_text}</div>
    `;

    const options = document.createElement('div'); options.className='options';
    let answered = false;
    ['a','b','c','d'].forEach(k=>{
      const btn = document.createElement('button'); btn.className='option-btn'; btn.textContent = q['option_'+k];
      btn.addEventListener('click', ()=>{
        if (answered) return;
        answered = true;

        const correct = q.correct_answer === k;
        const allButtons = Array.from(options.querySelectorAll('.option-btn'));
        allButtons.forEach((optionButton) => {
          optionButton.disabled = true;
        });

        const correctButton = allButtons.find((optionButton, i) => ['a', 'b', 'c', 'd'][i] === q.correct_answer);

        if (correct){
          btn.classList.add('correct');
          score++;
          streak++;
        } else {
          btn.classList.add('wrong');
          if (correctButton) correctButton.classList.add('correct');
          streak = 0;
        }

        const comboBadge = document.getElementById('combo-badge');
        comboBadge.textContent = `🔥 Combo x${streak}`;
        comboBadge.classList.toggle('active', streak >= 2);
        comboBadge.classList.add('pop');
        setTimeout(() => comboBadge.classList.remove('pop'), 200);

        const fill = document.getElementById('progress-fill');
        fill.style.width = `${Math.round(((idx + 1) / questions.length) * 100)}%`;

        const feedback = document.createElement('div');
        feedback.className = `quiz-feedback ${correct ? 'correct' : 'wrong'}`;
        feedback.innerHTML = `${correct ? '✅ Chính xác!' : '❌ Chưa đúng.'} ${q.explanation}`;
        card.appendChild(feedback);

        // send progress
        fetch(API_BASE+'/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabulary_id:q.vocabulary_id,correct:correct})});
        if(!correct) fetch(API_BASE+'/wrong-words',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vocabulary_id:q.vocabulary_id})});
        // next
        setTimeout(()=>{ idx++; if(idx<questions.length) show(); else renderQuizResult(score,questions.length); }, 1000);
      });
      options.appendChild(btn);
    });
    card.appendChild(options);
    c.appendChild(card); app.appendChild(c);
  }
  show();
}

function renderQuizResult(score,total){
  app.innerHTML='';
  const c = document.createElement('div'); c.className='container';
  const card = document.createElement('div'); card.className='card';
  card.innerHTML = `<h2>Kết quả</h2><p>Điểm: ${score}/${total}</p><button class="btn" id="back">Quay lại Topics</button>`;
  c.appendChild(card); app.appendChild(c);
  document.getElementById('back').addEventListener('click', ()=>navTo('topics'));
}

async function renderWrongWords(){
  const list = await fetchJson(API_BASE + '/wrong-words');
  app.innerHTML='';
  const c = document.createElement('div'); c.className='container';
  const head = document.createElement('div'); head.className='section-head';
  head.innerHTML = `
    <div>
      <h2>Từ cần ôn lại</h2>
      <p>Quản lý danh sách từ đã trả lời sai trong Minigame.</p>
    </div>
    <div class="section-chip">${list.length} từ</div>
  `;
  c.appendChild(head);

  if (!list.length) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'card';
    emptyCard.innerHTML = `<h3>🎉 Không có từ sai</h3><p class="muted">Bạn đang làm rất tốt. Tiếp tục giữ phong độ nhé!</p>`;
    c.appendChild(emptyCard);
    app.appendChild(c);
    return;
  }

  const grid = document.createElement('div'); grid.className='grid';
  for (const w of list){
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `<h3>${w.word}</h3><p class="muted">${w.meaning}</p><div class="muted">Added: ${w.created_at}</div>`;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const speakBtn = document.createElement('button');
    speakBtn.className = 'btn btn-ghost';
    speakBtn.textContent = '🔊 Pronounce';
    speakBtn.addEventListener('click', ()=>speakEnglish(w.word));

    const studyBtn = document.createElement('button');
    studyBtn.className='btn';
    studyBtn.textContent='Study';
    studyBtn.addEventListener('click', ()=>renderStudy(w.vocabulary_id,'Review'));

    const deleteBtn = document.createElement('button');
    deleteBtn.className='btn btn-danger';
    deleteBtn.textContent='Xoá';
    deleteBtn.addEventListener('click', async ()=>{
      const confirmed = window.confirm(`Xoá từ "${w.word}" khỏi danh sách ôn tập?`);
      if (!confirmed) return;

      const response = await fetch(`${API_BASE}/wrong-words/${w.id}`, { method: 'DELETE' });
      if (!response.ok) {
        alert('Xoá thất bại, vui lòng thử lại.');
        return;
      }

      renderWrongWords();
    });

    actions.appendChild(speakBtn);
    actions.appendChild(studyBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);
    grid.appendChild(card);
  }
  c.appendChild(grid); app.appendChild(c);
}

async function renderDashboard(){
  const vocabs = await fetchJson(API_BASE + '/vocabularies');
  const wrong = await fetchJson(API_BASE + '/wrong-words');
  app.innerHTML='';
  const c = document.createElement('div'); c.className='container';
  const card = document.createElement('div'); card.className='card';
  card.innerHTML = `<h3>Dashboard</h3><p>Total words: ${vocabs.length}</p><p>Words to review: ${wrong.length}</p>`;
  c.appendChild(card); app.appendChild(c);
}

// initial
renderHome();
