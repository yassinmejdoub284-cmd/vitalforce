#!/usr/bin/env bash
# Mise à jour du site sur le VPS (à lancer avec l'utilisateur debian):
#   bash /srv/vitalforce/app/scripts/deploy.sh
# Le code appartient à l'utilisateur « vitalforce »; le service systemd « vitalforce » fait tourner le site.
set -euo pipefail
APP=/srv/vitalforce/app
as_app() { sudo -u vitalforce env HOME=/srv/vitalforce bash -c "cd $APP && $1"; }

as_app "git pull --ff-only"
as_app "npm ci --no-audit --no-fund"
as_app "npm run db:migrate"
as_app "npm run build"
sudo systemctl restart vitalforce
sleep 5
systemctl is-active vitalforce
echo "Déploiement terminé."
