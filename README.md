# 🏁 Grüne Hölle Academy

Eine Web-App, um die **Nürburgring Nordschleife** wirklich zu lernen: Kurvennamen,
Reihenfolge, Bremspunkte, Gänge und Streckencharakter — für Assetto Corsa, für
NLS-Wochenenden und für die 24 Stunden.

Kein Build, kein Backend, keine Abhängigkeiten. Reines HTML, CSS und JavaScript.

---

## Was drin ist

### 🗺️ Interaktive Streckenkarte
- **Echte Streckengeometrie** aus OpenStreetMap — kein schematischer Nachbau. Die Nordschleife
  ist in OSM in ihre benannten Kurvenabschnitte zerlegt, daraus stammen Verlauf, Kurvenpositionen
  und die Kilometrierung (entlang der Mittellinie gemessen, Schleife schließt auf 0,0 m).
- Alle **50 benannten Kurven und Passagen** der NLS-Runde, inklusive GP-Strecke
- Klick auf jede Kurve → Bremspunkt, Gang, Richtung, Höhe, Fahrtipp, Assetto-Corsa-Hinweis, Geschichte, Zuschauer-Info
- Filter nach Abschnitt — hebt das echte Teilstück auf der Karte hervor
- **„Runde abspielen"** — ein Auto fährt die Strecke ab, die Kurven ticken an ihrer echten Position durch
- **Höhenprofil** der Nordschleife über der gemessenen Kilometrierung

### 📖 Kurven-Lexikon
Durchsuchbare Datenbank aller Kurven mit Vor-/Zurück-Navigation in Fahrtrichtung
und Minikarte zur Verortung.

### 📇 Lernkarten (Leitner-System)
Karteikasten mit fünf Fächern. Was du kannst, kommt seltener — was du nicht kannst,
kommt wieder. Sechs Kartentypen: Namen, Richtung, Gang, Bremspunkt, Reihenfolge, gemischt.

### 🎮 Sieben Minispiele
| Spiel | Was du lernst |
|---|---|
| 🎯 **Kurven-Quiz** | Karte zeigt eine Kurve — wie heißt sie? |
| 🧠 **Blind Lap** | Was kommt als Nächstes? Die ganze Runde aus dem Kopf |
| 🛑 **Bremspunkt-Trainer** | Timing-Spiel mit echten Bremsmarken (300/200/150/100/50 m) |
| ⚡ **Blitz 60** | 60 Sekunden Richtungen und Gänge unter Zeitdruck |
| 📍 **Karten-Klick** | Name gehört — Ort auf der Karte finden |
| 🔢 **Sortier-Challenge** | Sechs Kurven in die richtige Reihenfolge |
| 🚩 **Flaggen-Trainer** | Flaggen, Code 60 und Regelkunde fürs Rennwochenende |

### 🏕️ Zuschauer-Guide für NLS & 24h
- Die **besten Zuschauerplätze** mit Bewertung, Blickwinkel, Tipps und Warnungen
- **Klassenkunde**: SP9 GT3, Cup 2/3/5, TCR, VT — wer ist wie schnell, wer kämpft gegen wen
- **Flaggen & Code 60** ausführlich erklärt
- **24h-Wissen**: Nacht, Nebel, Fahrerwechsel, Zeitplan als Zuschauer, Legenden & Rekorde
- **Renn-Rechner**: Rundenzeit → Runden, Kilometer, Schnitt über 24 Stunden
- Packliste für die Eifel

### 🕹️ Assetto Corsa Ecke
Trainingspläne (3-Sektoren-Plan, Bremspunkt-Kalibrierung, Blind-Runde, Verkehrs-Training),
Setup-Grundlagen speziell für die Nordschleife, Referenzzeiten und ein automatisch
erzeugter Übungsplan aus deinen schwächsten Kurven.

### 👤 Fortschritt
XP, 10 Fahrer-Level vom „Touristenfahrer" bis zur „Ring-Legende", 16 Abzeichen,
Meisterschaftsgrad pro Kurve, Bestleistungen pro Spiel. Alles im `localStorage`
des Browsers — kein Account, kein Server, keine Datenübertragung.

---

## Lokal starten

`index.html` doppelklicken. Fertig — die App läuft direkt von der Festplatte.

## Bedienung

- **Alt + 1…8** springt zwischen den Ansichten
- **Leertaste** bremst im Bremspunkt-Trainer
- Direktlinks funktionieren: `#map`, `#games`, `#game:quiz`, `#lexikon:karussell`

---

## Auf den eigenen Server (nginx)

Die App ist komplett statisch — es reicht, den Ordner ins Webroot zu legen.

**1. Dateien hochladen**

```bash
rsync -avz --delete index.html css js /var/www/gruene-hoelle/
```

Von Windows aus per `scp`:

```bash
scp -r index.html css js benutzer@server:/var/www/gruene-hoelle/
```

**2. Rechte setzen**

```bash
sudo chown -R www-data:www-data /var/www/gruene-hoelle
```

**3. nginx-Konfiguration einbinden**

Die fertige Server-Konfiguration liegt in [`deploy/nginx-gruene-hoelle.conf`](deploy/nginx-gruene-hoelle.conf).
Domain eintragen, dann:

```bash
sudo cp deploy/nginx-gruene-hoelle.conf /etc/nginx/sites-available/gruene-hoelle
sudo ln -s /etc/nginx/sites-available/gruene-hoelle /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**4. TLS-Zertifikat**

```bash
sudo certbot --nginx -d ring.example.com
```

Die Konfiguration bringt gzip, Cache-Header, HSTS und eine Content-Security-Policy
bereits mit. `index.html` wird bewusst nicht hart gecacht, damit Besucher nach einem
Update nicht auf der alten Version festhängen.

---

## Projektstruktur

```
index.html                     Grundgerüst und Navigation
css/styles.css                 Komplettes Design
js/data.js                     Kurven-, Spot-, Klassen- und Flaggendaten
js/geo.js                      Erzeugte Streckengeometrie (nicht von Hand ändern)
js/core.js                     Speicher, Sound, Achievements, Kartenrendering
js/views.js                    Die acht Ansichten
js/games.js                    Die sieben Minispiele
js/app.js                      Router und Start
scripts/fetch-osm.js           Holt die OSM-Rohdaten
scripts/generate-geo.js        Erzeugt js/geo.js daraus
data/ring.json                 OSM-Rohdaten
deploy/nginx-gruene-hoelle.conf
```

Neue Kurve oder besserer Bremspunkt? Alles Inhaltliche steckt in `js/data.js` —
ein Eintrag im `ND.corners`-Array taucht automatisch in Karte, Lexikon, Lernkarten
und allen Spielen auf.

### Streckengeometrie neu erzeugen

Nur nötig, wenn sich die OSM-Daten geändert haben — `js/geo.js` liegt fertig im Repo:

```bash
node scripts/fetch-osm.js && node scripts/generate-geo.js
```

Das Skript verkettet die benannten Streckenabschnitte zur geschlossenen Runde,
prüft dabei jede Verbindungsstelle, misst die Kilometrierung und dünnt den
Streckenzug per Douglas-Peucker auf rund 2 m Genauigkeit aus.

---

## Datenquelle & Hinweise

**Streckenverlauf: © OpenStreetMap-Mitwirkende**, Daten unter der
[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/), abgerufen
über die Overpass-API. Daraus stammen Geometrie, Kurvenpositionen und Kilometrierung.
Die gemessene Länge von 20,71 km liegt rund 0,6 % unter der offiziellen Angabe von
20,832 km — erwartbar, weil hier die Mittellinie gemessen wird.

**Bremspunkte, Gänge, Geschwindigkeiten und Höhenangaben sind Richtwerte** für ein
GT3-artiges Fahrzeug. Sie verschieben sich je nach Auto, Setup, Reifen, Tankfüllung
und Wetter teils erheblich — nutze sie als Orientierung, nicht als Gesetz.

**Zu den GP-Kurven:** Auf dem Rückweg zur Schlussschikane liegen mehrere Kurven, die
alle Sponsorennamen tragen (Ford-Kurve, Dunlop-Kehre, Bit-Kurve, Advan-Bogen …). Diese
Namen wechseln mit den Verträgen und sind in den Kartendaten nicht einzeln verortet.
Die App fasst den Abschnitt deshalb als eine Passage zusammen, statt Positionen zu
erfinden. Im Zweifel gilt der Streckenplan deines Rennwochenendes.

Dies ist ein inoffizielles Fan- und Lernprojekt ohne Verbindung zum Nürburgring,
zur NLS oder zu Veranstaltern. Auf der Strecke gilt immer das, was Streckenposten
und Rennleitung sagen.
