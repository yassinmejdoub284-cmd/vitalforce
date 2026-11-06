#!/usr/bin/env bash
# Installe / met à jour la base de géolocalisation IP (DB-IP City Lite, CC BY 4.0) utilisée
# pour afficher la ville des visiteurs. À lancer avec sudo; un timer systemd le relance chaque mois.
set -euo pipefail
GEO_DIR="${GEOIP_DIR:-/srv/vitalforce/geo}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

npm pack --silent @ip-location-db/dbip-city-mmdb >/dev/null
tar xzf ./*.tgz
mkdir -p "$GEO_DIR"
for file in dbip-city-ipv4.mmdb dbip-city-ipv6.mmdb; do
  install -m 0644 "package/$file" "$GEO_DIR/$file.new"
  mv -f "$GEO_DIR/$file.new" "$GEO_DIR/$file"
done
if id vitalforce >/dev/null 2>&1; then chown -R vitalforce:vitalforce "$GEO_DIR"; fi
# Le site recharge la base au redémarrage.
if systemctl is-active --quiet vitalforce 2>/dev/null; then systemctl restart vitalforce; fi
echo "Base IP installée dans $GEO_DIR ($(du -sh "$GEO_DIR" | cut -f1))."
