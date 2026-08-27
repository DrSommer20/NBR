/* ============================================================
   Baut aus OpenStreetMap-Rohdaten die echte Streckengeometrie
   für die App und schreibt js/geo.js.

   Rohdaten holen (einmalig, ~150 KB):
     node scripts/fetch-osm.js
   Danach:
     node scripts/generate-geo.js data/ring.json js/geo.js

   Datenquelle: OpenStreetMap, © OpenStreetMap-Mitwirkende, ODbL.
   Die Nordschleife ist dort in benannte Kurvenabschnitte zerlegt —
   daraus stammen Streckenverlauf, Kurvenpositionen und Kilometrierung.
   ============================================================ */
const fs = require('fs');

const SRC = process.argv[2] || 'data/ring.json';
const OUT = process.argv[3] || 'js/geo.js';
const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const byId = new Map(j.elements.filter(e => e.geometry).map(w => [w.id, w]));

/* ---- Reihenfolge der Nordschleife (aus den Endpunkten verkettet) ---- */
const NS_CHAIN = [
  41395670,    // T13 / Start-Ziel Nordschleife
  41395673,
  1009142894,  // Sabine-Schmitz-Kurve
  1009142895,  // Hatzenbogen
  799394496,   // Hatzenbach
  799394497,   // Hocheichen
  41395681,
  41395684,    // Quiddelbacher Höhe
  799394498,   // Flugplatz
  799394499,   // Schwedenkreuz
  799394500,   // Aremberg
  799394501,   // Fuchsröhre
  799394502,   // Adenauer Forst
  799394503,   // Metzgesfeld
  799394504,   // Kallenhard
  799394505,   // Spiegelkurve
  799394506,   // Dreifach-Rechts (Miss-Hit-Miss)
  799394507,   // Wehrseifen
  683061813,   // Breidscheid
  683061814,   // Breidscheid
  41395647,
  683006908,   // Breidscheid
  245166664,   // Exmühle
  799394508,   // Lauda-Links
  799394509,   // Bergwerk
  683061804,   // Senkenlinks
  799394510,   // Kesselchen
  799394511,   // Mutkurve
  799394512,   // Klostertal
  799394513,   // Steilstrecke
  414785755,   // Karussell
  414785756,   // Hohe Acht
  799394515,   // Hedwigshöhe
  799394514,   // Wippermann
  799394516,   // Eschbach
  799394517,   // Brünnchen
  799394518,   // Eiskurve
  799394519,   // Pflanzgarten
  799394520,   // Sprunghügel
  799394521,   // Stefan-Bellof-S
  799394522,   // Schwalbenschwanz
  799394523,   // Mini-Karussell
  799394524,   // Galgenkopf
  41395652,
  683303211,   // Döttinger Höhe
  683303210, 683303209, 683303208,
  41792406,    // Antoniusbuche
  799394494,   // Tiergarten
  799394495,   // Hohenrain
  41395668
];

/* ---- GP-Strecke (Sprintstrecken-Layout, wie bei NLS/24h) ---- */
const GP_CHAIN = [
  1149161210,  // Start/Ziel-Gerade (Boxengasse liegt parallel)
  1149161208,
  1443047846, 1443047847,
  1149161209,  // Mercedes-Arena
  1443047845, 1443047844,
  27852990,    // Rückweg mit den Sponsorenkurven
  820679450    // NGK-Schikane
];

const GP_VARIANTE = [31010602];      // 24h-/NLS-Abkürzung an der Mercedes-Arena
const GP_LINK     = [26543901];      // Anbindung zur Nordschleife

/* ---- Kette zu einer Punktliste verbinden, Richtung prüfen ---- */
function chain(ids, label) {
  const pts = [];
  let prev = null;
  for (const id of ids) {
    const w = byId.get(id);
    if (!w) throw new Error(`${label}: Weg ${id} fehlt`);
    let g = w.geometry.map(p => ({ lat: p.lat, lon: p.lon }));
    if (prev) {
      const dStart = dist(prev, g[0]);
      const dEnd = dist(prev, g[g.length - 1]);
      if (dEnd < dStart) g = g.reverse();          // Weg ist andersherum erfasst
      const gap = dist(prev, g[0]);
      if (gap > 25) console.warn(`  ! ${label} Lücke ${gap.toFixed(0)} m vor Weg ${id} (${w.tags && w.tags.name})`);
      g = g.slice(1);                               // doppelten Knoten weglassen
    }
    const startIdx = pts.length;
    pts.push(...g);
    prev = pts[pts.length - 1];
    spans.set(id, { from: startIdx, to: pts.length - 1, name: w.tags && w.tags.name });
  }
  return pts;
}
const spans = new Map();

function dist(a, b) {
  const dy = (a.lat - b.lat) * 110574;
  const dx = (a.lon - b.lon) * 111320 * Math.cos(50.355 * Math.PI / 180);
  return Math.hypot(dx, dy);
}

console.log('— Nordschleife —');
const nsPts = chain(NS_CHAIN, 'NS');
const nsSpans = new Map(spans);
spans.clear();
console.log('— GP-Strecke —');
const gpPts = chain(GP_CHAIN, 'GP');
spans.clear();
const varPts = chain(GP_VARIANTE, 'Variante');
spans.clear();
const linkPts = chain(GP_LINK, 'Link');

const closeGap = dist(nsPts[0], nsPts[nsPts.length - 1]);
console.log(`Nordschleife: ${nsPts.length} Punkte, Schleife schließt mit ${closeGap.toFixed(1)} m Abstand`);

/* ---- Länge ---- */
function lengthOf(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}
const nsLen = lengthOf(nsPts) + closeGap;
console.log(`Länge Nordschleife: ${(nsLen / 1000).toFixed(3)} km  (Soll 20.832 km)`);
console.log(`Länge GP-Teil:      ${(lengthOf(gpPts) / 1000).toFixed(3)} km`);

/* ---- Kumulative Distanz pro Punkt (für km-Angaben) ---- */
const cum = [0];
for (let i = 1; i < nsPts.length; i++) cum[i] = cum[i - 1] + dist(nsPts[i - 1], nsPts[i]);

/* ---- Kurven auf Wegsegmente abbilden ---- */
const MAP = {
  ns_start:        41395670,
  sabine_schmitz:  1009142894,
  hatzenbach_bogen:1009142895,
  hatzenbach:      799394496,
  hocheichen:      799394497,
  quiddelbacher:   41395684,
  flugplatz:       799394498,
  kottenborn:      { junction: 799394499 },   // Übergang Flugplatz → Schwedenkreuz
  schwedenkreuz:   799394499,
  aremberg:        799394500,
  fuchsroehre:     799394501,
  adenauer_forst:  799394502,
  metzgesfeld:     799394503,
  kallenhard:      799394504,
  spiegelkurve:    799394505,
  misshitmiss:     799394506,
  wehrseifen:      799394507,
  breidscheid:     683061814,
  exmuehle:        245166664,
  lauda_links:     799394508,
  bergwerk:        799394509,
  senkenlinks:     683061804,
  kesselchen:      799394510,
  mutkurve:        799394511,
  klostertal:      799394512,
  steilstrecke:    799394513,
  karussell:       414785755,
  hohe_acht:       414785756,
  hedwigshoehe:    799394515,
  wippermann:      799394514,
  eschbach:        799394516,
  bruennchen:      799394517,
  eiskurve:        799394518,
  pflanzgarten1:   799394519,
  pflanzgarten2:   799394520,
  bellof_s:        799394521,
  schwalbenschwanz:799394522,
  kl_karussell:    799394523,
  galgenkopf:      799394524,
  doettinger:      683303211,
  antoniusbuche:   41792406,
  tiergarten:      799394494,
  hohenrain:       799394495
};

/* Position: 25 % in das benannte Segment hinein — dort liegt der Kurvenbereich,
   nicht auf dem Übergangspunkt zum Vorgänger. */
const FRACTION_INTO_SEGMENT = 0.25;
const cornerIdx = {};
for (const [id, spec] of Object.entries(MAP)) {
  if (spec && spec.junction) {
    const sp = nsSpans.get(spec.junction);
    cornerIdx[id] = sp.from;                       // exakt am Übergang
  } else {
    const sp = nsSpans.get(spec);
    if (!sp) throw new Error(`Segment für ${id} nicht in der Kette`);
    cornerIdx[id] = Math.round(sp.from + (sp.to - sp.from) * FRACTION_INTO_SEGMENT);
  }
}

/* ---- Projektion lat/lon → Bildkoordinaten ---- */
const LAT0 = 50.355, COS = Math.cos(LAT0 * Math.PI / 180);
const proj = p => ({ x: (p.lon) * 111320 * COS, y: -(p.lat) * 110574 });

const allProj = [...nsPts, ...gpPts, ...varPts, ...linkPts].map(proj);
const minX = Math.min(...allProj.map(p => p.x)), maxX = Math.max(...allProj.map(p => p.x));
const minY = Math.min(...allProj.map(p => p.y)), maxY = Math.max(...allProj.map(p => p.y));
const W = maxX - minX, H = maxY - minY;
const SCALE = 1000 / W;                            // Breite auf 1000 Einheiten normieren
const to = p => {
  const q = proj(p);
  return { x: (q.x - minX) * SCALE, y: (q.y - minY) * SCALE };
};
console.log(`Bounding-Box: ${(W/1000).toFixed(2)} km breit × ${(H/1000).toFixed(2)} km hoch`);

/* ---- Douglas-Peucker zum Ausdünnen ---- */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perp(pts[i], a, b);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}
function perp(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / L;
}

const EPS = 0.35;                                   // ~2 m in Realmaß
function pathOf(pts, close) {
  const xy = rdp(pts.map(to), EPS);
  let d = `M${xy[0].x.toFixed(1)} ${xy[0].y.toFixed(1)}`;
  for (let i = 1; i < xy.length; i++) d += `L${xy[i].x.toFixed(1)} ${xy[i].y.toFixed(1)}`;
  if (close) d += 'Z';
  return { d, n: xy.length };
}

const nsPath = pathOf(nsPts, true);
const gpPath = pathOf(gpPts, true);
const varPath = pathOf(varPts, false);
const linkPath = pathOf(linkPts, false);
console.log(`Pfadpunkte nach Ausdünnung: NS ${nsPath.n}, GP ${gpPath.n}`);

/* ---- Abschnitts-Teilstücke ---- */
const SECTORS = {
  s1: ['ns_start', 'aremberg'],
  s2: ['aremberg', 'bergwerk'],
  s3: ['bergwerk', 'hedwigshoehe'],
  s4: ['hedwigshoehe', 'doettinger'],
  s5: ['doettinger', 'ns_start']
};
const sectorPaths = {};
for (const [sec, [from, toId]] of Object.entries(SECTORS)) {
  let a = cornerIdx[from], b = cornerIdx[toId];
  const slice = b > a ? nsPts.slice(a, b + 1)
                      : [...nsPts.slice(a), ...nsPts.slice(0, b + 1)];
  sectorPaths[sec] = pathOf(slice, false).d;
}

/* ---- Kurvenpositionen ---- */
const pos = {};
for (const [id, i] of Object.entries(cornerIdx)) {
  const p = to(nsPts[i]);
  pos[id] = {
    x: +p.x.toFixed(1),
    y: +p.y.toFixed(1),
    km: +(cum[i] / 1000).toFixed(2),
    frac: +(cum[i] / nsLen).toFixed(5)
  };
}

/* GP-Marken: nur Punkte, die sich aus den Daten belegen lassen */
const gpAt = (chainPts, f) => {
  const p = to(chainPts[Math.round((chainPts.length - 1) * f)]);
  return { x: +p.x.toFixed(1), y: +p.y.toFixed(1) };
};
const gpSpans = {};
{
  // Start/Ziel = Anfang der Boxengassen-parallelen Geraden
  gpSpans.gp_sf = gpAt(gpPts, 0.02);
  gpSpans.gp_t1 = gpAt(byId.get(1149161210).geometry, 0.94);
  gpSpans.gp_arena = gpAt(byId.get(1149161209).geometry, 0.5);
  gpSpans.gp_variante = gpAt(varPts, 0.5);
  gpSpans.gp_sponsoren = gpAt(byId.get(27852990).geometry, 0.5);
  gpSpans.gp_ngk = gpAt(byId.get(820679450).geometry, 0.5);
  gpSpans.gp_zufahrt = gpAt(linkPts, 0.5);
}

/* ---- Sichtfelder ---- */
const allXY = [...nsPts, ...gpPts, ...varPts, ...linkPts].map(to);
const bx0 = Math.min(...allXY.map(p => p.x)), bx1 = Math.max(...allXY.map(p => p.x));
const by0 = Math.min(...allXY.map(p => p.y)), by1 = Math.max(...allXY.map(p => p.y));
const pad = 14;
const tight = `${(bx0-pad).toFixed(0)} ${(by0-pad).toFixed(0)} ${(bx1-bx0+pad*2).toFixed(0)} ${(by1-by0+pad*2).toFixed(0)}`;
const padL = 175, padR = 165, padV = 28;
const full = `${(bx0-padL).toFixed(0)} ${(by0-padV).toFixed(0)} ${(bx1-bx0+padL+padR).toFixed(0)} ${(by1-by0+padV*2).toFixed(0)}`;

const out = `/* ============================================================
   ECHTE STRECKENGEOMETRIE
   Erzeugt aus OpenStreetMap-Daten (© OpenStreetMap-Mitwirkende, ODbL).
   Abgerufen über die Overpass-API. Nicht von Hand bearbeiten —
   dieses File wird von scripts/generate-geo.js erzeugt.

   Die Nordschleife ist in OSM in benannte Kurvenabschnitte zerlegt;
   die Kurvenpositionen stammen direkt aus diesen Abschnitten.
   Kilometerangaben sind entlang der echten Streckenmittellinie gemessen.
   ============================================================ */

ND.geo = {
  attribution: 'Streckenverlauf: © OpenStreetMap-Mitwirkende (ODbL)',
  lengthKm: ${(nsLen / 1000).toFixed(3)},
  viewBox: {
    full:  '${full}',
    tight: '${tight}'
  },
  ns: '${nsPath.d}',
  gp: '${gpPath.d}',
  variante: '${varPath.d}',
  link: '${linkPath.d}',
  sectors: {
${Object.entries(sectorPaths).map(([k, v]) => `    ${k}: '${v}'`).join(',\n')}
  },
  pos: ${JSON.stringify(pos, null, 2).replace(/\n/g, '\n  ')},
  gpPos: ${JSON.stringify(gpSpans, null, 2).replace(/\n/g, '\n  ')}
};
`;

fs.writeFileSync(OUT, out, 'utf8');
console.log(`\nGeschrieben: ${OUT} (${(out.length / 1024).toFixed(1)} KB)`);
console.log('\nKurven mit echter Kilometrierung:');
Object.entries(pos).forEach(([k, v]) => console.log(`  ${k.padEnd(18)} km ${String(v.km).padStart(6)}`));
