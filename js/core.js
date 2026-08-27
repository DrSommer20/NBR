/* ============================================================
   CORE — Speicher, Sound, Helfer, Streckenkarte
   ============================================================ */

/* ---------------- Helfer ---------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function fmtTime(ms) {
  const t = Math.max(0, ms);
  const m = Math.floor(t / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const cs = Math.floor((t % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')},${String(cs).padStart(2, '0')}`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function dirLabel(d) {
  return { L:'Links', R:'Rechts', S:'S-Kombination', G:'Gerade / Passage' }[d] || d;
}
function dirIcon(d) {
  return { L:'↰', R:'↱', S:'⇄', G:'↑' }[d] || '•';
}
/* Kilometerangabe — GP-Kurven haben keine Nordschleifen-Kilometrierung */
function kmLabel(c) {
  return c.km == null ? 'GP-Strecke' : 'km ' + c.km.toFixed(2);
}

/* ---------------- Fortschritt / Store ---------------- */
const Store = {
  KEY: 'gruene-hoelle-academy-v1',
  data: null,

  defaults() {
    return {
      xp: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      mastery: {},          // cornerId -> { c: richtig, w: falsch }
      seen: {},             // cornerId -> true (Lexikon geöffnet)
      box: {},              // cornerId -> Leitner-Fach 0..5
      achievements: {},     // id -> timestamp
      highscores: {},       // gameId -> best
      settings: { sound: 'dezent', showGP: true, labels: true },
      eventDate: null,
      eventName: '',
      sessionPerfectBrakes: 0
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.data = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
      this.data.settings = Object.assign(this.defaults().settings, this.data.settings || {});
    } catch (e) {
      this.data = this.defaults();
    }
    this.data.sessionPerfectBrakes = 0;
    return this.data;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
  },

  reset() {
    this.data = this.defaults();
    this.save();
  },

  addXP(n) {
    this.data.xp += n;
    this.save();
    Achievements.check();
    UI.updateHud();
  },

  level() {
    return Math.floor(Math.sqrt(this.data.xp / 40)) + 1;
  },
  levelProgress() {
    const lv = this.level();
    const cur = (lv - 1) * (lv - 1) * 40;
    const next = lv * lv * 40;
    return { cur, next, pct: clamp((this.data.xp - cur) / (next - cur) * 100, 0, 100) };
  },
  levelName() {
    const names = ['Touristenfahrer','Ring-Neuling','Streckenkenner','Sektor-Spezialist',
                   'Bremspunkt-Jäger','Grüne-Hölle-Kenner','NLS-Stammgast','Karussell-Meister',
                   'Nordschleifen-Veteran','Ring-Legende'];
    return names[clamp(this.level() - 1, 0, names.length - 1)];
  },

  scoreCorner(id, correct) {
    if (!id) return;
    const m = this.data.mastery[id] || { c: 0, w: 0 };
    if (correct) { m.c++; this.data.totalCorrect++; }
    else { m.w++; this.data.totalWrong++; }
    this.data.mastery[id] = m;
    this.save();
  },

  masteryPct(id) {
    const m = this.data.mastery[id];
    if (!m) return 0;
    const total = m.c + m.w;
    if (total === 0) return 0;
    // Genauigkeit gewichtet mit Erfahrung (mind. 5 Versuche für volle Wertung)
    const acc = m.c / total;
    const conf = Math.min(1, total / 5);
    return Math.round(acc * conf * 100);
  },

  masteredCount(threshold = 80) {
    return ND.corners.filter(c => this.masteryPct(c.id) >= threshold).length;
  },

  setHighscore(game, val) {
    const cur = this.data.highscores[game] || 0;
    if (val > cur) { this.data.highscores[game] = val; this.save(); return true; }
    return false;
  }
};

/* ---------------- Achievements ---------------- */
const Achievements = {
  unlock(id) {
    if (Store.data.achievements[id]) return;
    Store.data.achievements[id] = Date.now();
    Store.save();
    const a = ND.achievements.find(x => x.id === id);
    if (a) UI.toast(`${a.icon} Achievement: ${a.name}`, a.desc, 'gold');
  },

  check(ctx = {}) {
    const d = Store.data;
    if (d.totalCorrect >= 1) this.unlock('first_lap');
    if (d.xp >= 500)   this.unlock('xp_500');
    if (d.xp >= 2000)  this.unlock('xp_2000');
    if (d.xp >= 5000)  this.unlock('xp_5000');
    if (d.bestStreak >= 10) this.unlock('streak_10');
    if (d.bestStreak >= 25) this.unlock('streak_25');
    if (Object.keys(d.seen).length >= 30) this.unlock('lexikon');

    const mastered = Store.masteredCount(80);
    if (mastered >= 10) this.unlock('mastery_10');
    if (mastered >= 25) this.unlock('mastery_25');
    if (mastered >= ND.corners.length) this.unlock('mastery_all');

    if (d.sessionPerfectBrakes >= 10) this.unlock('perfect_brake');

    const h = new Date().getHours();
    if (h >= 0 && h < 5) this.unlock('nightowl');

    if (ctx.fullLap) this.unlock('full_lap');
    if (ctx.flagPerfect) this.unlock('flag_master');
    if (ctx.mapHits >= 15) this.unlock('map_sniper');
    if (ctx.blitzScore >= 25) this.unlock('speedrun');
  }
};

/* ---------------- Sound ----------------
   Drei Stufen: 'off', 'dezent' (Standard) und 'voll'.
   'dezent' spielt nur Rückmeldung auf Antworten — keine Klickgeräusche,
   kein Motorsound, keine Fanfaren. Weiche Sinustöne statt Rechteck,
   deutlich leiser und kürzer als vorher.
------------------------------------------------------------------ */
const Sfx = {
  ctx: null,

  level() {
    const s = Store.data.settings.sound;
    if (s === true) return 'dezent';        // Migration alter Einstellung
    if (s === false) return 'off';
    return s || 'dezent';
  },

  ensure() {
    if (this.level() === 'off') return null;
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  /* Ein weicher Ton mit sanfter Hüllkurve — kein Klicken am Anfang */
  tone(freq, { dur = 0.1, type = 'sine', gain = 0.025, delay = 0 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  /* Rückmeldung auf Antworten — ab Stufe "dezent" */
  good()    { this.tone(784, { dur: 0.13 }); },
  bad()     { this.tone(196, { dur: 0.16, type: 'triangle', gain: 0.022 }); },
  perfect() { this.tone(784, { dur: 0.12 }); this.tone(1175, { dur: 0.16, delay: 0.1, gain: 0.02 }); },

  /* Reine Bedienungsgeräusche — nur auf Stufe "voll" */
  ui()   { if (this.level() === 'voll') this.tone(560, { dur: 0.035, gain: 0.014 }); },
  click(){ this.ui(); },
  rev()  { if (this.level() === 'voll') this.tone(140, { dur: 0.18, type: 'triangle', gain: 0.02 }); },
  tick() { if (this.level() === 'voll') this.tone(1100, { dur: 0.025, gain: 0.01 }); }
};

/* ============================================================
   STRECKENKARTE
   Zeichnet die echte Streckengeometrie aus js/geo.js
   (OpenStreetMap-Daten, siehe Attribution dort).
   ============================================================ */
const TrackMap = {
  _center: null,

  /* Mittelpunkt der Kurvenwolke — bestimmt, auf welche Seite ein Label gehört */
  center() {
    if (!this._center) {
      const cs = ND.nordschleife;
      this._center = {
        x: cs.reduce((s, c) => s + c.x, 0) / cs.length,
        y: cs.reduce((s, c) => s + c.y, 0) / cs.length
      };
    }
    return this._center;
  },

  /* Erzeugt das komplette SVG.
     opts: { interactive, labels, highlight:[ids], showGP } */
  render(opts = {}) {
    const o = Object.assign({ interactive: true, labels: true, highlight: [], showGP: true }, opts);
    const g = ND.geo;
    const vb = o.labels ? g.viewBox.full : g.viewBox.tight;
    const ctr = this.center();

    const dots = ND.corners.map(c => {
      const sec = ND.sectorById[c.sec];
      const hl = o.highlight.includes(c.id);
      const gpDim = (c.sec === 'gp' && !o.showGP);
      const mast = Store.masteryPct(c.id);
      const cls = ['corner-dot', hl ? 'is-hl' : '', gpDim ? 'is-dim' : '',
                   mast >= 80 ? 'is-mastered' : ''].filter(Boolean).join(' ');
      const r = hl ? 11 : 6;
      return `<g class="${cls}" data-id="${c.id}" tabindex="${o.interactive ? 0 : -1}">
        ${hl ? `<circle class="pulse" cx="${c.x}" cy="${c.y}" r="16" fill="${sec.color}"/>` : ''}
        <circle class="hit" cx="${c.x}" cy="${c.y}" r="18" fill="transparent"/>
        <circle class="dot" cx="${c.x}" cy="${c.y}" r="${r}" fill="${sec.color}"/>
        ${mast >= 80 ? `<circle class="ring" cx="${c.x}" cy="${c.y}" r="${r + 4}" fill="none" stroke="#4ade80" stroke-width="2"/>` : ''}
      </g>`;
    }).join('');

    const labels = o.labels ? this.buildLabels(o.showGP, ctr) : '';

    const secLines = Object.entries(g.sectors).map(([id, d]) =>
      `<path class="sector-line" data-sec="${id}" d="${d}" stroke="${ND.sectorById[id].color}" fill="none"/>`
    ).join('') +
      `<path class="sector-line" data-sec="gp" d="${g.gp}" stroke="${ND.sectorById.gp.color}" fill="none"/>`;

    const gpCls = o.showGP ? '' : ' is-faded';

    return `
    <svg class="track-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <g class="track-layer">
        <path class="track-glow" d="${g.ns}"/>
        <path class="track-base" d="${g.ns}"/>
        <path class="track-inner" d="${g.ns}" id="track-line"/>

        <g class="gp-layer${gpCls}">
          <path class="track-base" d="${g.gp}"/>
          <path class="track-inner" d="${g.gp}"/>
          <path class="track-base variante" d="${g.variante}"/>
          <path class="track-inner variante" d="${g.variante}"/>
          <path class="track-base link" d="${g.link}"/>
          <path class="track-inner link" d="${g.link}"/>
        </g>
      </g>

      <g class="sector-overlay">${secLines}</g>
      <g class="car-layer"></g>
      <g class="dots">${dots}</g>
      <g class="labels">${labels}</g>
    </svg>`;
  },

  /* Beschriftungen aufbauen.
     An der Start/Ziel-Passage und rund um Breidscheid liegen die Kurven real
     so dicht beieinander, dass sich die Namen überlagern würden. Die
     Hauptbeschriftungen werden deshalb vertikal auseinandergeschoben —
     begrenzt, damit ein Name nie weit von seinem Punkt wegwandert. */
  buildLabels(showGP, ctr) {
    const MIN_GAP = 21, MAX_SHIFT = 26;

    const items = ND.corners
      .filter(c => c.sec !== 'gp' || showGP)
      .map(c => ({
        c,
        key: ND.keyLabels.has(c.id),
        right: c.x >= ctr.x,
        y: c.y + (c.y < ctr.y ? -3 : 5)
      }));

    // Nur die dauerhaft sichtbaren Namen entzerren, je Seite getrennt
    ['left', 'right'].forEach(side => {
      const col = items
        .filter(i => i.key && (i.right ? 'right' : 'left') === side)
        .sort((a, b) => a.y - b.y);
      for (let i = 1; i < col.length; i++) {
        const gap = col[i].y - col[i - 1].y;
        if (gap < MIN_GAP) {
          const want = col[i - 1].y + MIN_GAP;
          col[i].y = Math.min(want, col[i].c.y + MAX_SHIFT);
        }
      }
    });

    return items.map(i => {
      const dx = i.right ? 13 : -13;
      const anchor = i.right ? 'start' : 'end';
      const shifted = Math.abs(i.y - i.c.y) > 11;
      return `${shifted ? `<line class="label-leader" x1="${(i.c.x + dx * 0.45).toFixed(1)}" y1="${i.c.y.toFixed(1)}"
                 x2="${(i.c.x + dx).toFixed(1)}" y2="${(i.y - 3).toFixed(1)}"/>` : ''}
        <text class="corner-label${i.key ? '' : ' minor'}" x="${(i.c.x + dx).toFixed(1)}" y="${i.y.toFixed(1)}"
              text-anchor="${anchor}" data-id="${i.c.id}" data-sec="${i.c.sec}">${escapeHtml(i.c.name)}</text>`;
    }).join('');
  },

  /* Klick-Handler anhängen */
  bind(container, onPick) {
    $$('.corner-dot, .corner-label', container).forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        Sfx.click();
        onPick(el.dataset.id);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(el.dataset.id); }
      });
    });
  },

  /* Animiertes Auto auf der echten Streckenlinie.
     Die Kurvenpositionen kommen aus der gemessenen Kilometrierung (frac). */
  animate(container, lapSeconds, onCorner, onEnd) {
    const svg = $('.track-svg', container);
    const line = $('#track-line', svg);
    const layer = $('.car-layer', svg);
    if (!line || !layer) return null;

    layer.innerHTML = `
      <circle class="car-glow" r="14" fill="#ff2d2d" opacity="0.35"/>
      <circle class="car-dot" r="7" fill="#fff" stroke="#ff2d2d" stroke-width="3"/>`;
    const glow = $('.car-glow', layer), dot = $('.car-dot', layer);

    const total = line.getTotalLength();
    const marks = ND.nordschleife
      .filter(c => c.frac != null)
      .map(c => ({ id: c.id, at: c.frac, done: false }))
      .sort((a, b) => a.at - b.at);

    let start = null, raf = null, stopped = false;
    const step = ts => {
      if (stopped) return;
      if (!start) start = ts;
      const t = (ts - start) / (lapSeconds * 1000);
      if (t >= 1) { if (onEnd) onEnd(); return; }
      const p = line.getPointAtLength(t * total);
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      glow.setAttribute('cx', p.x); glow.setAttribute('cy', p.y);
      marks.forEach(m => {
        if (!m.done && t >= m.at) { m.done = true; if (onCorner) onCorner(m.id); }
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return { stop() { stopped = true; if (raf) cancelAnimationFrame(raf); layer.innerHTML = ''; } };
  },

  /* Höhenprofil — Kilometrierung real, Höhenangaben gerundet geschätzt */
  elevation(highlightId) {
    const cs = ND.nordschleife.filter(c => c.km != null).sort((a, b) => a.km - b.km);
    const W = 1000, H = 230, pad = 26;
    const maxKm = ND.geo.lengthKm;
    const alts = cs.map(c => c.alt);
    const lo = Math.min(...alts) - 25, hi = Math.max(...alts) + 30;
    const X = km => pad + (km / maxKm) * (W - pad * 2);
    const Y = m => H - pad - ((m - lo) / (hi - lo)) * (H - pad * 2);

    let d = `M ${X(0)} ${H - pad}`;
    cs.forEach(c => { d += ` L ${X(c.km).toFixed(1)} ${Y(c.alt).toFixed(1)}`; });
    d += ` L ${X(maxKm)} ${H - pad} Z`;

    let line = '';
    cs.forEach((c, i) => { line += `${i ? 'L' : 'M'} ${X(c.km).toFixed(1)} ${Y(c.alt).toFixed(1)} `; });

    const dots = cs.map(c => {
      const hl = c.id === highlightId;
      return `<circle class="elev-dot${hl ? ' is-hl' : ''}" data-id="${c.id}"
               cx="${X(c.km).toFixed(1)}" cy="${Y(c.alt).toFixed(1)}" r="${hl ? 7 : 4}"
               fill="${ND.sectorById[c.sec].color}"><title>${escapeHtml(c.name)} — ca. ${c.alt} m, km ${c.km}</title></circle>`;
    }).join('');

    const peaks = [
      { c: ND.byId.hohe_acht, txt: 'Hohe Acht 617 m', dy: -14 },
      { c: ND.byId.breidscheid, txt: 'Breidscheid 320 m', dy: 20 }
    ].map(p => `<text class="elev-peak" x="${X(p.c.km)}" y="${Y(p.c.alt) + p.dy}" text-anchor="middle">${p.txt}</text>`).join('');

    return `<svg class="elev-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <path class="elev-fill" d="${d}"/>
      <path class="elev-line" d="${line}"/>
      ${dots}${peaks}
    </svg>`;
  }
};

/* ---------------- UI-Hilfen (Toast, HUD) ---------------- */
const UI = {
  toast(title, msg, kind = '') {
    const wrap = $('#toasts');
    const t = el('div', `toast ${kind}`,
      `<div class="toast-title">${escapeHtml(title)}</div>
       ${msg ? `<div class="toast-msg">${escapeHtml(msg)}</div>` : ''}`);
    wrap.appendChild(t);
    if (kind === 'gold') Sfx.perfect();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3600);
  },

  updateHud() {
    const lp = Store.levelProgress();
    if (!$('#hud')) return;
    $('#hud-level').textContent = Store.level();
    const m = $('#hud-level-m');
    if (m) m.textContent = Store.level();
    $('#hud-title').textContent = Store.levelName();
    $('#hud-xp').textContent = Store.data.xp.toLocaleString('de-DE') + ' XP';
    $('#hud-bar').style.width = lp.pct + '%';
  },

  countUp(node, to, dur = 700) {
    const from = parseInt(node.textContent.replace(/\D/g, '')) || 0;
    const t0 = performance.now();
    const step = ts => {
      const p = clamp((ts - t0) / dur, 0, 1);
      node.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))).toLocaleString('de-DE');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
};
