#!/usr/bin/env bash
# ============================================================
#  Grüne Hölle Academy — Update einspielen
#
#  Holt den aktuellen Stand aus Git, kopiert die Web-Dateien in
#  den Webroot und startet das Backend neu, falls es sich
#  geändert hat.
#
#  Aufruf auf dem Server:
#    sudo /opt/gruene-hoelle/deploy/update.sh
# ============================================================
set -euo pipefail

REPO=${REPO:-/opt/gruene-hoelle}
WEBROOT=${WEBROOT:-/var/www/nbr}
SERVICE=${SERVICE:-gruene-hoelle}
BRANCH=${BRANCH:-main}

if [ "$(id -u)" -ne 0 ]; then
  echo "Bitte mit sudo ausführen." >&2
  exit 1
fi

echo "==> Aktuellen Stand holen ($BRANCH)"
git -C "$REPO" fetch --quiet origin "$BRANCH"

VORHER=$(git -C "$REPO" rev-parse HEAD)
git -C "$REPO" reset --hard --quiet "origin/$BRANCH"
NACHHER=$(git -C "$REPO" rev-parse HEAD)

if [ "$VORHER" = "$NACHHER" ]; then
  echo "    Schon aktuell ($(git -C "$REPO" log -1 --format=%h))."
else
  echo "    $(git -C "$REPO" log -1 --format='%h %s')"
fi

echo "==> Web-Dateien nach $WEBROOT kopieren"
mkdir -p "$WEBROOT"
# Nur die Dateien, die ins Web gehören — kein server/, scripts/, data/, deploy/
rsync -a --delete \
  "$REPO/index.html" \
  "$REPO/css" \
  "$REPO/js" \
  "$WEBROOT/"
chown -R www-data:www-data "$WEBROOT"

# Backend nur neu starten, wenn sich dort etwas getan hat
if [ "$VORHER" != "$NACHHER" ] && \
   ! git -C "$REPO" diff --quiet "$VORHER" "$NACHHER" -- server/; then
  echo "==> Backend hat sich geändert, Dienst wird neu gestartet"
  systemctl restart "$SERVICE"
  sleep 1
  systemctl is-active --quiet "$SERVICE" \
    && echo "    Dienst läuft." \
    || { echo "    FEHLER: Dienst läuft nicht. journalctl -u $SERVICE -n 30" >&2; exit 1; }
else
  echo "==> Backend unverändert, kein Neustart nötig"
fi

echo "==> nginx prüfen und neu laden"
nginx -t && systemctl reload nginx

echo
echo "Fertig. https://nbr.vfa-142.de"
