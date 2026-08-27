# Deployment auf nbr.vfa-142.de

Zwei Teile: nginx liefert die statischen Dateien aus, ein kleiner Node-Dienst
übernimmt die Konten unter `/api/`. Der Node-Dienst lauscht nur auf `127.0.0.1`
und ist von außen nicht erreichbar.

Ohne das Backend funktioniert die App vollständig — nur eben ohne Konten.
Wenn du erstmal nur die App willst, überspring die Schritte 4–6.

---

## 0. Voraussetzungen

```bash
node --version    # 18 oder neuer reicht; getestet mit 22
nginx -v
```

DNS: ein A-Record (und bei IPv6 ein AAAA-Record) für `nbr.vfa-142.de` auf die
Server-IP. Vor Schritt 3 prüfen, sonst schlägt certbot fehl:

```bash
dig +short nbr.vfa-142.de
```

---

## 1. Dateien hochladen

Auf dem Server:

```bash
sudo mkdir -p /var/www/nbr
sudo chown -R $USER:$USER /var/www/nbr
```

Von deinem Rechner aus (Git Bash oder WSL) — es gehen nur die Web-Dateien rauf,
nicht `server/`, `scripts/` oder `data/`:

```bash
rsync -avz --delete index.html css js /var/www/nbr/
```

Mit Angabe des Servers:

```bash
rsync -avz --delete index.html css js benutzer@server:/var/www/nbr/
```

Rechte setzen:

```bash
sudo chown -R www-data:www-data /var/www/nbr
```

---

## 2. nginx einrichten

```bash
sudo cp deploy/nginx-nbr.vfa-142.de.conf /etc/nginx/sites-available/nbr
sudo ln -s /etc/nginx/sites-available/nbr /etc/nginx/sites-enabled/
```

Die Konfiguration verweist schon auf TLS-Zertifikate, die es noch nicht gibt.
Deshalb zuerst certbot (Schritt 3) — oder testweise die vier `ssl_*`-Zeilen und
den 443-Block auskommentieren.

---

## 3. TLS-Zertifikat

```bash
sudo certbot --nginx -d nbr.vfa-142.de
sudo nginx -t && sudo systemctl reload nginx
```

Ab hier läuft die App unter `https://nbr.vfa-142.de`.

---

## 4. Backend installieren

```bash
sudo useradd --system --home /opt/gruene-hoelle --shell /usr/sbin/nologin ghacademy
sudo mkdir -p /opt/gruene-hoelle /var/lib/gruene-hoelle
```

Backend-Code hochladen (nur `server/` wird gebraucht):

```bash
rsync -avz server benutzer@server:/tmp/gh-server/
sudo cp -r /tmp/gh-server/server /opt/gruene-hoelle/
```

Rechte: der Dienst darf nur sein Datenverzeichnis beschreiben.

```bash
sudo chown -R root:root /opt/gruene-hoelle
sudo chown -R ghacademy:ghacademy /var/lib/gruene-hoelle
sudo chmod 700 /var/lib/gruene-hoelle
```

---

## 5. Dienst starten

```bash
sudo cp deploy/gruene-hoelle.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gruene-hoelle
sudo systemctl status gruene-hoelle
```

Logs:

```bash
sudo journalctl -u gruene-hoelle -f
```

---

## 6. Prüfen

```bash
curl -s https://nbr.vfa-142.de/api/me
```

Erwartet: `{"error":"Nicht angemeldet"}` mit Status 401 — dann steht die Kette
nginx → Node.

Kurzer Gesamttest:

```bash
curl -s -X POST https://nbr.vfa-142.de/api/register \
  -H 'Content-Type: application/json' -H 'X-GH-App: 1' \
  -d '{"name":"Test","password":"mindestens8zeichen"}'
```

Danach das Testkonto wieder löschen: Eintrag aus
`/var/lib/gruene-hoelle/users.json` entfernen und
`sudo systemctl restart gruene-hoelle`.

---

## Updates einspielen

```bash
rsync -avz --delete index.html css js benutzer@server:/var/www/nbr/
```

`index.html` wird nicht hart gecacht, CSS und JS nur eine Stunde mit
Revalidierung — Besucher sehen die neue Version also spätestens beim nächsten
Neuladen.

Wenn sich `server/` geändert hat:

```bash
rsync -avz server benutzer@server:/tmp/gh-server/
sudo cp -r /tmp/gh-server/server /opt/gruene-hoelle/
sudo systemctl restart gruene-hoelle
```

---

## Datensicherung

Alles steckt in einer Datei:

```bash
sudo cp /var/lib/gruene-hoelle/users.json ~/gh-backup-$(date +%F).json
```

Als tägliche Aufgabe in der crontab von root:

```
15 4 * * * cp /var/lib/gruene-hoelle/users.json /var/backups/gh-$(date +\%F).json
```

---

## Was wo liegt

| Pfad | Inhalt |
|---|---|
| `/var/www/nbr` | Web-App (index.html, css, js) |
| `/opt/gruene-hoelle/server` | Backend-Code |
| `/var/lib/gruene-hoelle/users.json` | Konten und Fortschritt |
| `/etc/nginx/sites-available/nbr` | nginx-Konfiguration |
| `/etc/systemd/system/gruene-hoelle.service` | Dienst-Definition |

---

## Hinweise zur Sicherheit

* Passwörter werden mit **scrypt** und Zufalls-Salt gehasht, Vergleich läuft
  zeitkonstant.
* Sitzungen: 32 Byte Zufall, Cookie mit `HttpOnly`, `Secure`, `SameSite=Strict`,
  30 Tage Laufzeit, serverseitig widerrufbar.
* Zustandsändernde Aufrufe brauchen den Header `X-GH-App: 1`. Den kann eine
  fremde Seite ohne CORS-Freigabe nicht setzen — zusammen mit `SameSite=Strict`
  ist das der CSRF-Schutz.
* Anmelde-Endpunkte sind auf 12 Versuche je 15 Minuten und IP begrenzt.
* Fortschrittsdaten werden serverseitig auf Struktur, Typ und Größe geprüft;
  der Body ist auf 256 KB gedeckelt.
* Das Backend hört nur auf `127.0.0.1`; nach außen geht ausschließlich nginx.

Das ist solide für ein Projekt im Freundeskreis. Es ist ausdrücklich **kein**
gehärtetes Mehrmandanten-System: es gibt keine E-Mail-Bestätigung, kein
Passwort-Zurücksetzen und keine Zwei-Faktor-Anmeldung. Wer sein Passwort
vergisst, braucht dich als Admin. Sag den Leuten deshalb, sie sollen ein
Passwort nehmen, das sie sonst nirgends benutzen.
