/* ============================================================
   GRÜNE HÖLLE ACADEMY — Backend

   Optionale Konten mit Fortschritts-Synchronisation.
   Bewusst ohne externe Abhängigkeiten: nur Node-Bordmittel.
   Kein npm install, keine Fremdpakete, kein Build.

   Start:
     node server/server.js
   Umgebungsvariablen:
     PORT        Port (Standard 8787)
     HOST        Bind-Adresse (Standard 127.0.0.1)
     DATA_FILE   Pfad zur Datendatei (Standard server/data/users.json)
     STATIC_DIR  Verzeichnis der Web-App (Standard Projektwurzel).
                 Leer setzen, wenn nginx die Dateien ausliefert.
     COOKIE_INSECURE=1  Secure-Flag am Cookie weglassen (nur für
                 lokales Testen über http://localhost)
   ============================================================ */

'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = path.join(__dirname, '..');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'users.json');
const STATIC_DIR = process.env.STATIC_DIR === '' ? null
  : path.resolve(process.env.STATIC_DIR || ROOT);
const COOKIE_SECURE = process.env.COOKIE_INSECURE !== '1';

const SESSION_DAYS = 30;
const MAX_BODY = 256 * 1024;          // Fortschrittsdaten sind klein
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/* ============================================================
   Datenhaltung — eine JSON-Datei, atomar geschrieben.
   Für die Größenordnung dieser App (Freundeskreis, nicht
   Massenbetrieb) völlig ausreichend und ohne Fremdabhängigkeit.
   ============================================================ */
const db = { users: {}, sessions: {} };
let writeTimer = null;
let writing = false;
let writeAgain = false;

function loadDb() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    db.users = parsed.users || {};
    db.sessions = parsed.sessions || {};
    pruneSessions();
    console.log(`[db] ${Object.keys(db.users).length} Konten geladen`);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('[db] Datei unlesbar:', e.message);
    else console.log('[db] Neue Datenbank wird angelegt');
  }
}

function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(flush, 400);
}

async function flush() {
  writeTimer = null;
  if (writing) { writeAgain = true; return; }
  writing = true;
  try {
    await fsp.mkdir(path.dirname(DATA_FILE), { recursive: true });
    const tmp = DATA_FILE + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(db), 'utf8');
    await fsp.rename(tmp, DATA_FILE);   // atomar
  } catch (e) {
    console.error('[db] Schreiben fehlgeschlagen:', e.message);
  } finally {
    writing = false;
    if (writeAgain) { writeAgain = false; scheduleWrite(); }
  }
}

function pruneSessions() {
  const now = Date.now();
  let n = 0;
  for (const [tok, s] of Object.entries(db.sessions)) {
    if (s.exp < now || !db.users[s.user]) { delete db.sessions[tok]; n++; }
  }
  if (n) scheduleWrite();
}
setInterval(pruneSessions, 60 * 60 * 1000).unref();

/* ============================================================
   Passwörter
   ============================================================ */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

function verifyPassword(pw, stored) {
  try {
    const [alg, N, r, p, saltB64, keyB64] = String(stored).split('$');
    if (alg !== 'scrypt') return false;
    const salt = Buffer.from(saltB64, 'base64');
    const expected = Buffer.from(keyB64, 'base64');
    const actual = crypto.scryptSync(pw, salt, expected.length,
      { N: Number(N), r: Number(r), p: Number(p) });
    return crypto.timingSafeEqual(expected, actual);
  } catch (e) {
    return false;
  }
}

/* ============================================================
   Rate-Limit für die Anmelde-Endpunkte
   ============================================================ */
const attempts = new Map();
function rateLimited(ip, max = 12, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter(t => now - t < windowMs);
  list.push(now);
  attempts.set(ip, list);
  if (attempts.size > 5000) attempts.clear();     // simpler Überlaufschutz
  return list.length > max;
}

/* ============================================================
   Hilfsfunktionen für Anfragen/Antworten
   ============================================================ */
function send(res, status, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }, extraHeaders));
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('zu groß')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('kein gültiges JSON')); }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function sessionCookie(token, maxAgeSec) {
  const bits = [
    `gh_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSec}`
  ];
  if (COOKIE_SECURE) bits.push('Secure');
  return bits.join('; ');
}

function currentUser(req) {
  const tok = parseCookies(req).gh_session;
  if (!tok) return null;
  const s = db.sessions[tok];
  if (!s || s.exp < Date.now()) return null;
  const u = db.users[s.user];
  return u ? { name: s.user, rec: u, token: tok } : null;
}

function clientIp(req) {
  // Hinter nginx steht die echte Adresse in X-Forwarded-For
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket.remoteAddress || 'unbekannt';
}

/* ============================================================
   Validierung
   ============================================================ */
const NAME_RE = /^[A-Za-z0-9ÄÖÜäöüß._\- ]{3,24}$/;

function validName(n) {
  return typeof n === 'string' && NAME_RE.test(n.trim()) && n.trim().length >= 3;
}
function normName(n) { return n.trim(); }
function nameKey(n) { return n.trim().toLowerCase(); }

/* Fortschrittsobjekt auf erwartete Struktur und Größe begrenzen */
function sanitizeProgress(p) {
  if (!p || typeof p !== 'object') return null;
  const num = (v, max) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), max) : 0;
  };
  const mapOf = (src, fn, limit = 400) => {
    const out = {};
    if (src && typeof src === 'object') {
      for (const k of Object.keys(src).slice(0, limit)) {
        if (typeof k !== 'string' || k.length > 40) continue;
        const v = fn(src[k]);
        if (v !== undefined) out[k] = v;
      }
    }
    return out;
  };

  return {
    xp: num(p.xp, 1e9),
    bestStreak: num(p.bestStreak, 1e6),
    totalCorrect: num(p.totalCorrect, 1e8),
    totalWrong: num(p.totalWrong, 1e8),
    mastery: mapOf(p.mastery, v =>
      v && typeof v === 'object' ? { c: num(v.c, 1e6), w: num(v.w, 1e6) } : undefined),
    seen: mapOf(p.seen, v => (v ? 1 : undefined)),
    box: mapOf(p.box, v => num(v, 5)),
    achievements: mapOf(p.achievements, v => num(v, 4e12)),
    highscores: mapOf(p.highscores, v => num(v, 1e9), 60),
    eventName: typeof p.eventName === 'string' ? p.eventName.slice(0, 60) : '',
    eventDate: typeof p.eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.eventDate)
      ? p.eventDate : null,
    updated: Date.now()
  };
}

function levelOf(xp) { return Math.floor(Math.sqrt((xp || 0) / 40)) + 1; }

function masteredCount(mastery) {
  let n = 0;
  for (const m of Object.values(mastery || {})) {
    const total = (m.c || 0) + (m.w || 0);
    if (!total) continue;
    const pct = Math.round((m.c / total) * Math.min(1, total / 5) * 100);
    if (pct >= 80) n++;
  }
  return n;
}

/* ============================================================
   Routen
   ============================================================ */
const routes = {

  'POST /api/register': async (req, res) => {
    const ip = clientIp(req);
    if (rateLimited(ip)) return send(res, 429, { error: 'Zu viele Versuche. Bitte später erneut.' });

    const body = await readBody(req);
    const name = body.name;
    const pw = body.password;

    if (!validName(name)) {
      return send(res, 400, { error: 'Name: 3–24 Zeichen, Buchstaben, Ziffern, Leerzeichen, . _ -' });
    }
    if (typeof pw !== 'string' || pw.length < 8 || pw.length > 200) {
      return send(res, 400, { error: 'Passwort muss mindestens 8 Zeichen haben.' });
    }
    const key = nameKey(name);
    if (db.users[key]) return send(res, 409, { error: 'Der Name ist schon vergeben.' });

    db.users[key] = {
      display: normName(name),
      pw: hashPassword(pw),
      created: Date.now(),
      onBoard: true,
      progress: null
    };

    const { token, maxAge } = newSession(key);
    scheduleWrite();
    console.log(`[auth] Neues Konto: ${normName(name)}`);
    send(res, 200, { user: publicUser(key) }, { 'Set-Cookie': sessionCookie(token, maxAge) });
  },

  'POST /api/login': async (req, res) => {
    const ip = clientIp(req);
    if (rateLimited(ip)) return send(res, 429, { error: 'Zu viele Versuche. Bitte später erneut.' });

    const body = await readBody(req);
    const key = typeof body.name === 'string' ? nameKey(body.name) : '';
    const u = db.users[key];

    // Immer gleich lange antworten und nie verraten, ob der Name existiert
    const ok = u ? verifyPassword(String(body.password || ''), u.pw)
                 : verifyPassword('dummy', hashPassword('dummy-vergleich'));
    if (!u || !ok) return send(res, 401, { error: 'Name oder Passwort stimmt nicht.' });

    const { token, maxAge } = newSession(key);
    scheduleWrite();
    send(res, 200, { user: publicUser(key) }, { 'Set-Cookie': sessionCookie(token, maxAge) });
  },

  'POST /api/logout': async (req, res) => {
    const cur = currentUser(req);
    if (cur) { delete db.sessions[cur.token]; scheduleWrite(); }
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  },

  'GET /api/me': async (req, res) => {
    const cur = currentUser(req);
    if (!cur) return send(res, 401, { error: 'Nicht angemeldet' });
    send(res, 200, { user: publicUser(cur.name) });
  },

  'GET /api/progress': async (req, res) => {
    const cur = currentUser(req);
    if (!cur) return send(res, 401, { error: 'Nicht angemeldet' });
    send(res, 200, { progress: cur.rec.progress });
  },

  'PUT /api/progress': async (req, res) => {
    const cur = currentUser(req);
    if (!cur) return send(res, 401, { error: 'Nicht angemeldet' });
    const clean = sanitizeProgress((await readBody(req)).progress);
    if (!clean) return send(res, 400, { error: 'Ungültige Daten' });
    cur.rec.progress = clean;
    scheduleWrite();
    send(res, 200, { ok: true, updated: clean.updated });
  },

  'POST /api/board-visibility': async (req, res) => {
    const cur = currentUser(req);
    if (!cur) return send(res, 401, { error: 'Nicht angemeldet' });
    cur.rec.onBoard = !!(await readBody(req)).onBoard;
    scheduleWrite();
    send(res, 200, { onBoard: cur.rec.onBoard });
  },

  'GET /api/leaderboard': async (req, res) => {
    const cur = currentUser(req);
    const rows = Object.entries(db.users)
      .filter(([, u]) => u.onBoard && u.progress && u.progress.xp > 0)
      .map(([key, u]) => ({
        name: u.display,
        me: !!(cur && cur.name === key),
        xp: u.progress.xp,
        level: levelOf(u.progress.xp),
        mastered: masteredCount(u.progress.mastery)
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 50);
    send(res, 200, { board: rows });
  }
};

function newSession(userKey) {
  const token = crypto.randomBytes(32).toString('base64url');
  const maxAge = SESSION_DAYS * 24 * 3600;
  db.sessions[token] = { user: userKey, exp: Date.now() + maxAge * 1000 };
  return { token, maxAge };
}

function publicUser(key) {
  const u = db.users[key];
  return { name: u.display, created: u.created, onBoard: !!u.onBoard };
}

/* ============================================================
   Statische Auslieferung (nur für den lokalen Betrieb ohne nginx)
   ============================================================ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8'
};

function serveStatic(req, res, urlPath) {
  if (!STATIC_DIR) return send(res, 404, { error: 'Nicht gefunden' });

  let rel = decodeURIComponent(urlPath);
  if (rel === '/' || rel === '') rel = '/index.html';

  const file = path.resolve(STATIC_DIR, '.' + rel);
  // Pfad muss innerhalb des Wurzelverzeichnisses bleiben
  if (file !== STATIC_DIR && !file.startsWith(STATIC_DIR + path.sep)) {
    return send(res, 403, { error: 'Verboten' });
  }
  // Serverinterna nie ausliefern
  if (file.startsWith(path.join(STATIC_DIR, 'server') + path.sep)) {
    return send(res, 403, { error: 'Verboten' });
  }

  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, { error: 'Nicht gefunden' });
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': rel === '/index.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ============================================================
   Server
   ============================================================ */
const server = http.createServer(async (req, res) => {
  let urlPath;
  try {
    urlPath = new URL(req.url, 'http://localhost').pathname;
  } catch (e) {
    return send(res, 400, { error: 'Ungültige Anfrage' });
  }

  if (!urlPath.startsWith('/api/')) return serveStatic(req, res, urlPath);

  /* CSRF-Schutz: Zustandsändernde Aufrufe brauchen einen eigenen Header.
     Den kann eine fremde Seite ohne CORS-Freigabe nicht setzen — zusammen
     mit SameSite=Strict am Cookie reicht das für diese App. */
  if (req.method !== 'GET' && req.headers['x-gh-app'] !== '1') {
    return send(res, 403, { error: 'Ungültige Anfrage' });
  }

  const key = `${req.method} ${urlPath}`;
  const handler = routes[key];
  if (!handler) return send(res, 404, { error: 'Unbekannter Endpunkt' });

  try {
    await handler(req, res);
  } catch (e) {
    if (!res.headersSent) send(res, 400, { error: 'Anfrage konnte nicht verarbeitet werden' });
    console.error('[api]', key, e.message);
  }
});

loadDb();
server.listen(PORT, HOST, () => {
  console.log(`Grüne Hölle Academy — Backend auf http://${HOST}:${PORT}`);
  console.log(`  Daten:   ${DATA_FILE}`);
  console.log(`  Statisch:${STATIC_DIR || ' (aus — nginx liefert aus)'}`);
  if (!COOKIE_SECURE) console.log('  Hinweis: Cookie ohne Secure-Flag (nur zum lokalen Testen!)');
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    console.log('\nBeende, schreibe Daten …');
    await flush();
    process.exit(0);
  });
}
