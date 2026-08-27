/* ============================================================
   VIEWS — die einzelnen Ansichten der App
   ============================================================ */

const Views = {};

/* ============================================================
   COCKPIT (Dashboard)
   ============================================================ */
Views.cockpit = function (root) {
  const d = Store.data;
  const mastered = Store.masteredCount(80);
  const total = ND.corners.length;
  const acc = d.totalCorrect + d.totalWrong > 0
    ? Math.round(d.totalCorrect / (d.totalCorrect + d.totalWrong) * 100) : 0;
  const fact = rand(ND.facts);
  const ach = Object.keys(d.achievements).length;

  root.innerHTML = `
    <div class="hero">
      <svg class="hero-track" viewBox="${ND.geo.viewBox.tight}" aria-hidden="true">
        <path d="${ND.geo.ns}"/>
      </svg>
      <div class="hero-content">
        <div class="kicker">Nordschleife · 20,832 km · 73 Kurven</div>
        <h1>Grüne Hölle<span>Academy</span></h1>
        <p class="hero-sub">Kurven, Bremspunkte und Namen lernen — für Assetto Corsa, NLS-Wochenenden und die 24 Stunden.</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-nav="games">Minispiele starten</button>
          <button class="btn" data-nav="map">Strecke erkunden</button>
          <button class="btn" data-nav="learn">Lernkarten</button>
        </div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Level</div>
        <div class="stat-value" id="cnt-level">${Store.level()}</div>
        <div class="stat-sub">${Store.levelName()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Erfahrung</div>
        <div class="stat-value" id="cnt-xp">${d.xp}</div>
        <div class="stat-sub">XP gesammelt</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Kurven gemeistert</div>
        <div class="stat-value"><span id="cnt-mast">${mastered}</span><small>/${total}</small></div>
        <div class="stat-sub">80 % Trefferquote+</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Trefferquote</div>
        <div class="stat-value">${acc}<small>%</small></div>
        <div class="stat-sub">${d.totalCorrect} richtig · ${d.totalWrong} falsch</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Beste Serie</div>
        <div class="stat-value">${d.bestStreak}</div>
        <div class="stat-sub">richtige in Folge</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Abzeichen</div>
        <div class="stat-value">${ach}<small>/${ND.achievements.length}</small></div>
        <div class="stat-sub">freigeschaltet</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h2 class="panel-h">Kurve des Tages</h2>
        <div id="corner-of-day"></div>
      </div>
      <div class="panel">
        <h2 class="panel-h">Mein nächstes Event</h2>
        <div id="countdown-box"></div>
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Fortschritt pro Abschnitt</h2>
      <div class="sector-progress" id="sector-progress"></div>
    </div>

    <div class="panel fact-panel">
      <h2 class="panel-h">Wusstest du?</h2>
      <p class="fact-text">${escapeHtml(fact)}</p>
      <button class="btn btn-sm" id="new-fact">Noch ein Fakt</button>
    </div>

    <div class="panel">
      <h2 class="panel-h">Schnellstart</h2>
      <div class="quick-grid">
        <button class="quick-card" data-nav="game:quiz"><span>🎯</span><b>Kurven-Quiz</b><i>Welche Kurve ist das?</i></button>
        <button class="quick-card" data-nav="game:blind"><span>🧠</span><b>Blind Lap</b><i>Was kommt als Nächstes?</i></button>
        <button class="quick-card" data-nav="game:brake"><span>🛑</span><b>Bremspunkt</b><i>Timing-Training</i></button>
        <button class="quick-card" data-nav="game:blitz"><span>⚡</span><b>Blitz 60</b><i>Links oder rechts?</i></button>
        <button class="quick-card" data-nav="guide"><span>🏕️</span><b>Zuschauer-Guide</b><i>NLS & 24h</i></button>
        <button class="quick-card" data-nav="ac"><span>🕹️</span><b>Assetto Corsa</b><i>Trainingspläne</i></button>
      </div>
    </div>
  `;

  /* Kurve des Tages — deterministisch pro Tag */
  const dayIdx = Math.floor(Date.now() / 864e5) % ND.nordschleife.length;
  const cod = ND.nordschleife[dayIdx];
  $('#corner-of-day', root).innerHTML = `
    <div class="cod">
      <div class="cod-badge" style="--c:${ND.sectorById[cod.sec].color}"></div>
      <div class="cod-body">
        <h3>${escapeHtml(cod.name)}</h3>
        <div class="chips">
          <span class="chip">${kmLabel(cod)}</span>
          <span class="chip">${dirLabel(cod.dir)}</span>
          <span class="chip">${escapeHtml(cod.gear)}. Gang</span>
          <span class="chip">${cod.alt} m</span>
        </div>
        <p>${escapeHtml(cod.desc)}</p>
        <p class="cod-tip"><b>Tipp:</b> ${escapeHtml(cod.tip)}</p>
        <button class="btn btn-sm" data-open-corner="${cod.id}">Im Lexikon öffnen</button>
      </div>
    </div>`;

  /* Countdown */
  renderCountdown($('#countdown-box', root));

  /* Sektor-Fortschritt */
  $('#sector-progress', root).innerHTML = ND.sectors.map(s => {
    const cs = ND.corners.filter(c => c.sec === s.id);
    const done = cs.filter(c => Store.masteryPct(c.id) >= 80).length;
    const pct = Math.round(done / cs.length * 100);
    return `<div class="sp-row">
      <div class="sp-name"><span class="dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</div>
      <div class="sp-bar"><div style="width:${pct}%;background:${s.color}"></div></div>
      <div class="sp-num">${done}/${cs.length}</div>
    </div>`;
  }).join('');

  $('#new-fact', root).addEventListener('click', e => {
    Sfx.click();
    $('.fact-text', root).textContent = rand(ND.facts);
  });

  $$('[data-open-corner]', root).forEach(b =>
    b.addEventListener('click', () => App.go('lexikon', { corner: b.dataset.openCorner })));
};

function renderCountdown(box) {
  const d = Store.data;
  const render = () => {
    if (!d.eventDate) {
      box.innerHTML = `
        <p class="muted">Trag dein nächstes Ring-Event ein — NLS-Lauf, 24h-Rennen, Trackday oder dein Assetto-Corsa-Liga-Rennen.</p>
        <div class="form-row">
          <input type="text" id="ev-name" placeholder="z. B. 24h-Rennen Nürburgring" maxlength="40">
          <input type="date" id="ev-date">
          <button class="btn btn-primary btn-sm" id="ev-save">Setzen</button>
        </div>`;
      $('#ev-save', box).addEventListener('click', () => {
        const n = $('#ev-name', box).value.trim() || 'Mein Ring-Event';
        const dt = $('#ev-date', box).value;
        if (!dt) { UI.toast('Kein Datum', 'Bitte ein Datum auswählen.'); return; }
        d.eventName = n; d.eventDate = dt; Store.save(); render();
      });
    } else {
      const target = new Date(d.eventDate + 'T08:00:00');
      const diff = target - new Date();
      const days = Math.floor(diff / 864e5);
      const hrs = Math.floor((diff % 864e5) / 36e5);
      const past = diff < 0;
      box.innerHTML = `
        <div class="countdown">
          <div class="cd-name">${escapeHtml(d.eventName)}</div>
          ${past
            ? `<div class="cd-big">Läuft / vorbei 🏁</div><div class="cd-sub">Viel Spaß an der Strecke!</div>`
            : `<div class="cd-big">${days}<small> Tage</small> ${hrs}<small> Std</small></div>
               <div class="cd-sub">${target.toLocaleDateString('de-DE', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}</div>`}
          <div class="cd-hint">Bis dahin: ${Math.max(0, 50 - Store.masteredCount(80))} Kurven noch zu meistern.</div>
          <button class="btn btn-sm" id="ev-clear">Ändern</button>
        </div>`;
      $('#ev-clear', box).addEventListener('click', () => {
        d.eventDate = null; Store.save(); render();
      });
    }
  };
  render();
}

/* ============================================================
   STRECKENKARTE
   ============================================================ */
Views.map = function (root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Streckenkarte</h1>
      <p>Klick auf jede Kurve für Details. Grün umrandete Punkte hast du bereits gemeistert.</p>
    </div>

    <div class="map-toolbar">
      <div class="seg" id="sector-filter">
        <button class="seg-btn is-on" data-sec="all">Alle</button>
        ${ND.sectors.map(s => `<button class="seg-btn" data-sec="${s.id}"
           style="--c:${s.color}">${s.short}</button>`).join('')}
      </div>
      <div class="tool-right">
        <label class="switch"><input type="checkbox" id="tg-labels" ${Store.data.settings.labels ? 'checked' : ''}><span></span>Namen</label>
        <label class="switch"><input type="checkbox" id="tg-gp" ${Store.data.settings.showGP ? 'checked' : ''}><span></span>GP-Strecke</label>
        <button class="btn btn-sm btn-primary" id="btn-lap">▶ Runde abspielen</button>
      </div>
    </div>

    <div class="map-layout">
      <div class="map-wrap" id="map-wrap"></div>
      <aside class="map-side" id="map-side"></aside>
    </div>

    <div class="panel">
      <h2 class="panel-h">Höhenprofil der Nordschleife</h2>
      <p class="muted small">Von Breidscheid (320 m) bis zur Hohen Acht (617 m) — knapp 300 Höhenmeter Unterschied.</p>
      <div class="elev-wrap" id="elev-wrap"></div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Die Abschnitte</h2>
      <div class="sector-cards">
        ${ND.sectors.map(s => `
          <div class="sector-card" style="--c:${s.color}">
            <div class="sc-head"><span class="sc-badge">${s.short}</span><b>${escapeHtml(s.name)}</b></div>
            <p>${escapeHtml(s.desc)}</p>
            <div class="sc-count">${ND.corners.filter(c => c.sec === s.id).length} Kurven</div>
          </div>`).join('')}
      </div>
    </div>
  `;

  let currentSec = 'all';
  let lapAnim = null;

  const drawMap = (highlight = []) => {
    const wrap = $('#map-wrap', root);
    wrap.innerHTML = TrackMap.render({
      labels: Store.data.settings.labels,
      showGP: Store.data.settings.showGP,
      highlight
    });
    applyFilter();
    TrackMap.bind(wrap, id => showSide(id));
  };

  const applyFilter = () => {
    const svg = $('.track-svg', root);
    if (!svg) return;
    svg.classList.toggle('filtered', currentSec !== 'all');
    // Beim Filtern eines Abschnitts alle Namen dieses Abschnitts zeigen
    svg.classList.toggle('show-all-labels', currentSec !== 'all');
    $$('.corner-dot', svg).forEach(g => {
      const c = ND.byId[g.dataset.id];
      g.classList.toggle('is-off', currentSec !== 'all' && c.sec !== currentSec);
    });
    $$('.corner-label', svg).forEach(t => {
      const c = ND.byId[t.dataset.id];
      t.classList.toggle('is-off', currentSec !== 'all' && c.sec !== currentSec);
    });
    $$('.sector-line', svg).forEach(p =>
      p.classList.toggle('is-on', currentSec !== 'all' && p.dataset.sec === currentSec));
  };

  const showSide = id => {
    const c = ND.byId[id];
    if (!c) return;
    Store.data.seen[id] = true; Store.save(); Achievements.check();
    const side = $('#map-side', root);
    side.innerHTML = cornerCard(c, true);
    side.classList.add('is-open');
    $$('.corner-dot', root).forEach(g => g.classList.toggle('is-hl', g.dataset.id === id));
    $$('.elev-dot', root).forEach(g => g.classList.toggle('is-hl', g.dataset.id === id));
    $$('[data-open-lex]', side).forEach(b =>
      b.addEventListener('click', () => App.go('lexikon', { corner: id })));
  };

  drawMap();
  $('#elev-wrap', root).innerHTML = TrackMap.elevation();
  $$('.elev-dot', root).forEach(dot =>
    dot.addEventListener('click', () => showSide(dot.dataset.id)));

  $('#map-side', root).innerHTML = `
    <div class="side-empty">
      <div class="se-icon">👆</div>
      <h3>Kurve auswählen</h3>
      <p>Klick auf einen Punkt in der Karte oder im Höhenprofil, um Bremspunkt, Gang, Fahrtipp und Geschichte zu sehen.</p>
    </div>`;

  $$('#sector-filter .seg-btn', root).forEach(b =>
    b.addEventListener('click', () => {
      Sfx.click();
      $$('#sector-filter .seg-btn', root).forEach(x => x.classList.remove('is-on'));
      b.classList.add('is-on');
      currentSec = b.dataset.sec;
      applyFilter();
    }));

  $('#tg-labels', root).addEventListener('change', e => {
    Store.data.settings.labels = e.target.checked; Store.save(); drawMap();
  });
  $('#tg-gp', root).addEventListener('change', e => {
    Store.data.settings.showGP = e.target.checked; Store.save(); drawMap();
  });

  $('#btn-lap', root).addEventListener('click', () => {
    const btn = $('#btn-lap', root);
    if (lapAnim) { lapAnim.stop(); lapAnim = null; btn.textContent = '▶ Runde abspielen'; return; }
    Sfx.rev();
    btn.textContent = '⏹ Stopp';
    const ticker = $('#map-side', root);
    ticker.innerHTML = `<div class="lap-ticker"><h3>Runde läuft</h3><ul id="lap-list"></ul></div>`;
    lapAnim = TrackMap.animate($('#map-wrap', root), 40,
      id => {
        const c = ND.byId[id];
        if (!c) return;
        const li = el('li', '', `<span class="lt-dot" style="background:${ND.sectorById[c.sec].color}"></span>
          <b>${escapeHtml(c.name)}</b><i>${kmLabel(c)}</i>`);
        const list = $('#lap-list', root);
        if (list) { list.prepend(li); while (list.children.length > 12) list.lastChild.remove(); }
        Sfx.tick();
      },
      () => { lapAnim = null; btn.textContent = '▶ Runde abspielen'; UI.toast('🏁 Runde beendet', 'Schematische Fahrt in 40 Sekunden.'); });
  });

  if (App.params.corner) showSide(App.params.corner);
};

/* Kurven-Karte (wiederverwendet in Karte + Lexikon) */
function cornerCard(c, compact) {
  const sec = ND.sectorById[c.sec];
  const mast = Store.masteryPct(c.id);
  return `
    <article class="corner-card" style="--c:${sec.color}">
      <header class="cc-head">
        <div class="cc-nr">${c.nr}</div>
        <div>
          <h3>${escapeHtml(c.name)}</h3>
          ${c.alias ? `<div class="cc-alias">auch: ${escapeHtml(c.alias)}</div>` : ''}
        </div>
        <div class="cc-dir" title="${dirLabel(c.dir)}">${dirIcon(c.dir)}</div>
      </header>

      <div class="cc-stats">
        <div><span>Abschnitt</span><b>${sec.short} · ${escapeHtml(sec.name)}</b></div>
        <div><span>Position</span><b>${kmLabel(c)}</b></div>
        <div><span>Höhe</span><b>${c.alt} m</b></div>
        <div><span>Richtung</span><b>${dirLabel(c.dir)}</b></div>
        <div><span>Gang</span><b>${escapeHtml(c.gear)}</b></div>
        <div><span>Tempo</span><b>${escapeHtml(c.spd)}</b></div>
        <div><span>Bremspunkt</span><b>${c.bp ? c.bp + ' m' : '— (kein Bremspunkt)'}</b></div>
        <div><span>Risiko</span><b class="risk r${c.risk}">${'▮'.repeat(c.risk)}${'▯'.repeat(5 - c.risk)}</b></div>
      </div>

      <p class="cc-desc">${escapeHtml(c.desc)}</p>

      <div class="cc-block tip"><b>Fahrtipp</b><p>${escapeHtml(c.tip)}</p></div>
      ${c.ac   ? `<div class="cc-block ac"><b>Assetto Corsa</b><p>${escapeHtml(c.ac)}</p></div>` : ''}
      ${c.fact ? `<div class="cc-block fact"><b>Geschichte</b><p>${escapeHtml(c.fact)}</p></div>` : ''}
      ${c.spot ? `<div class="cc-block spot"><b>Als Zuschauer</b><p>${escapeHtml(c.spot)}</p></div>` : ''}

      <footer class="cc-foot">
        <div class="mast">
          <span>Meisterschaft</span>
          <div class="mast-bar"><div style="width:${mast}%"></div></div>
          <b>${mast}%</b>
        </div>
        ${compact ? `<button class="btn btn-sm" data-open-lex="${c.id}">Vollansicht</button>` : ''}
      </footer>
    </article>`;
}

/* ============================================================
   LEXIKON
   ============================================================ */
Views.lexikon = function (root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Kurven-Lexikon</h1>
      <p>Alle ${ND.corners.length} benannten Kurven und Passagen der NLS-Runde — in Fahrtrichtung sortiert.</p>
    </div>

    <div class="lex-toolbar">
      <input type="search" id="lex-search" placeholder="🔍 Kurve suchen … (Name, Spitzname, Abschnitt)">
      <div class="seg" id="lex-filter">
        <button class="seg-btn is-on" data-sec="all">Alle</button>
        ${ND.sectors.map(s => `<button class="seg-btn" data-sec="${s.id}" style="--c:${s.color}">${s.short}</button>`).join('')}
      </div>
    </div>

    <div class="lex-layout">
      <nav class="lex-list" id="lex-list"></nav>
      <div class="lex-detail" id="lex-detail"></div>
    </div>`;

  let sec = 'all', q = '';
  let active = App.params.corner || ND.corners[11].id;

  const list = () => {
    const items = ND.corners.filter(c => {
      if (sec !== 'all' && c.sec !== sec) return false;
      if (!q) return true;
      const hay = (c.name + ' ' + (c.alias || '') + ' ' + ND.sectorById[c.sec].name).toLowerCase();
      return hay.includes(q);
    });
    $('#lex-list', root).innerHTML = items.length ? items.map(c => {
      const m = Store.masteryPct(c.id);
      return `<button class="lex-item${c.id === active ? ' is-active' : ''}" data-id="${c.id}"
        style="--c:${ND.sectorById[c.sec].color}">
        <span class="li-nr">${c.nr}</span>
        <span class="li-name">${escapeHtml(c.name)}<i>${kmLabel(c)} · ${dirLabel(c.dir)}</i></span>
        <span class="li-mast${m >= 80 ? ' good' : ''}">${m}%</span>
      </button>`;
    }).join('') : `<div class="lex-empty">Nichts gefunden.</div>`;

    $$('.lex-item', root).forEach(b =>
      b.addEventListener('click', () => { active = b.dataset.id; Sfx.click(); list(); detail(); }));
  };

  const detail = () => {
    const c = ND.byId[active];
    Store.data.seen[active] = true; Store.save(); Achievements.check();
    const idx = ND.corners.indexOf(c);
    const prev = ND.corners[(idx - 1 + ND.corners.length) % ND.corners.length];
    const next = ND.corners[(idx + 1) % ND.corners.length];
    $('#lex-detail', root).innerHTML = `
      ${cornerCard(c, false)}
      <div class="lex-nav">
        <button class="btn btn-sm" data-go="${prev.id}">${escapeHtml(prev.name)}</button>
        <div class="mini-map" id="mini-map"></div>
        <button class="btn btn-sm" data-go="${next.id}">${escapeHtml(next.name)} →</button>
      </div>`;
    $('#mini-map', root).innerHTML = TrackMap.render({
      labels: false, showGP: true, highlight: [c.id], interactive: false
    });
    $$('[data-go]', root).forEach(b =>
      b.addEventListener('click', () => { active = b.dataset.go; Sfx.click(); list(); detail();
        $('.lex-detail', root).scrollIntoView({ behavior:'smooth', block:'start' }); }));
  };

  $('#lex-search', root).addEventListener('input', e => { q = e.target.value.toLowerCase().trim(); list(); });
  $$('#lex-filter .seg-btn', root).forEach(b =>
    b.addEventListener('click', () => {
      $$('#lex-filter .seg-btn', root).forEach(x => x.classList.remove('is-on'));
      b.classList.add('is-on'); sec = b.dataset.sec; Sfx.click(); list();
    }));

  list(); detail();
};

/* ============================================================
   LERNKARTEN (Leitner-System)
   ============================================================ */
Views.learn = function (root) {
  const S = Store.data;
  S.box = S.box || {};

  root.innerHTML = `
    <div class="view-head">
      <h1>Lernkarten</h1>
      <p>Karteikasten-System: Was du kannst, kommt seltener. Was du nicht kannst, kommt wieder.</p>
    </div>

    <div class="learn-setup panel" id="learn-setup">
      <h2 class="panel-h">Deck zusammenstellen</h2>
      <div class="lset">
        <div class="lset-block">
          <label>Abschnitt</label>
          <div class="seg" id="ld-sec">
            <button class="seg-btn is-on" data-sec="all">Ganze Runde</button>
            ${ND.sectors.map(s => `<button class="seg-btn" data-sec="${s.id}" style="--c:${s.color}">${s.short}</button>`).join('')}
          </div>
        </div>
        <div class="lset-block">
          <label>Was willst du lernen?</label>
          <div class="seg" id="ld-mode">
            <button class="seg-btn is-on" data-mode="mix">Alles gemischt</button>
            <button class="seg-btn" data-mode="name">Namen</button>
            <button class="seg-btn" data-mode="dir">Richtung</button>
            <button class="seg-btn" data-mode="gear">Gang</button>
            <button class="seg-btn" data-mode="brake">Bremspunkt</button>
            <button class="seg-btn" data-mode="order">Reihenfolge</button>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" id="ld-start">Lernsession starten</button>
      <div class="box-stats" id="box-stats"></div>
    </div>

    <div id="learn-session"></div>`;

  let sec = 'all', mode = 'mix';

  const boxStats = () => {
    const counts = [0, 0, 0, 0, 0, 0];
    ND.corners.forEach(c => { counts[S.box[c.id] || 0]++; });
    $('#box-stats', root).innerHTML = `
      <div class="bs-title">Dein Karteikasten</div>
      <div class="bs-row">
        ${['Neu','Fach 1','Fach 2','Fach 3','Fach 4','Sitzt'].map((n, i) => `
          <div class="bs-box${i === 5 ? ' done' : ''}">
            <b>${counts[i]}</b><span>${n}</span>
          </div>`).join('')}
      </div>`;
  };
  boxStats();

  $$('#ld-sec .seg-btn', root).forEach(b => b.addEventListener('click', () => {
    $$('#ld-sec .seg-btn', root).forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on'); sec = b.dataset.sec; Sfx.click();
  }));
  $$('#ld-mode .seg-btn', root).forEach(b => b.addEventListener('click', () => {
    $$('#ld-mode .seg-btn', root).forEach(x => x.classList.remove('is-on'));
    b.classList.add('is-on'); mode = b.dataset.mode; Sfx.click();
  }));

  $('#ld-start', root).addEventListener('click', () => startSession());

  function buildDeck() {
    let pool = ND.quizPool.filter(c => sec === 'all' || c.sec === sec);
    if (mode === 'brake') pool = pool.filter(c => c.bp);
    if (mode === 'name')  pool = pool.filter(c => c.km != null);
    // Leitner-Gewichtung: niedriges Fach → häufiger
    const weighted = [];
    pool.forEach(c => {
      const lvl = S.box[c.id] || 0;
      const reps = Math.max(1, 4 - lvl);
      for (let i = 0; i < reps; i++) weighted.push(c);
    });
    return shuffle(weighted).slice(0, Math.min(20, Math.max(8, pool.length)));
  }

  function cardFor(c, m) {
    const modes = ['name', 'dir', 'gear', 'order'].concat(c.bp ? ['brake'] : []);
    let use = m === 'mix' ? rand(modes) : m;
    // Die Kilometer-Frage funktioniert nur auf der Nordschleife
    if (use === 'name' && c.km == null) use = 'dir';
    const idx = ND.corners.indexOf(c);
    const next = ND.corners[(idx + 1) % ND.corners.length];
    switch (use) {
      case 'name':
        return { q: `Welche Kurve liegt bei <b>km ${c.km.toFixed(2)}</b> im Abschnitt <b>${ND.sectorById[c.sec].name}</b>?`,
                 a: c.name, sub: c.alias ? `auch: ${c.alias}` : '', map: [c.id] };
      case 'dir':
        return { q: `In welche Richtung geht <b>${escapeHtml(c.name)}</b>?`,
                 a: dirLabel(c.dir), sub: c.desc, map: [c.id] };
      case 'gear':
        return { q: `Welcher Gang passt in <b>${escapeHtml(c.name)}</b>? (GT3-Richtwert)`,
                 a: `${c.gear}. Gang · ${c.spd}`, sub: c.tip, map: [c.id] };
      case 'brake':
        return { q: `Wo ist der Bremspunkt für <b>${escapeHtml(c.name)}</b>?`,
                 a: `ca. ${c.bp} m vor der Kurve`, sub: c.tip, map: [c.id] };
      case 'order':
      default:
        return { q: `Welche Kurve kommt direkt <b>nach ${escapeHtml(c.name)}</b>?`,
                 a: next.name, sub: `${kmLabel(next)} · ${dirLabel(next.dir)}`, map: [c.id, next.id] };
    }
  }

  function startSession() {
    Sfx.rev();
    const deck = buildDeck();
    let i = 0, right = 0, wrong = 0;
    $('#learn-setup', root).style.display = 'none';
    const host = $('#learn-session', root);

    const draw = () => {
      if (i >= deck.length) {
        host.innerHTML = `
          <div class="panel result">
            <h2>Session beendet</h2>
            <div class="res-grid">
              <div><b>${right}</b><span>gewusst</span></div>
              <div><b>${wrong}</b><span>nochmal üben</span></div>
              <div><b>${Math.round(right / deck.length * 100)}%</b><span>Quote</span></div>
              <div><b>+${right * 12}</b><span>XP</span></div>
            </div>
            <div class="res-actions">
              <button class="btn btn-primary" id="again">Nochmal</button>
              <button class="btn" data-nav="games">Zu den Minispielen</button>
            </div>
          </div>`;
        Store.addXP(right * 12);
        $('#again', root).addEventListener('click', () => {
          host.innerHTML = ''; $('#learn-setup', root).style.display = ''; boxStats();
        });
        return;
      }
      const c = deck[i];
      const card = cardFor(c, mode);
      host.innerHTML = `
        <div class="learn-hud">
          <div class="lh-progress"><div style="width:${i / deck.length * 100}%"></div></div>
          <div class="lh-meta">Karte ${i + 1} / ${deck.length} · Fach ${(S.box[c.id] || 0)} · ✅ ${right} ❌ ${wrong}</div>
        </div>
        <div class="flashcard" id="fc">
          <div class="fc-inner">
            <div class="fc-front">
              <div class="fc-sec" style="color:${ND.sectorById[c.sec].color}">${ND.sectorById[c.sec].name}</div>
              <div class="fc-q">${card.q}</div>
              <div class="fc-mini" id="fc-mini"></div>
              <div class="fc-hint">Klicken zum Umdrehen</div>
            </div>
            <div class="fc-back">
              <div class="fc-a">${escapeHtml(card.a)}</div>
              ${card.sub ? `<div class="fc-sub">${escapeHtml(card.sub)}</div>` : ''}
            </div>
          </div>
        </div>
        <div class="fc-actions" id="fc-actions" style="visibility:hidden">
          <button class="btn btn-bad" id="fc-no">Nochmal</button>
          <button class="btn btn-good" id="fc-yes">Gewusst</button>
        </div>`;

      $('#fc-mini', root).innerHTML = TrackMap.render({
        labels: false, showGP: true, highlight: card.map, interactive: false });

      const fc = $('#fc', root);
      fc.addEventListener('click', () => {
        if (fc.classList.contains('flipped')) return;
        fc.classList.add('flipped'); Sfx.click();
        $('#fc-actions', root).style.visibility = 'visible';
      });

      const answer = ok => {
        Sfx[ok ? 'good' : 'bad']();
        const lvl = S.box[c.id] || 0;
        S.box[c.id] = ok ? Math.min(5, lvl + 1) : 0;
        Store.scoreCorner(c.id, ok);
        if (ok) right++; else { wrong++; deck.push(c); }
        Store.save(); i++; draw();
      };
      $('#fc-yes', root).addEventListener('click', () => answer(true));
      $('#fc-no',  root).addEventListener('click', () => answer(false));
    };
    draw();
  }
};

/* ============================================================
   ZUSCHAUER-GUIDE (NLS & 24h)
   ============================================================ */
Views.guide = function (root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Zuschauer-Guide</h1>
      <p>Für NLS-Läufe und die 24 Stunden: wo du hin willst, was du siehst und was am Streckenrand eigentlich passiert.</p>
    </div>

    <div class="tabs" id="guide-tabs">
      <button class="tab is-on" data-t="spots">Beste Plätze</button>
      <button class="tab" data-t="classes">Klassen lesen</button>
      <button class="tab" data-t="flags">Flaggen & Code 60</button>
      <button class="tab" data-t="24h">🌙 24h-Wissen</button>
      <button class="tab" data-t="calc">Renn-Rechner</button>
    </div>

    <div id="guide-body"></div>`;

  const body = $('#guide-body', root);

  const tabs = {
    spots() {
      body.innerHTML = `
        <p class="muted">Bewertung aus Zuschauersicht: Action, Nähe zur Strecke und Atmosphäre.</p>
        <div class="spot-grid">
          ${ND.spots.sort((a, b) => b.rating - a.rating).map(s => `
            <div class="spot-card" style="--c:${ND.sectorById[s.sec].color}">
              <div class="sp-head">
                <h3>${escapeHtml(s.name)}</h3>
                <div class="stars">${'★'.repeat(s.rating)}${'☆'.repeat(5 - s.rating)}</div>
              </div>
              <div class="sp-tags">${s.tags.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div>
              <p class="sp-view"><b>Was du siehst:</b> ${escapeHtml(s.view)}</p>
              <p class="sp-tip">${escapeHtml(s.tip)}</p>
              ${s.warn ? `<p class="sp-warn">⚠️ ${escapeHtml(s.warn)}</p>` : ''}
            </div>`).join('')}
        </div>
        <div class="panel">
          <h2 class="panel-h">Packliste Nordschleife</h2>
          <ul class="check-list">
            <li>Regenjacke — <b>immer</b>. Das Eifelwetter wechselt auf 20 km Strecke mehrmals.</li>
            <li>Feste Schuhe: die Zuschauerhügel sind Wiese, Wald und Matsch.</li>
            <li>Gehörschutz, besonders für Kinder. GT3-Autos sind laut.</li>
            <li>Bargeld — nicht überall an der Strecke gibt es Kartenzahlung.</li>
            <li>Powerbank: Handyempfang und Akku leiden im Wald.</li>
            <li>Fernglas und/oder Teleobjektiv für Pflanzgarten und Schwedenkreuz.</li>
            <li>Campingstuhl, Decke, Verpflegung — die Wege zwischen den Spots sind lang.</li>
            <li>Bei 24h: Stirnlampe. Nachts ist es im Wald wirklich stockdunkel.</li>
          </ul>
        </div>`;
    },

    classes() {
      body.innerHTML = `
        <p class="muted">Im NLS-Feld starten Fahrzeuge mit über 100 km/h Geschwindigkeitsunterschied gleichzeitig. Wer die Klassen kennt, versteht das Rennen.</p>
        <div class="class-list">
          ${ND.classes.map(c => `
            <div class="class-row">
              <div class="cl-code">${escapeHtml(c.code)}</div>
              <div class="cl-desc">${escapeHtml(c.desc)}</div>
              <div class="cl-speed">${escapeHtml(c.speed)}</div>
            </div>`).join('')}
        </div>
        <div class="panel">
          <h2 class="panel-h">So liest du ein NLS-Rennen</h2>
          <ul class="check-list">
            <li><b>Der Gesamtsieger ist nicht die einzige Story.</b> In jeder Klasse läuft ein eigenes Rennen — oft spannender als vorn.</li>
            <li><b>Verkehr ist die halbe Miete.</b> Ein GT3 überrundet pro Runde dutzende Autos. Wer den Verkehr besser löst, gewinnt.</li>
            <li><b>Achte auf die Startnummernfarben.</b> Sie sind nach Klassen gruppiert und helfen beim Zuordnen an der Strecke.</li>
            <li><b>Boxenstopps entscheiden.</b> Bei 4-Stunden-Läufen ist die Stopp-Strategie oft wichtiger als die Rundenzeit.</li>
            <li><b>Code 60 verändert alles.</b> Wer kurz vor einer Code-60-Phase stoppt, gewinnt viel Zeit — reines Glück, aber rennentscheidend.</li>
          </ul>
        </div>`;
    },

    flags() {
      body.innerHTML = `
        <p class="muted">Auf 20 km Strecke ist Flaggensignalisierung überlebenswichtig. Klick auf eine Flagge für die Regel.</p>
        <div class="flag-grid">
          ${ND.flags.map(f => `
            <div class="flag-card" style="--c:${f.color}">
              <div class="flag-visual"></div>
              <h3>${escapeHtml(f.name)}</h3>
              <p>${escapeHtml(f.rule)}</p>
            </div>`).join('')}
        </div>
        <div class="panel highlight-panel">
          <h2 class="panel-h">Code 60 — die Nordschleifen-Erfindung</h2>
          <p>Auf einer 20-km-Strecke ist ein Safety Car sinnlos: bis er das Feld eingesammelt hat, vergehen Minuten und die Abstände sind zerstört.
             Deshalb gibt es <b>Code 60</b>: Nur der betroffene Streckenabschnitt wird auf <b>60 km/h</b> begrenzt, mit striktem Überholverbot.
             Der Rest der Strecke läuft normal weiter.</p>
          <p>Für dich als Zuschauer heißt das: Wenn plötzlich alle Autos vor dir im Schritttempo und in Reih und Glied vorbeifahren, ist irgendwo
             vorne etwas passiert. Die Abstände bleiben erhalten — wer 8 Sekunden vorn lag, liegt danach immer noch 8 Sekunden vorn.</p>
          <button class="btn btn-primary" data-nav="game:flags">Flaggen-Trainer spielen</button>
        </div>`;
    },

    '24h'() {
      body.innerHTML = `
        <div class="panel">
          <h2 class="panel-h">Die 24 Stunden — was du wissen musst</h2>
          <div class="info-grid">
            <div class="info-card"><b>Über 100 Autos</b><p>Startfeld aus GT3-Boliden, Cup-Fahrzeugen und seriennahen Tourenwagen — alle gleichzeitig auf der Strecke.</p></div>
            <div class="info-card"><b>Die Nacht ist die Prüfung</b><p>Im Wald gibt es keine Streckenbeleuchtung. Fahrer orientieren sich an Leitplanken, Streckenposten und Erinnerung.</p></div>
            <div class="info-card"><b>Nebel stoppt alles</b><p>Die Eifel ist berüchtigt: Bei dichtem Nebel wird das Rennen unterbrochen — es gab Ausgaben mit stundenlanger Rotphase.</p></div>
            <div class="info-card"><b>Fahrerwechsel</b><p>Jedes Auto teilt sich auf mehrere Fahrer auf. Wechsel finden im Boxenstopp statt — Anschnallen, Funk, Trinkschlauch, alles in Sekunden.</p></div>
            <div class="info-card"><b>Nordschleifen-Permit</b><p>Wer hier starten will, braucht eine spezielle Lizenz (DMSB Permit). Man arbeitet sich über langsamere Klassen hoch.</p></div>
            <div class="info-card"><b>Die Zuschauer sind Teil des Events</b><p>Zeltlager, Grill, Fahnen, Tribünen im Wald. Die 24h sind genauso Festival wie Rennen.</p></div>
          </div>
        </div>
        <div class="panel">
          <h2 class="panel-h">Dein 24h-Zeitplan als Zuschauer</h2>
          <div class="timeline">
            <div class="tl-item"><b>Vor dem Start</b><p>Boxengassen-Spaziergang, wenn angeboten. Autos aus der Nähe, Fahrer treffen, Atmosphäre aufsaugen.</p></div>
            <div class="tl-item"><b>Start & erste Stunde</b><p>Unbedingt an einer engen Stelle stehen — Adenauer Forst oder Brünnchen. Das Gedränge im vollen Feld ist einmalig.</p></div>
            <div class="tl-item"><b>Nachmittag</b><p>Zeit zum Wandern. Von Brünnchen zum Pflanzgarten und weiter zum Schwalbenschwanz ist gut zu Fuß machbar.</p></div>
            <div class="tl-item"><b>Sonnenuntergang</b><p>Die goldene Stunde am Pflanzgarten. Beste Fotos des ganzen Wochenendes.</p></div>
            <div class="tl-item"><b>Nacht</b><p>Karussell oder Brünnchen: glühende Bremsscheiben, Flammen aus dem Auspuff, Lichtkegel im Wald. Der Grund, warum man hinfährt.</p></div>
            <div class="tl-item"><b>Morgengrauen</b><p>Nebel über der Eifel, müde Autos, müde Fans. Der emotionalste Teil des Rennens.</p></div>
            <div class="tl-item"><b>Zieleinlauf</b><p>Zurück zur GP-Strecke. Tribüne, Boxengasse, Podium. Der Kreis schließt sich.</p></div>
          </div>
        </div>
        <div class="panel">
          <h2 class="panel-h">Legenden & Rekorde</h2>
          <ul class="check-list">
            <li><b>Stefan Bellof, 1983:</b> 6:11,13 min im Porsche 956 im Qualifying — jahrzehntelang das Maß aller Dinge.</li>
            <li><b>Timo Bernhard, 2018:</b> 5:19,546 min im Porsche 919 Hybrid Evo. Der absolute Streckenrekord.</li>
            <li><b>Niki Lauda, 1976:</b> Der Unfall am Bergwerk beendete die Formel-1-Ära auf der Nordschleife.</li>
            <li><b>Sabine Schmitz:</b> Zweifache 24h-Siegerin und Gesicht der Nordschleife.</li>
            <li><b>Jackie Stewart:</b> Prägte den Namen "Grüne Hölle".</li>
          </ul>
        </div>`;
    },

    calc() {
      body.innerHTML = `
        <div class="panel">
          <h2 class="panel-h">Renn-Rechner</h2>
          <p class="muted">Rechne aus, was eine Rundenzeit für ein 24-Stunden-Rennen bedeutet.</p>
          <div class="calc-form">
            <label>Rundenzeit
              <div class="calc-time">
                <input type="number" id="c-min" value="8" min="0" max="59"> :
                <input type="number" id="c-sec" value="30" min="0" max="59">
              </div>
            </label>
            <label>Streckenlänge
              <select id="c-len">
                <option value="24.358">NLS / 24h — 24,358 km</option>
                <option value="20.832">Nordschleife — 20,832 km</option>
              </select>
            </label>
            <label>Renndauer (Stunden)
              <input type="number" id="c-dur" value="24" min="1" max="24">
            </label>
            <label>Boxenstopps
              <input type="number" id="c-stops" value="30" min="0" max="80">
            </label>
            <label>Zeitverlust pro Stopp (Sek.)
              <input type="number" id="c-loss" value="90" min="0" max="600">
            </label>
          </div>
          <div class="calc-out" id="calc-out"></div>
        </div>`;

      const calc = () => {
        const min = +$('#c-min', root).value || 0;
        const sec = +$('#c-sec', root).value || 0;
        const lap = min * 60 + sec;
        const len = +$('#c-len', root).value;
        const dur = (+$('#c-dur', root).value || 24) * 3600;
        const stops = +$('#c-stops', root).value || 0;
        const loss = +$('#c-loss', root).value || 0;
        if (lap <= 0) return;
        const net = Math.max(0, dur - stops * loss);
        const laps = Math.floor(net / lap);
        const km = laps * len;
        const speed = km / (dur / 3600);
        $('#calc-out', root).innerHTML = `
          <div class="res-grid">
            <div><b>${laps}</b><span>Runden</span></div>
            <div><b>${Math.round(km).toLocaleString('de-DE')}</b><span>km gefahren</span></div>
            <div><b>${speed.toFixed(1)}</b><span>km/h Schnitt</span></div>
            <div><b>${(km / 40075 * 100).toFixed(1)}%</b><span>eines Erdumfangs</span></div>
            <div><b>${Math.round(stops * loss / 60)}</b><span>Min. in der Box</span></div>
            <div><b>${(laps / Math.max(1, stops + 1)).toFixed(1)}</b><span>Runden pro Stint</span></div>
          </div>
          <p class="muted small">Vereinfachte Rechnung ohne Code-60-Phasen, Safety-Car, Nebelunterbrechungen und Reifenabbau — also ohne alles, was die Nordschleife ausmacht.</p>`;
      };
      $$('#guide-body input, #guide-body select', root).forEach(i =>
        i.addEventListener('input', calc));
      calc();
    }
  };

  $$('#guide-tabs .tab', root).forEach(t => t.addEventListener('click', () => {
    $$('#guide-tabs .tab', root).forEach(x => x.classList.remove('is-on'));
    t.classList.add('is-on'); Sfx.click(); tabs[t.dataset.t]();
  }));
  tabs.spots();
};

/* ============================================================
   ASSETTO CORSA
   ============================================================ */
Views.ac = function (root) {
  root.innerHTML = `
    <div class="view-head">
      <h1>Assetto Corsa Ecke</h1>
      <p>Trainingspläne, Setup-Grundlagen und Referenzzeiten, um die Nordschleife im Sim wirklich zu lernen — nicht nur zu überleben.</p>
    </div>

    <div class="panel">
      <h2 class="panel-h">Trainingspläne</h2>
      <div class="drill-grid">
        ${ND.acContent.drills.map(d => `
          <div class="drill-card">
            <div class="dc-time">${escapeHtml(d.time)}</div>
            <h3>${escapeHtml(d.title)}</h3>
            <p>${escapeHtml(d.body)}</p>
          </div>`).join('')}
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Setup-Grundlagen für die Nordschleife</h2>
      <div class="setup-grid">
        ${ND.acContent.setup.map(s => `
          <div class="setup-card"><b>${escapeHtml(s.title)}</b><p>${escapeHtml(s.body)}</p></div>`).join('')}
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-h">⏱️ Referenzzeiten zur Orientierung</h2>
      <table class="ref-table">
        <thead><tr><th>Fahrzeug / Niveau</th><th>Rundenzeit</th></tr></thead>
        <tbody>
          ${ND.acContent.refTimes.map(r => `<tr><td>${escapeHtml(r.car)}</td><td><b>${escapeHtml(r.time)}</b></td></tr>`).join('')}
        </tbody>
      </table>
      <p class="muted small">Richtwerte. Rundenzeiten hängen stark von Version, Mod, Reifen und Bedingungen ab — nutz sie als Orientierung, nicht als Ziel.</p>
    </div>

    <div class="panel">
      <h2 class="panel-h">Tipps für den Einstieg</h2>
      <ul class="check-list">
        ${ND.acContent.tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
      </ul>
    </div>

    <div class="panel highlight-panel">
      <h2 class="panel-h">Dein persönlicher Trainingsplan</h2>
      <p>Basierend auf deinen schwächsten Kurven aus den Minispielen:</p>
      <div id="weak-list"></div>
    </div>`;

  const weak = ND.corners
    .map(c => ({ c, m: Store.masteryPct(c.id), tries: (Store.data.mastery[c.id] || { c:0, w:0 }) }))
    .filter(x => x.tries.c + x.tries.w > 0)
    .sort((a, b) => a.m - b.m).slice(0, 8);

  $('#weak-list', root).innerHTML = weak.length ? `
    <div class="weak-grid">
      ${weak.map(x => `
        <div class="weak-card" style="--c:${ND.sectorById[x.c.sec].color}">
          <b>${escapeHtml(x.c.name)}</b>
          <span class="weak-pct">${x.m}%</span>
          <p>${escapeHtml(x.c.tip)}</p>
          <button class="btn btn-sm" data-open-corner="${x.c.id}">Details</button>
        </div>`).join('')}
    </div>` : `<p class="muted">Spiel ein paar Minispiele — danach zeigt dir die Academy hier genau, welche Kurven du üben solltest.</p>`;

  $$('[data-open-corner]', root).forEach(b =>
    b.addEventListener('click', () => App.go('lexikon', { corner: b.dataset.openCorner })));
};

/* ============================================================
   PROFIL
   ============================================================ */
Views.profile = function (root) {
  const d = Store.data;
  const acc = d.totalCorrect + d.totalWrong > 0
    ? Math.round(d.totalCorrect / (d.totalCorrect + d.totalWrong) * 100) : 0;

  root.innerHTML = `
    <div class="view-head">
      <h1>Profil & Statistik</h1>
      <p>Dein Fortschritt liegt im Browser. Mit einem Konto wandert er zusätzlich auf den Server —
         dann hast du ihn auf jedem Gerät.</p>
    </div>

    <div class="panel" id="account-panel"></div>

    <div class="panel level-panel">
      <div class="lp-left">
        <div class="lp-lvl">${Store.level()}</div>
        <div>
          <h2>${Store.levelName()}</h2>
          <div class="lp-xp">${d.xp.toLocaleString('de-DE')} XP · ${Store.masteredCount(80)} von ${ND.corners.length} Kurven gemeistert</div>
          <div class="lp-bar"><div style="width:${Store.levelProgress().pct}%"></div></div>
        </div>
      </div>
      <div class="lp-right">
        <div><b>${d.totalCorrect}</b><span>richtig</span></div>
        <div><b>${d.totalWrong}</b><span>falsch</span></div>
        <div><b>${acc}%</b><span>Quote</span></div>
        <div><b>${d.bestStreak}</b><span>beste Serie</span></div>
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Abzeichen</h2>
      <div class="ach-grid">
        ${ND.achievements.map(a => {
          const got = d.achievements[a.id];
          return `<div class="ach-card${got ? ' got' : ''}">
            <div class="ach-icon">${a.icon}</div>
            <b>${escapeHtml(a.name)}</b>
            <p>${escapeHtml(a.desc)}</p>
            ${got ? `<i>${new Date(got).toLocaleDateString('de-DE')}</i>` : `<i>gesperrt</i>`}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Bestleistungen</h2>
      <div class="hs-grid" id="hs-grid"></div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Meisterschafts-Karte</h2>
      <p class="muted small">Grün umrandet = gemeistert (80 %+).</p>
      <div class="map-wrap small" id="mastery-map"></div>
    </div>

    <div class="panel">
      <h2 class="panel-h">Alle Kurven im Detail</h2>
      <div class="mastery-table" id="mastery-table"></div>
    </div>

    <div class="panel danger-panel">
      <h2 class="panel-h">Einstellungen</h2>
      <div class="lset-block" style="margin-bottom:20px">
        <label>Sound</label>
        <div class="seg" id="snd-seg">
          <button class="seg-btn" data-s="off">Aus</button>
          <button class="seg-btn" data-s="dezent">Dezent</button>
          <button class="seg-btn" data-s="voll">Voll</button>
        </div>
        <p class="acc-hint">„Dezent“ gibt nur Rückmeldung auf Antworten. „Voll“ ergänzt Klick- und Bediengeräusche.</p>
      </div>
      <button class="btn btn-bad" id="btn-reset">Fortschritt zurücksetzen</button>
    </div>`;

  const games = { quiz:'Kurven-Quiz', blind:'Blind Lap (Kurven)', brake:'Bremspunkt (Punkte)',
                  blitz:'Blitz 60 (Punkte)', mapclick:'Karten-Klick', flags:'Flaggen-Trainer', sort:'Sortier-Challenge' };
  $('#hs-grid', root).innerHTML = Object.entries(games).map(([k, n]) =>
    `<div class="hs-card"><b>${d.highscores[k] || 0}</b><span>${n}</span></div>`).join('');

  $('#mastery-map', root).innerHTML = TrackMap.render({ labels: false, showGP: true, interactive: false });

  $('#mastery-table', root).innerHTML = ND.corners.map(c => {
    const m = Store.masteryPct(c.id);
    const st = d.mastery[c.id] || { c:0, w:0 };
    return `<div class="mt-row">
      <span class="mt-dot" style="background:${ND.sectorById[c.sec].color}"></span>
      <span class="mt-name">${escapeHtml(c.name)}</span>
      <span class="mt-bar"><i style="width:${m}%"></i></span>
      <span class="mt-pct${m >= 80 ? ' good' : ''}">${m}%</span>
      <span class="mt-tries">${st.c}✓ ${st.w}✗</span>
    </div>`;
  }).join('');

  const sndSeg = $('#snd-seg', root);
  const paintSnd = () => $$('.seg-btn', sndSeg).forEach(b =>
    b.classList.toggle('is-on', b.dataset.s === Sfx.level()));
  paintSnd();
  $$('.seg-btn', sndSeg).forEach(b => b.addEventListener('click', () => {
    d.settings.sound = b.dataset.s; Store.save(); paintSnd();
    if (b.dataset.s !== 'off') Sfx.good();
  }));

  $('#btn-reset', root).addEventListener('click', () => {
    if (confirm('Wirklich den kompletten Fortschritt löschen? Das lässt sich nicht rückgängig machen.')) {
      Store.reset(); UI.updateHud(); App.go('cockpit');
      UI.toast('Zurückgesetzt', 'Frische Boxengasse. Viel Erfolg!');
    }
  });
};
