/* ============================================================
   Holt die Rennstrecken-Geometrie rund um den Nürburgring von der
   Overpass-API und legt sie unter data/ring.json ab.

     node scripts/fetch-osm.js

   Danach mit scripts/generate-geo.js zu js/geo.js verarbeiten.

   Datenquelle: OpenStreetMap, © OpenStreetMap-Mitwirkende, ODbL.
   Bitte nicht in Schleifen aufrufen — die Overpass-API ist ein
   kostenloser Gemeinschaftsdienst mit Rate-Limit.
   ============================================================ */
const fs = require('fs');
const path = require('path');

const QUERY = `[out:json][timeout:90];
(way["highway"="raceway"](50.320,6.890,50.400,7.010););
out geom;`;

const OUT = path.join(__dirname, '..', 'data', 'ring.json');

(async () => {
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(QUERY);
  console.log('Frage Overpass-API ab …');

  const res = await fetch(url, {
    headers: {
      // Overpass verlangt einen aussagekräftigen User-Agent
      'User-Agent': 'GrueneHoelleAcademy/1.0 (Lernprojekt Nordschleife)',
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Overpass antwortete mit ${res.status} ${res.statusText}`);

  const text = await res.text();
  const data = JSON.parse(text);                 // wirft, falls keine gültige Antwort
  const ways = data.elements.filter(e => e.geometry).length;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text, 'utf8');
  console.log(`${ways} Streckensegmente gespeichert → ${OUT}`);
  console.log('Weiter mit: node scripts/generate-geo.js');
})().catch(err => {
  console.error('Fehlgeschlagen:', err.message);
  process.exit(1);
});
