#!/usr/bin/env bash
# Mise à jour sur le VPS: récupère le code, installe, migre la base, construit et redémarre.
# Usage (dans le dossier du projet): npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only
npm ci
npm run db:migrate
npm run build
if pm2 describe vitalforce >/dev/null 2>&1; then
  pm2 reload vitalforce --update-env
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi
echo "Déploiement terminé."
