/* ============================================================
   KONTO — optionale Anmeldung und Fortschritts-Abgleich

   Ohne Anmeldung ändert sich nichts: alles bleibt im localStorage.
   Mit Anmeldung wird der Fortschritt zusätzlich auf dem Server
   gespeichert und beim Login mit dem lokalen Stand zusammengeführt.
   ============================================================ */

const Account = {
  user: null,
  available: location.protocol === 'http:' || location.protocol === 'https:',
  syncState: 'idle',        // idle | busy | ok | err
  _timer: null,
  _listeners: [],

  onChange(fn) { this._listeners.push(fn); },
  _emit() { this._listeners.forEach(fn => { try { fn(); } catch (e) {} }); },

  /* ---------- HTTP ---------- */
  async api(path, { method = 'GET', body } = {}) {
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: Object.assign(
        { 'X-GH-App': '1' },
        body ? { 'Content-Type': 'application/json' } : {}
      ),
      body: body ? JSON.stringify(body) : undefined
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw Object.assign(new Error(data.error || `Fehler ${res.status}`), { status: res.status });
    return data;
  },

  /* ---------- Sitzung ---------- */
  async init() {
    if (!this.available) return;
    try {
      const { user } = await this.api('/api/me');
      this.user = user;
      await this.pullAndMerge();
    } catch (e) {
      this.user = null;                       // nicht angemeldet oder Server aus
      if (e.status !== 401) this.available = false;
    }
    this._emit();
  },

  async register(name, password) {
    const { user } = await this.api('/api/register', { method: 'POST', body: { name, password } });
    this.user = user;
    await this.push();                        // frisches Konto bekommt den lokalen Stand
    this._emit();
    return user;
  },

  async login(name, password) {
    const { user } = await this.api('/api/login', { method: 'POST', body: { name, password } });
    this.user = user;
    await this.pullAndMerge();
    this._emit();
    return user;
  },

  async logout() {
    try { await this.api('/api/logout', { method: 'POST' }); } catch (e) {}
    this.user = null;
    this.syncState = 'idle';
    this._emit();
  },

  /* ---------- Abgleich ---------- */
  async pullAndMerge() {
    const { progress } = await this.api('/api/progress');
    if (progress) {
      const merged = this.merge(this.localProgress(), progress);
      Object.assign(Store.data, merged);
      Store.save();
      UI.updateHud();
    }
    await this.push();                        // zusammengeführten Stand zurückschreiben
  },

  localProgress() {
    const d = Store.data;
    return {
      xp: d.xp, bestStreak: d.bestStreak,
      totalCorrect: d.totalCorrect, totalWrong: d.totalWrong,
      mastery: d.mastery, seen: d.seen, box: d.box || {},
      achievements: d.achievements, highscores: d.highscores,
      eventName: d.eventName, eventDate: d.eventDate
    };
  },

  /* Zusammenführen ist bewusst monoton: zweimal mergen ergibt dasselbe
     wie einmal mergen. Nichts geht verloren, nichts wird doppelt gezählt. */
  merge(a, b) {
    const max = (x, y) => Math.max(x || 0, y || 0);
    const out = {
      xp: max(a.xp, b.xp),
      bestStreak: max(a.bestStreak, b.bestStreak),
      totalCorrect: max(a.totalCorrect, b.totalCorrect),
      totalWrong: max(a.totalWrong, b.totalWrong),
      mastery: {}, seen: {}, box: {}, achievements: {}, highscores: {},
      eventName: a.eventDate ? a.eventName : (b.eventName || a.eventName || ''),
      eventDate: a.eventDate || b.eventDate || null
    };

    // Pro Kurve gewinnt der Stand mit mehr Versuchen
    const ids = new Set([...Object.keys(a.mastery || {}), ...Object.keys(b.mastery || {})]);
    ids.forEach(id => {
      const x = (a.mastery || {})[id] || { c: 0, w: 0 };
      const y = (b.mastery || {})[id] || { c: 0, w: 0 };
      out.mastery[id] = (x.c + x.w) >= (y.c + y.w) ? x : y;
    });

    Object.keys(a.seen || {}).concat(Object.keys(b.seen || {}))
      .forEach(k => { out.seen[k] = true; });

    new Set([...Object.keys(a.box || {}), ...Object.keys(b.box || {})]).forEach(k => {
      out.box[k] = max((a.box || {})[k], (b.box || {})[k]);
    });

    // Abzeichen: das frühere Datum gilt
    new Set([...Object.keys(a.achievements || {}), ...Object.keys(b.achievements || {})]).forEach(k => {
      const x = (a.achievements || {})[k], y = (b.achievements || {})[k];
      out.achievements[k] = x && y ? Math.min(x, y) : (x || y);
    });

    new Set([...Object.keys(a.highscores || {}), ...Object.keys(b.highscores || {})]).forEach(k => {
      out.highscores[k] = max((a.highscores || {})[k], (b.highscores || {})[k]);
    });

    return out;
  },

  async push() {
    if (!this.user) return;
    this.setSync('busy');
    try {
      await this.api('/api/progress', { method: 'PUT', body: { progress: this.localProgress() } });
      this.setSync('ok');
    } catch (e) {
      this.setSync('err');
      if (e.status === 401) { this.user = null; this._emit(); }
    }
  },

  setSync(s) { this.syncState = s; this._emit(); },

  /* Nach lokalen Änderungen gebündelt hochladen statt bei jedem Klick */
  scheduleSync() {
    if (!this.user) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push(), 2500);
  },

  async setBoardVisibility(on) {
    const r = await this.api('/api/board-visibility', { method: 'POST', body: { onBoard: on } });
    if (this.user) this.user.onBoard = r.onBoard;
    this._emit();
  },

  async leaderboard() {
    const { board } = await this.api('/api/leaderboard');
    return board;
  }
};

/* Store.save() anzapfen, ohne die Kernlogik umzubauen */
(function hookStore() {
  const original = Store.save.bind(Store);
  Store.save = function () {
    original();
    Account.scheduleSync();
  };
})();

/* Beim Verlassen der Seite noch offene Änderungen wegschreiben.
   keepalive statt sendBeacon, weil sendBeacon keine eigenen Header
   setzen kann — und ohne den X-GH-App-Header lehnt der Server ab.
   Einen Endpunkt ohne diesen Schutz anzubieten wäre ein CSRF-Loch. */
window.addEventListener('pagehide', () => {
  if (!Account.user || Account.syncState === 'ok') return;
  clearTimeout(Account._timer);
  try {
    fetch('/api/progress', {
      method: 'PUT',
      keepalive: true,
      credentials: 'same-origin',
      headers: { 'X-GH-App': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: Account.localProgress() })
    }).catch(() => {});
  } catch (e) {}
});
