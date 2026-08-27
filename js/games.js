/* ============================================================
   MINISPIELE
   ============================================================ */

const Games = {
  meta: {
    quiz:    { icon:'🎯', name:'Kurven-Quiz',        desc:'Die Karte zeigt eine Kurve — wie heißt sie?', tag:'Namen lernen' },
    blind:   { icon:'🧠', name:'Blind Lap',          desc:'Welche Kurve kommt als Nächstes? Fahr die Runde im Kopf.', tag:'Reihenfolge' },
    brake:   { icon:'🛑', name:'Bremspunkt-Trainer', desc:'Brems im richtigen Moment. Timing ist alles.', tag:'Bremspunkte' },
    blitz:   { icon:'⚡', name:'Blitz 60',           desc:'60 Sekunden, so viele Kurven wie möglich: links oder rechts?', tag:'Speedrun' },
    mapclick:{ icon:'📍', name:'Karten-Klick',       desc:'Finde die genannte Kurve auf der Streckenkarte.', tag:'Orientierung' },
    sort:    { icon:'🔢', name:'Sortier-Challenge',  desc:'Bring sechs Kurven in die richtige Reihenfolge.', tag:'Reihenfolge' },
    flags:   { icon:'🚩', name:'Flaggen-Trainer',    desc:'Flaggen und Code 60 — Pflichtwissen für Fahrer und Fans.', tag:'Regelkunde' }
  },

  /* ---------- Hub ---------- */
  hub(root) {
    const hs = Store.data.highscores;
    root.innerHTML = `
      <div class="view-head">
        <h1>Minispiele</h1>
        <p>Sieben Wege, dir die Grüne Hölle in den Kopf zu brennen. Jedes Spiel gibt XP und verbessert deine Kurven-Meisterschaft.</p>
      </div>
      <div class="game-grid">
        ${Object.entries(this.meta).map(([k, m]) => `
          <button class="game-card" data-game="${k}">
            <div class="gc-icon">${m.icon}</div>
            <h3>${escapeHtml(m.name)}</h3>
            <p>${escapeHtml(m.desc)}</p>
            <div class="gc-foot"><span class="chip">${escapeHtml(m.tag)}</span>
              <span class="gc-hs">Rekord: <b>${hs[k] || 0}</b></span></div>
          </button>`).join('')}
      </div>
      <div class="panel">
        <h2 class="panel-h">Empfohlene Reihenfolge</h2>
        <ol class="steps">
          <li><b>Kurven-Quiz</b> — erst die Namen und ihre Position auf der Karte.</li>
          <li><b>Karten-Klick</b> — jetzt andersherum: Name gehört, Ort finden.</li>
          <li><b>Sortier-Challenge</b> — die Reihenfolge in Fahrtrichtung.</li>
          <li><b>Blind Lap</b> — die ganze Runde aus dem Kopf.</li>
          <li><b>Blitz 60</b> — Richtungen unter Zeitdruck.</li>
          <li><b>Bremspunkt-Trainer</b> — für Assetto Corsa der wertvollste Teil.</li>
          <li><b>Flaggen-Trainer</b> — fürs NLS-Wochenende.</li>
        </ol>
      </div>`;
    $$('.game-card', root).forEach(b =>
      b.addEventListener('click', () => { Sfx.rev(); App.go('game:' + b.dataset.game); }));
  },

  /* ---------- gemeinsames Gerüst ---------- */
  shell(root, gameId, bodyHtml) {
    const m = this.meta[gameId];
    root.innerHTML = `
      <div class="game-shell">
        <div class="game-top">
          <button class="btn btn-sm" id="g-back">Zurück</button>
          <div class="gt-title"><span>${m.icon}</span><b>${escapeHtml(m.name)}</b></div>
          <div class="gt-stats">
            <div class="gt-stat"><span>Punkte</span><b id="g-score">0</b></div>
            <div class="gt-stat"><span>Serie</span><b id="g-streak">0</b></div>
            <div class="gt-stat"><span>Rekord</span><b id="g-best">${Store.data.highscores[gameId] || 0}</b></div>
          </div>
        </div>
        <div class="game-body" id="g-body">${bodyHtml || ''}</div>
      </div>`;
    $('#g-back', root).addEventListener('click', () => App.go('games'));
    return $('#g-body', root);
  },

  setScore(root, s, st) {
    $('#g-score', root).textContent = s;
    if (st != null) $('#g-streak', root).textContent = st;
  },

  finish(root, gameId, score, extra = {}) {
    const isRecord = Store.setHighscore(gameId, score);
    const xp = Math.round(score * (extra.xpFactor || 8));
    Store.addXP(xp);
    if (isRecord) Sfx.perfect();
    Achievements.check(extra.achCtx || {});
    const body = $('#g-body', root);
    body.innerHTML = `
      <div class="result big">
        <div class="res-flag">🏁</div>
        <h2>${isRecord ? 'Neuer Rekord!' : 'Session beendet'}</h2>
        <div class="res-score">${score}</div>
        <div class="res-label">${escapeHtml(extra.label || 'Punkte')}</div>
        ${extra.detail ? `<p class="res-detail">${extra.detail}</p>` : ''}
        <div class="res-xp">+${xp} XP</div>
        <div class="res-actions">
          <button class="btn btn-primary" id="r-again">Nochmal</button>
          <button class="btn" id="r-hub">Andere Spiele</button>
        </div>
      </div>`;
    $('#r-again', root).addEventListener('click', () => App.go('game:' + gameId));
    $('#r-hub', root).addEventListener('click', () => App.go('games'));
  },

  trackStreak(streak) {
    if (streak > Store.data.bestStreak) { Store.data.bestStreak = streak; Store.save(); }
  },

  /* ============================================================
     1) KURVEN-QUIZ
     ============================================================ */
  quiz(root) {
    const body = this.shell(root, 'quiz');
    let score = 0, streak = 0, q = 0, lives = 3;
    const TOTAL = 15;
    const pool = shuffle(ND.quizPool);

    const next = () => {
      if (q >= TOTAL || lives <= 0) {
        this.finish(root, 'quiz', score, {
          label:'Punkte', detail:`${q} Fragen · ${lives} Leben übrig`, xpFactor: 6 });
        return;
      }
      const c = pool[q % pool.length];
      const wrong = shuffle(ND.quizPool.filter(x => x.id !== c.id)).slice(0, 3);
      const opts = shuffle([c, ...wrong]);

      body.innerHTML = `
        <div class="q-hud">
          <div class="q-progress"><div style="width:${q / TOTAL * 100}%"></div></div>
          <div class="q-meta">Frage ${q + 1} / ${TOTAL} · ${'❤️'.repeat(lives)}</div>
        </div>
        <div class="quiz-layout">
          <div class="quiz-map" id="quiz-map"></div>
          <div class="quiz-right">
            <div class="q-text">Welche Kurve ist markiert?</div>
            <div class="q-hint">Abschnitt: <b style="color:${ND.sectorById[c.sec].color}">${ND.sectorById[c.sec].name}</b> · ${kmLabel(c)} · ${dirLabel(c.dir)}</div>
            <div class="q-options">
              ${opts.map(o => `<button class="q-opt" data-id="${o.id}">${escapeHtml(o.name)}</button>`).join('')}
            </div>
          </div>
        </div>`;

      $('#quiz-map', root).innerHTML = TrackMap.render({
        labels: false, showGP: true, highlight: [c.id], interactive: false });

      $$('.q-opt', root).forEach(btn => btn.addEventListener('click', () => {
        const ok = btn.dataset.id === c.id;
        Store.scoreCorner(c.id, ok);
        $$('.q-opt', root).forEach(b => {
          b.disabled = true;
          if (b.dataset.id === c.id) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        if (ok) {
          streak++; score += 10 + Math.min(20, streak * 2); Sfx.good();
          this.trackStreak(streak);
        } else {
          streak = 0; lives--; Sfx.bad();
        }
        this.setScore(root, score, streak);
        const info = el('div', 'q-feedback ' + (ok ? 'ok' : 'no'),
          `<b>${escapeHtml(c.name)}</b> — ${escapeHtml(c.desc)}`);
        $('.quiz-right', root).appendChild(info);
        q++;
        setTimeout(next, ok ? 1100 : 2300);
      }));
    };
    next();
  },

  /* ============================================================
     2) BLIND LAP
     ============================================================ */
  blind(root) {
    const body = this.shell(root, 'blind');
    const lap = ND.nordschleife;
    let idx = Math.floor(Math.random() * lap.length);
    let score = 0, streak = 0, lives = 3, done = 0;
    const startIdx = idx;
    const path = [lap[idx].id];

    const next = () => {
      if (lives <= 0 || done >= lap.length) {
        const full = done >= lap.length;
        this.finish(root, 'blind', done, {
          label:'Kurven am Stück',
          detail: full
            ? '🏁 Komplette Runde geschafft — du kennst die Nordschleife auswendig!'
            : `Du bist bis <b>${escapeHtml(lap[idx % lap.length].name)}</b> gekommen.`,
          xpFactor: 14,
          achCtx: { fullLap: full }
        });
        return;
      }
      const cur = lap[idx % lap.length];
      const correct = lap[(idx + 1) % lap.length];
      const wrong = shuffle(lap.filter(x => x.id !== correct.id && x.id !== cur.id)).slice(0, 3);
      const opts = shuffle([correct, ...wrong]);

      body.innerHTML = `
        <div class="blind-wrap">
          <div class="blind-head">
            <div class="bh-lives">${'❤️'.repeat(lives)}</div>
            <div class="bh-count">${done} / ${lap.length} Kurven</div>
          </div>
          <div class="blind-current">
            <div class="bc-label">Du bist gerade bei</div>
            <div class="bc-name">${escapeHtml(cur.name)}</div>
            <div class="bc-meta">${kmLabel(cur)} · ${dirLabel(cur.dir)} · ca. ${cur.alt} m</div>
          </div>
          <div class="bc-q">Was kommt als Nächstes?</div>
          <div class="q-options wide">
            ${opts.map(o => `<button class="q-opt" data-id="${o.id}">${escapeHtml(o.name)}</button>`).join('')}
          </div>
          <div class="blind-track" id="blind-track"></div>
        </div>`;

      $('#blind-track', root).innerHTML = TrackMap.render({
        labels: false, showGP: false, highlight: path.slice(-6), interactive: false });

      $$('.q-opt', root).forEach(btn => btn.addEventListener('click', () => {
        const ok = btn.dataset.id === correct.id;
        Store.scoreCorner(correct.id, ok);
        $$('.q-opt', root).forEach(b => {
          b.disabled = true;
          if (b.dataset.id === correct.id) b.classList.add('correct');
          else if (b === btn) b.classList.add('wrong');
        });
        if (ok) {
          streak++; done++; score += 15; Sfx.good(); this.trackStreak(streak);
          path.push(correct.id);
          idx++;
        } else {
          lives--; streak = 0; Sfx.bad();
          idx++; path.push(correct.id);
        }
        this.setScore(root, done, streak);
        setTimeout(next, ok ? 700 : 1600);
      }));
    };
    next();
  },

  /* ============================================================
     3) BREMSPUNKT-TRAINER
     ============================================================ */
  brake(root) {
    const body = this.shell(root, 'brake');
    const pool = shuffle(ND.corners.filter(c => c.bp));
    let i = 0, score = 0, perfect = 0, streak = 0;
    const TOTAL = 10;
    let raf = null, running = false, startTs = 0, currentDist = 0;

    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = null; };

    const round = () => {
      if (i >= TOTAL) {
        stop();
        this.finish(root, 'brake', score, {
          label:'Punkte',
          detail:`${perfect} perfekte Bremspunkte von ${TOTAL}`,
          xpFactor: 5,
          achCtx: {}
        });
        return;
      }
      const c = pool[i % pool.length];
      const START = 400, DUR = 3600;   // ms für 400 m Anfahrt

      body.innerHTML = `
        <div class="brake-wrap">
          <div class="brake-head">
            <div class="bhh-label">Anfahrt auf</div>
            <h2>${escapeHtml(c.name)}</h2>
            <div class="bhh-meta">${dirLabel(c.dir)} · ${escapeHtml(c.gear)}. Gang · ${escapeHtml(c.spd)}</div>
          </div>

          <div class="road" id="road">
            <div class="road-surface">
              <div class="road-lines"></div>
              <div class="marker-row">
                ${[300, 250, 200, 150, 100, 50].map(m =>
                  `<div class="marker" style="left:${(1 - m / START) * 100}%">
                     <i></i><span>${m}</span></div>`).join('')}
              </div>
              <div class="corner-zone"><span>${dirIcon(c.dir)} ${escapeHtml(c.name)}</span></div>
              <div class="car" id="car">🏎️</div>
            </div>
            <div class="dist-readout"><b id="dist">400</b> m</div>
          </div>

          <button class="brake-btn" id="brake-btn">
            <span class="bb-main">BREMSEN</span>
            <span class="bb-sub">Leertaste oder klicken</span>
          </button>
          <div class="brake-feedback" id="brake-fb"></div>
          <div class="brake-progress">Kurve ${i + 1} / ${TOTAL} · ${perfect} perfekt</div>
        </div>`;

      const car = $('#car', root);
      const distEl = $('#dist', root);
      const fb = $('#brake-fb', root);
      let answered = false;

      running = true; startTs = 0;
      const step = ts => {
        if (!running) return;
        if (!startTs) startTs = ts;
        const p = (ts - startTs) / DUR;
        currentDist = Math.round(START * (1 - p));
        if (p >= 1) { judge(0, true); return; }
        car.style.left = (p * 100) + '%';
        distEl.textContent = Math.max(0, currentDist);
        distEl.className = currentDist < 100 ? 'hot' : '';
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);

      const judge = (dist, tooLate) => {
        if (answered) return;
        answered = true; stop();
        const diff = Math.abs(dist - c.bp);
        let rating, pts, cls;
        if (tooLate)        { rating = 'ZU SPÄT — Kiesbett!'; pts = 0;  cls = 'miss'; }
        else if (diff <= 15){ rating = 'PERFEKT!';            pts = 100; cls = 'perfect'; perfect++; Store.data.sessionPerfectBrakes++; }
        else if (diff <= 35){ rating = 'Sehr gut';            pts = 65;  cls = 'good'; }
        else if (diff <= 70){ rating = 'Brauchbar';           pts = 30;  cls = 'ok'; }
        else                { rating = dist > c.bp ? 'Viel zu früh' : 'Viel zu spät'; pts = 5; cls = 'miss'; }

        score += pts;
        if (pts >= 65) { streak++; this.trackStreak(streak); } else streak = 0;
        Store.scoreCorner(c.id, pts >= 65);
        this.setScore(root, score, streak);
        Sfx[cls === 'perfect' ? 'perfect' : pts >= 30 ? 'good' : 'bad']();

        fb.className = 'brake-feedback show ' + cls;
        fb.innerHTML = `
          <div class="fb-rating">${rating}</div>
          <div class="fb-line">Du: <b>${tooLate ? 'gar nicht' : dist + ' m'}</b> · Ideal: <b>${c.bp} m</b> · <b>+${pts}</b> Punkte</div>
          <div class="fb-tip">${escapeHtml(c.tip)}</div>`;
        $('#brake-btn', root).disabled = true;
        i++;
        setTimeout(round, 2400);
      };

      const press = () => { if (running && !answered) judge(Math.max(0, currentDist), false); };
      $('#brake-btn', root).addEventListener('click', press);
      this._keyHandler = e => { if (e.code === 'Space') { e.preventDefault(); press(); } };
      document.addEventListener('keydown', this._keyHandler);
    };

    App.onLeave = () => { stop(); document.removeEventListener('keydown', this._keyHandler); };
    round();
  },

  /* ============================================================
     4) BLITZ 60
     ============================================================ */
  blitz(root) {
    const body = this.shell(root, 'blitz');
    let score = 0, streak = 0, wrong = 0;
    const DUR = 60000;
    const t0 = Date.now();
    let timer = null, pool = shuffle(ND.quizPool);
    let i = 0;

    const ask = () => {
      const left = DUR - (Date.now() - t0);
      if (left <= 0) { end(); return; }
      const c = pool[i % pool.length];
      const useGear = Math.random() < 0.35;
      const opts = useGear
        ? shuffle([c.gear, ...shuffle(['1','2','3','4','5','6','2-3','3-4','4-5','5-6']
            .filter(g => g !== c.gear)).slice(0, 3)])
        : ['L','R','S','G'];

      body.innerHTML = `
        <div class="blitz-wrap">
          <div class="blitz-timer"><div class="bt-bar" id="bt-bar"></div><span id="bt-num"></span></div>
          <div class="blitz-card">
            <div class="bz-sec" style="color:${ND.sectorById[c.sec].color}">${ND.sectorById[c.sec].name} · ${kmLabel(c)}</div>
            <div class="bz-name">${escapeHtml(c.name)}</div>
            <div class="bz-q">${useGear ? 'Welcher Gang?' : 'Welche Richtung?'}</div>
          </div>
          <div class="blitz-opts">
            ${useGear
              ? opts.map(g => `<button class="bz-opt" data-v="${escapeHtml(g)}">${escapeHtml(g)}<i>. Gang</i></button>`).join('')
              : opts.map(d => `<button class="bz-opt big" data-v="${d}"><span>${dirIcon(d)}</span>${dirLabel(d)}</button>`).join('')}
          </div>
          <div class="blitz-score">${score} · ❌ ${wrong}</div>
        </div>`;

      $$('.bz-opt', root).forEach(b => b.addEventListener('click', () => {
        const ok = b.dataset.v === (useGear ? c.gear : c.dir);
        Store.scoreCorner(c.id, ok);
        if (ok) { score++; streak++; this.trackStreak(streak); Sfx.good(); b.classList.add('correct'); }
        else { wrong++; streak = 0; Sfx.bad(); b.classList.add('wrong');
               $$('.bz-opt', root).forEach(x => { if (x.dataset.v === (useGear ? c.gear : c.dir)) x.classList.add('correct'); }); }
        this.setScore(root, score, streak);
        i++;
        setTimeout(ask, ok ? 180 : 700);
      }));
    };

    const tickUI = () => {
      const left = Math.max(0, DUR - (Date.now() - t0));
      const bar = $('#bt-bar', root), num = $('#bt-num', root);
      if (bar) bar.style.width = (left / DUR * 100) + '%';
      if (num) num.textContent = (left / 1000).toFixed(1) + ' s';
      if (left <= 0) end();
    };

    const end = () => {
      clearInterval(timer);
      this.finish(root, 'blitz', score, {
        label:'richtige Antworten',
        detail:`${wrong} Fehler in 60 Sekunden`,
        xpFactor: 10,
        achCtx: { blitzScore: score }
      });
    };

    timer = setInterval(tickUI, 100);
    App.onLeave = () => clearInterval(timer);
    ask();
  },

  /* ============================================================
     5) KARTEN-KLICK
     ============================================================ */
  mapclick(root) {
    const body = this.shell(root, 'mapclick');
    let hits = 0, streak = 0, q = 0, misses = 0;
    const TOTAL = 15;
    const pool = shuffle(ND.quizPool);

    const next = () => {
      if (q >= TOTAL) {
        this.finish(root, 'mapclick', hits, {
          label:'Treffer',
          detail:`${misses} Fehlversuche bei ${TOTAL} Kurven`,
          xpFactor: 9,
          achCtx: { mapHits: hits }
        });
        return;
      }
      const c = pool[q % pool.length];
      body.innerHTML = `
        <div class="mc-wrap">
          <div class="mc-task">
            <div class="mc-label">Finde auf der Karte:</div>
            <h2>${escapeHtml(c.name)}</h2>
            <div class="mc-meta">${q + 1} / ${TOTAL} · ✅ ${hits} · ❌ ${misses}</div>
          </div>
          <div class="mc-map" id="mc-map"></div>
          <div class="mc-fb" id="mc-fb"></div>
        </div>`;

      const wrap = $('#mc-map', root);
      wrap.innerHTML = TrackMap.render({ labels: false, showGP: true, interactive: false });
      const svg = $('.track-svg', wrap);
      svg.classList.add('clickable');
      let answered = false;

      svg.addEventListener('click', e => {
        if (answered) return;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const m = svg.getScreenCTM();
        if (!m) return;
        const loc = pt.matrixTransform(m.inverse());

        let best = null, bestD = Infinity;
        ND.corners.forEach(x => {
          const d = Math.hypot(x.x - loc.x, x.y - loc.y);
          if (d < bestD) { bestD = d; best = x; }
        });

        const ok = best && best.id === c.id && bestD < 55;
        answered = true;
        Store.scoreCorner(c.id, ok);
        if (ok) { hits++; streak++; this.trackStreak(streak); Sfx.good(); }
        else { misses++; streak = 0; Sfx.bad(); }
        this.setScore(root, hits, streak);

        // Lösung einblenden
        const layer = $('.car-layer', svg);
        layer.innerHTML = `
          <circle cx="${c.x}" cy="${c.y}" r="24" fill="none" stroke="#4ade80" stroke-width="4"/>
          <circle cx="${loc.x.toFixed(0)}" cy="${loc.y.toFixed(0)}" r="8" fill="none" stroke="${ok ? '#4ade80' : '#ef4444'}" stroke-width="3"/>
          <line x1="${loc.x.toFixed(0)}" y1="${loc.y.toFixed(0)}" x2="${c.x}" y2="${c.y}"
                stroke="${ok ? '#4ade80' : '#ef4444'}" stroke-width="2" stroke-dasharray="6 6"/>`;

        $('#mc-fb', root).className = 'mc-fb show ' + (ok ? 'ok' : 'no');
        $('#mc-fb', root).innerHTML = ok
          ? `<b>Treffer!</b> ${escapeHtml(c.name)} — ${kmLabel(c)}.`
          : `<b>Daneben.</b> Das war ${escapeHtml(best ? best.name : '—')} — gesucht war <b>${escapeHtml(c.name)}</b> (${kmLabel(c)}).`;
        q++;
        setTimeout(next, ok ? 1000 : 2200);
      });
    };
    next();
  },

  /* ============================================================
     6) SORTIER-CHALLENGE
     ============================================================ */
  sort(root) {
    const body = this.shell(root, 'sort');
    let score = 0, streak = 0, round = 0;
    const ROUNDS = 8;

    const next = () => {
      if (round >= ROUNDS) {
        this.finish(root, 'sort', score, { label:'Punkte', xpFactor: 7 });
        return;
      }
      const lap = ND.nordschleife;
      const start = Math.floor(Math.random() * (lap.length - 6));
      const seq = lap.slice(start, start + 6);
      const mixed = shuffle(seq);
      let picked = [];

      body.innerHTML = `
        <div class="sort-wrap">
          <div class="sort-head">
            <h2>In welcher Reihenfolge kommen diese Kurven?</h2>
            <p>Klick sie in Fahrtrichtung an — von der ersten zur letzten. Runde ${round + 1} / ${ROUNDS}</p>
          </div>
          <div class="sort-slots" id="sort-slots">
            ${[1,2,3,4,5,6].map(n => `<div class="slot" data-n="${n}"><span>${n}</span></div>`).join('')}
          </div>
          <div class="sort-pool" id="sort-pool">
            ${mixed.map(c => `<button class="sort-chip" data-id="${c.id}"
               style="--c:${ND.sectorById[c.sec].color}">${escapeHtml(c.name)}</button>`).join('')}
          </div>
          <div class="sort-actions">
            <button class="btn btn-sm" id="s-undo">Letzte zurück</button>
            <button class="btn btn-primary" id="s-check" disabled>Prüfen</button>
          </div>
          <div class="sort-fb" id="sort-fb"></div>
        </div>`;

      const refresh = () => {
        $$('.slot', root).forEach((s, i) => {
          const c = picked[i];
          s.innerHTML = c ? `<b>${escapeHtml(c.name)}</b>` : `<span>${i + 1}</span>`;
          s.classList.toggle('filled', !!c);
        });
        $('#s-check', root).disabled = picked.length !== 6;
      };

      $$('.sort-chip', root).forEach(ch => ch.addEventListener('click', () => {
        if (ch.classList.contains('used') || picked.length >= 6) return;
        ch.classList.add('used');
        picked.push(ND.byId[ch.dataset.id]);
        Sfx.click(); refresh();
      }));

      $('#s-undo', root).addEventListener('click', () => {
        const last = picked.pop();
        if (last) $$(`.sort-chip[data-id="${last.id}"]`, root).forEach(c => c.classList.remove('used'));
        refresh();
      });

      $('#s-check', root).addEventListener('click', () => {
        const correct = picked.filter((c, i) => c.id === seq[i].id).length;
        const perfect = correct === 6;
        score += correct * 10 + (perfect ? 40 : 0);
        if (perfect) { streak++; this.trackStreak(streak); Sfx.perfect(); } else { streak = 0; Sfx.bad(); }
        seq.forEach((c, i) => Store.scoreCorner(c.id, picked[i] && picked[i].id === c.id));
        this.setScore(root, score, streak);

        $$('.slot', root).forEach((s, i) => {
          s.classList.add(picked[i] && picked[i].id === seq[i].id ? 'right' : 'wrong');
        });
        $('#sort-fb', root).className = 'sort-fb show ' + (perfect ? 'ok' : 'no');
        $('#sort-fb', root).innerHTML = `
          <b>${correct} von 6 richtig${perfect ? ' — perfekt!' : ''}</b>
          <div class="sf-solution">Richtige Reihenfolge: ${seq.map(c => escapeHtml(c.name)).join(' → ')}</div>`;
        $('#s-check', root).disabled = true;
        round++;
        setTimeout(next, perfect ? 1800 : 3200);
      });

      refresh();
    };
    next();
  },

  /* ============================================================
     7) FLAGGEN-TRAINER
     ============================================================ */
  flags(root) {
    const body = this.shell(root, 'flags');
    let score = 0, streak = 0, q = 0, allRight = true;
    const pool = shuffle(ND.flags.concat(ND.flags)).slice(0, 12);

    const next = () => {
      if (q >= pool.length) {
        this.finish(root, 'flags', score, {
          label:'Punkte',
          detail: allRight ? 'Alles richtig — du kannst Streckenposten.' : '',
          xpFactor: 6,
          achCtx: { flagPerfect: allRight }
        });
        return;
      }
      const f = pool[q];
      const wrong = shuffle(ND.flags.filter(x => x.flag !== f.flag)).slice(0, 3);
      const opts = shuffle([f, ...wrong]);
      const askByVisual = Math.random() < 0.5;

      body.innerHTML = `
        <div class="flag-game">
          <div class="fg-progress"><div style="width:${q / pool.length * 100}%"></div></div>
          ${askByVisual
            ? `<div class="fg-visual" style="--c:${f.color}"><div class="fg-flag"></div></div>
               <h2 class="fg-q">Welche Flagge ist das?</h2>`
            : `<h2 class="fg-q">${escapeHtml(f.quiz)}</h2>
               <p class="fg-sub">Welche Flagge / welches Signal gehört dazu?</p>
               <div class="fg-rule">${escapeHtml(f.answer)}</div>`}
          <div class="q-options wide">
            ${opts.map(o => `<button class="q-opt flagopt" data-f="${o.flag}">
              <i style="background:${o.color}"></i>${escapeHtml(o.name)}</button>`).join('')}
          </div>
          <div class="fg-fb" id="fg-fb"></div>
        </div>`;

      $$('.q-opt', root).forEach(b => b.addEventListener('click', () => {
        const ok = b.dataset.f === f.flag;
        $$('.q-opt', root).forEach(x => {
          x.disabled = true;
          if (x.dataset.f === f.flag) x.classList.add('correct');
          else if (x === b) x.classList.add('wrong');
        });
        if (ok) { score += 10; streak++; this.trackStreak(streak); Sfx.good(); }
        else { streak = 0; allRight = false; Sfx.bad(); }
        this.setScore(root, score, streak);
        $('#fg-fb', root).className = 'fg-fb show ' + (ok ? 'ok' : 'no');
        $('#fg-fb', root).innerHTML = `<b>${escapeHtml(f.name)}:</b> ${escapeHtml(f.rule)}`;
        q++;
        setTimeout(next, ok ? 1500 : 2800);
      }));
    };
    next();
  }
};
