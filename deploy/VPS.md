# Installer VITAL FORCE sur le VPS Debian

Toutes les commandes se tapent sur le VPS (utilisateur `debian`). Remplacez les valeurs EN MAJUSCULES.

## 1. Logiciels

```bash
sudo apt update
sudo apt install -y git curl nginx postgresql certbot python3-certbot-nginx
# Node.js 22 (si `node -v` affiche moins de v20.12)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Base de données PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER vitalforce WITH PASSWORD 'MOT_DE_PASSE_BASE';"
sudo -u postgres psql -c "CREATE DATABASE vitalforce OWNER vitalforce;"
```

Sauvegarde quotidienne conseillée (crontab -e):

```
30 3 * * * pg_dump postgres://vitalforce:MOT_DE_PASSE_BASE@127.0.0.1/vitalforce | gzip > ~/backups/vitalforce-$(date +\%F).sql.gz
```

(`mkdir -p ~/backups` avant.)

## 3. Code

```bash
cd ~
git clone https://github.com/yassinmejdoub284-cmd/vitalforce.git
cd vitalforce
```

Si le site tourne déjà depuis un autre dossier, faites `git pull` dans ce dossier au lieu de cloner.

## 4. Fichier `.env`

```bash
cp .env.example .env
nano .env
```

À remplir au minimum:

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | `postgres://vitalforce:MOT_DE_PASSE_BASE@127.0.0.1:5432/vitalforce` |
| `AUTH_SECRET` | résultat de `openssl rand -base64 48` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | votre accès admin (mot de passe de 10 caractères minimum) |
| `ADMIN_HOST` | `admin.vitalforce-bioactive.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://vitalforce-bioactive.com` |
| `CRON_SECRET` | résultat de `openssl rand -hex 24` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | voir étape 5 |

Protégez le fichier: `chmod 600 .env`.

## 5. Installation et premier démarrage

```bash
npm ci
npx web-push generate-vapid-keys     # copiez les 2 clés dans .env
npm run db:migrate                    # crée les tables
npm run db:seed                       # ajoute les 3 produits VITAL FORCE
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup                           # puis exécutez la commande sudo qu'il affiche
```

Vérification: `curl -I http://127.0.0.1:3000` doit répondre `200`.

## 6. Nginx + HTTPS

DNS chez votre registrar: enregistrements `A` pour `vitalforce-bioactive.com`, `www` et `admin` vers l'IP du VPS.

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/vitalforce
sudo ln -sf /etc/nginx/sites-available/vitalforce /etc/nginx/sites-enabled/vitalforce
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d vitalforce-bioactive.com -d www.vitalforce-bioactive.com -d admin.vitalforce-bioactive.com
```

HTTPS est obligatoire: sans lui, la connexion à l'admin ne tient pas (cookie sécurisé) et les notifications ne marchent pas.

Si un ancien bloc Nginx sert déjà le site, remplacez seulement son `location /` par celui de l'exemple (surtout `proxy_set_header Host $host;`) et ajoutez `admin.vitalforce-bioactive.com` à `server_name`.

## 7. Tâche automatique (suivi Jetpack toutes les 15 min)

```bash
crontab -e
```

Ajoutez la ligne de `deploy/crontab.example` en remplaçant `VOTRE_CRON_SECRET` par la valeur de `CRON_SECRET`.

## 8. Ville des visiteurs (géolocalisation IP)

```bash
sudo bash /srv/vitalforce/app/scripts/update-geoip.sh
```

Installe la base DB-IP City Lite (licence CC BY 4.0) dans `/srv/vitalforce/geo` et redémarre le site. Mise à jour mensuelle automatique:

```bash
sudo tee /etc/systemd/system/vitalforce-geoip.service >/dev/null <<'UNIT'
[Unit]
Description=Vital Force - mise a jour base IP
[Service]
Type=oneshot
ExecStart=/bin/bash /srv/vitalforce/app/scripts/update-geoip.sh
UNIT
sudo tee /etc/systemd/system/vitalforce-geoip.timer >/dev/null <<'UNIT'
[Unit]
Description=Vital Force - base IP chaque mois
[Timer]
OnCalendar=monthly
Persistent=true
[Install]
WantedBy=timers.target
UNIT
sudo systemctl daemon-reload && sudo systemctl enable --now vitalforce-geoip.timer
```

## 9. Premier passage dans l'admin

Ouvrez `https://admin.vitalforce-bioactive.com`, connectez-vous avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`, puis **Gestion du site**:

1. **Jetpack**: collez le token d'ajout et le token de tracking, puis « Tester la connexion ».
2. **Meta & pixel**: ID du pixel, token API Conversions, compte pub + token Marketing API.
3. **Livraison & coûts**, **Boutique & contact**: vérifiez les valeurs.
4. **Produits**: coût de production et emballage de chaque pot.
5. Sur le téléphone: ouvrez l'admin → Ajouter à l'écran d'accueil → Menu → Activer les notifications.

## Mises à jour

```bash
sudo bash /srv/vitalforce/app/scripts/deploy.sh
```

(`git pull`, installation, migration de la base, build, puis redémarrage du service `vitalforce`.)

## En cas de problème

| Commande | Pour |
| --- | --- |
| `pm2 logs vitalforce --lines 100` | voir les erreurs du site |
| `pm2 restart vitalforce` | redémarrer |
| `sudo tail -50 /var/log/nginx/error.log` | erreurs Nginx (502 = le site Node ne tourne pas) |
| `curl -H "Authorization: Bearer CRON_SECRET" http://127.0.0.1:3000/api/cron/sync` | lancer le suivi Jetpack à la main |
