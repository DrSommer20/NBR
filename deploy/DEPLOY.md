# Deployment auf nbr.vfa-142.de

Zwei Teile: nginx liefert die statischen Dateien aus, ein kleines Node-Backend
übernimmt die Konten unter `/api/`. Das Backend lauscht nur auf `127.0.0.1` und
ist von außen nicht erreichbar.

**Ohne das Backend funktioniert die App vollständig** — nur eben ohne Konten.
Wenn du erstmal nur die App online haben willst, überspring die Schritte 5–7.

Alle Befehle laufen auf dem Server, sofern nicht anders angegeben.

---

## 0. Vorbedingungen prüfen

```bash
node --version    # 18 oder neuer
nginx -v
git --version
```

DNS muss stehen, sonst scheitert das Zertifikat:

```bash
dig +short nbr.vfa-142.de
```

Muss die IP deines Servers zeigen. Ports 80 und 443 müssen offen sein.

---

## 1. Code auf den Server holen

```bash
sudo mkdir -p /opt/gruene-hoelle
sudo chown "$USER" /opt/gruene-hoelle
git clone https://github.com/DrSommer20/NBR.git /opt/gruene-hoelle
```

> Die Deployment-Dateien liegen im Branch `feature/konten-und-deployment`.
> Entweder vorher den Pull Request mergen, oder direkt den Branch klonen:
> `git clone -b feature/konten-und-deployment https://github.com/DrSommer20/NBR.git /opt/gruene-hoelle`

---

## 2. Zertifikat holen — bevor die richtige Konfiguration kommt

Die eigentliche nginx-Konfiguration verweist auf Zertifikate, die es noch nicht
gibt. Deshalb zuerst eine Übergangs-Konfiguration nur für Port 80:

```bash
sudo mkdir -p /var/www/html
sudo cp /opt/gruene-hoelle/deploy/nginx-bootstrap.conf /etc/nginx/sites-available/nbr
sudo ln -sf /etc/nginx/sites-available/nbr /etc/nginx/sites-enabled/nbr
sudo nginx -t && sudo systemctl reload nginx
```

Kurz gegenprüfen, dass die Domain wirklich bei diesem nginx landet:

```bash
curl -s http://nbr.vfa-142.de/
```

Muss `Grüne Hölle Academy — Einrichtung läuft.` ausgeben. Erst dann:

```bash
sudo certbot certonly --webroot -w /var/www/html -d nbr.vfa-142.de
```

---

## 3. Richtige nginx-Konfiguration

```bash
sudo cp /opt/gruene-hoelle/deploy/nginx-nbr.vfa-142.de.conf /etc/nginx/sites-available/nbr
sudo nginx -t && sudo systemctl reload nginx
```

Falls `nginx -t` über `http2` meckert: siehe Kommentar oben in der Datei — die
mitgelieferte Schreibweise funktioniert auf allen Versionen, auf nginx ab 1.25
gibt es dabei nur eine Warnung.

---

## 4. Web-Dateien ausliefern

```bash
sudo mkdir -p /var/www/nbr
sudo rsync -a --delete \
  /opt/gruene-hoelle/index.html \
  /opt/gruene-hoelle/css \
  /opt/gruene-hoelle/js \
  /var/www/nbr/
sudo chown -R www-data:www-data /var/www/nbr
```

**Jetzt läuft die App schon:** https://nbr.vfa-142.de

Wenn du keine Konten brauchst, bist du hier fertig.

---

## 5. Backend-Benutzer und Datenverzeichnis

```bash
sudo useradd --system --home /opt/gruene-hoelle --shell /usr/sbin/nologin ghacademy
sudo mkdir -p /var/lib/gruene-hoelle
sudo chown ghacademy:ghacademy /var/lib/gruene-hoelle
sudo chmod 700 /var/lib/gruene-hoelle
sudo chown -R root:root /opt/gruene-hoelle
```

Der Dienst darf einzig sein Datenverzeichnis beschreiben — den Code nicht.

---

## 6. Dienst starten

```bash
sudo cp /opt/gruene-hoelle/deploy/gruene-hoelle.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gruene-hoelle
sudo systemctl status gruene-hoelle --no-pager
```

Logs mitlesen:

```bash
sudo journalctl -u gruene-hoelle -f
```

---

## 7. Gesamtkette prüfen

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://nbr.vfa-142.de/api/me
```

Erwartet: **401**. Dann steht die Kette nginx → Node. Ein 502 heißt, das
Backend läuft nicht; ein 404 heißt, der Proxy greift nicht.

Konto-Anlage einmal durchspielen:

```bash
curl -s -X POST https://nbr.vfa-142.de/api/register \
  -H 'Content-Type: application/json' -H 'X-GH-App: 1' \
  -d '{"name":"Test","password":"mindestens8zeichen"}'
```

Danach das Testkonto wieder entfernen:

```bash
sudo systemctl stop gruene-hoelle
sudo nano /var/lib/gruene-hoelle/users.json     # Eintrag "test" löschen
sudo systemctl start gruene-hoelle
```

Zum Schluss im Browser auf **Profil** gehen und ein echtes Konto anlegen.

---

## Updates einspielen

Ein Befehl:

```bash
sudo /opt/gruene-hoelle/deploy/update.sh
```

Das Skript holt den aktuellen Stand, kopiert die Web-Dateien, startet das
Backend nur neu wenn sich dort etwas geändert hat, und lädt nginx neu.

Einmalig ausführbar machen:

```bash
sudo chmod +x /opt/gruene-hoelle/deploy/update.sh
```

`index.html` wird nicht hart gecacht, CSS und JS nur eine Stunde mit
Revalidierung — Besucher sehen die neue Version also spätestens beim nächsten
Neuladen.

---

## Datensicherung

Alles steckt in einer Datei:

```bash
sudo cp /var/lib/gruene-hoelle/users.json ~/gh-backup-$(date +%F).json
```

Täglich per crontab von root:

```
15 4 * * * cp /var/lib/gruene-hoelle/users.json /var/backups/gh-$(date +\%F).json
```

Lege die Sicherungen **nicht** unter `/var/www` ab — dort wären sie abrufbar.

---

## Wenn etwas klemmt

| Symptom | Ursache |
|---|---|
| `nginx: [emerg] unknown directive "http2"` | nginx älter als 1.25 — die mitgelieferte `listen … ssl http2;`-Schreibweise nutzen |
| certbot: `Could not reach` | DNS zeigt nicht auf den Server, oder Port 80 ist zu |
| `/api/me` liefert 502 | Backend läuft nicht: `journalctl -u gruene-hoelle -n 30` |
| `/api/me` liefert 404 | `location /api/` fehlt — falsche Konfiguration aktiv |
| Anmelden schlägt still fehl | Seite über `http://` statt `https://` geöffnet; das Session-Cookie hat `Secure` |
| Konto-Bereich fehlt ganz | Seite per `file://` geöffnet statt über die Domain |

---

## Was wo liegt

| Pfad | Inhalt |
|---|---|
| `/opt/gruene-hoelle` | Git-Klon: Backend, Skripte, Deployment-Dateien |
| `/var/www/nbr` | Ausgelieferte Web-App |
| `/var/lib/gruene-hoelle/users.json` | Konten und Fortschritt |
| `/etc/nginx/sites-available/nbr` | nginx-Konfiguration |
| `/etc/systemd/system/gruene-hoelle.service` | Dienst-Definition |

---

## Sicherheit

* Passwörter mit **scrypt** und Zufalls-Salt gehasht, Vergleich zeitkonstant.
* Sitzungen: 32 Byte Zufall, Cookie mit `HttpOnly`, `Secure`, `SameSite=Strict`,
  30 Tage, serverseitig widerrufbar.
* Zustandsändernde Aufrufe brauchen den Header `X-GH-App: 1` — den kann eine
  fremde Seite ohne CORS-Freigabe nicht setzen. Zusammen mit `SameSite=Strict`
  ist das der CSRF-Schutz.
* Anmelde-Endpunkte: 12 Versuche je 15 Minuten und IP.
* Fortschrittsdaten werden serverseitig auf Struktur, Typ und Größe geprüft,
  Body auf 256 KB gedeckelt.
* Backend hört nur auf `127.0.0.1`.
* systemd: eigener Benutzer, `ProtectSystem=strict`, beschreibbar ist einzig
  `/var/lib/gruene-hoelle`.

Solide für ein Projekt im Freundeskreis. Ausdrücklich **kein** gehärtetes
Mehrmandanten-System: es gibt keine E-Mail-Bestätigung, kein
Passwort-Zurücksetzen und keine Zwei-Faktor-Anmeldung. Wer sein Passwort
vergisst, braucht dich als Admin. Sag den Leuten deshalb, sie sollen ein
Passwort nehmen, das sie sonst nirgends benutzen.
