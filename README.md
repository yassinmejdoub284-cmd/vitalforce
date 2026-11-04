# VITAL FORCE — boutique + admin

Site de vente VITAL FORCE (boutique en français, pages de vente en arabe tunisien) et espace d'administration installable sur téléphone (PWA) sur `admin.vitalforce-bioactive.com`.

## Ce que fait l'admin

| Module | Contenu |
| --- | --- |
| **Tableau de bord** | Visiteurs en ligne, commandes reçues/confirmées/livrées/retours, taux de confirmation, de livraison et de conversion, chiffre d'affaires livré, encaissé par Jetpack, profit net, coût réel par commande livrée, entonnoir, graphique jour par jour, pages de vente, sources, gouvernorats, produits. |
| **Commandes** | Onglets par statut, recherche (nom, téléphone, n°, code Jetpack), filtres, sélection multiple, Confirmer / Pas de réponse / Annuler, **Envoyer à Jetpack**, suivi Jetpack (état officiel + état livreur en temps réel + payée ou non), historique client, doublons, liste noire, export Excel (CSV), saisie manuelle d'une commande. |
| **Visiteurs live** | Personnes sur le site dans la dernière minute: page, source, appareil, ville. Actualisé toutes les 5 s. |
| **Marketing & rentabilité** | Chiffres Meta (dépenses, CTR, CPM, conversion pixel, coût par achat) face aux commandes réelles, ROAS réel, dépenses par campagne (API Meta ou saisie manuelle), **calculateur** du coût réel d'une commande en tenant compte des annulations et retours, et du coût pub maximum rentable. |
| **Produits & stock** | Ajouter / modifier / masquer un produit, prix, prix barré, coût de production, emballage, stock, image importée. Marge par pot livré calculée en direct. |
| **Gestion du site** | Contact (téléphone, WhatsApp, adresse FR/AR, réseaux), bandeau d'annonce, ouverture des commandes, **prix de livraison / livraison incluse / seuil de gratuité**, coûts Jetpack, coût de confirmation, charges fixes, **pixel Meta + API Conversions**, compte publicitaire, **tokens Jetpack** (avec bouton de test), notifications, règles commandes, liste noire, mot de passe. |

Le stock est réservé à la confirmation, rendu en cas d'annulation, et remis en stock au retour d'un colis (réglable).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind, **PostgreSQL + Drizzle ORM**, Zod, Zustand, Three.js, web-push.

## Installation locale

```bash
npm install
cp .env.example .env.local     # remplir DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate             # crée les tables
npm run db:seed                # ajoute les 3 produits VITAL FORCE
npm run vapid                  # clés pour les notifications (à copier dans .env.local)
npm run dev
```

- Boutique: http://localhost:3000
- Admin: http://localhost:3000/admin (connexion avec ADMIN_EMAIL / ADMIN_PASSWORD)

Autre admin: `npm run admin:create -- email@exemple.tn "MotDePasse10+" "Nom"`.

## Mise en ligne sur Vercel

1. **Base de données**: Vercel → Storage → Neon Postgres → connecter au projet (ajoute `DATABASE_URL` et `DATABASE_URL_UNPOOLED`).
2. **Variables d'environnement** (Settings → Environment Variables): `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_HOST=admin.vitalforce-bioactive.com`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
3. **Build**: le script `vercel-build` applique les migrations puis construit le site. Après le premier déploiement, lancez une fois `npm run db:seed` avec la `DATABASE_URL` de production.
4. **Sous-domaine admin**: Vercel → Settings → Domains → ajouter `admin.vitalforce-bioactive.com` au même projet, puis chez votre registrar un enregistrement `CNAME admin → cname.vercel-dns.com`.
5. **Tâche planifiée**: `vercel.json` lance `/api/cron/sync` chaque jour (suivi Jetpack + dépenses Meta). Avec un plan Vercel Pro vous pouvez passer à toutes les 30 min (`*/30 * * * *`). Le suivi se lance aussi via le bouton « Suivi Jetpack ».
6. Dans l'admin → **Gestion du site**: collez les tokens Jetpack (bouton « Tester la connexion »), l'ID du pixel, le token API Conversions, l'ID du compte pub et le token Marketing API.

## Application mobile (PWA) et notifications

Ouvrez `admin.vitalforce-bioactive.com` sur le téléphone puis **Ajouter à l'écran d'accueil** (Android: menu ⋮ · iPhone: Partager). Ensuite Menu → « Activer les notifications ». Sur iPhone, les notifications ne marchent que depuis l'icône installée (iOS 16.4+).

Notifications envoyées: nouvelle commande, colis livré / retourné, et un résumé « X visiteurs en ligne » (au plus une fois toutes les 15 min par défaut). Quand l'admin est ouvert, une nouvelle commande affiche aussi une alerte avec un son.

## Meta (pixel, API Conversions, Ads)

- Pixel navigateur: PageView, ViewContent, InitiateCheckout, Purchase (ou Lead si l'achat est envoyé à la confirmation).
- API Conversions: Purchase envoyé par le serveur avec téléphone/nom/ville hachés (SHA-256), `fbp`/`fbc`, et le même `event_id` que le pixel pour la déduplication. Réglage « Envoyer l'achat: dès la commande / après confirmation ».
- Marketing API: dépenses, impressions, clics, vues de page et achats pixel par jour et par campagne.
- Ajoutez `?utm_source=facebook&utm_campaign={{campaign.name}}&utm_content={{ad.name}}` aux liens des pubs: chaque commande garde sa campagne.

## Jetpack

Intégration selon la documentation API Jetpack v2: `add_order.php` (token d'ajout) crée le colis et renvoie le code à barre; `track_order.php` (token de tracking) renvoie l'état, l'état livreur (pre-etat) et le paiement, par lots de 200 codes (30 requêtes/minute max). Correspondance: `Livrer` → livrée; `Retour recu`, `Retour paye`, `Retour Expediteur`, `Rtn definitif` → retournée; `Supprime` → annulée; le reste → chez Jetpack.

## Sécurité

- Admin et API admin protégés par session (cookie HttpOnly signé, 30 jours), limitation des tentatives de connexion.
- Les tokens sont stockés en base, jamais renvoyés en clair au navigateur (seulement les 4 derniers caractères).
- Prix et frais toujours recalculés côté serveur; numéro tunisien validé (8 chiffres); champ piège anti-robots; liste noire.

## Vérifications

```bash
npm run typecheck
npm run lint
npm run build
```

## Notes santé et conformité

Les textes distinguent les recherches préliminaires sur les ingrédients des effets démontrés de la formule finie. L'étiquette Citron est une adaptation illustrative, pas une étiquette de production validée. Vérifiez les allégations (notamment la page « intimacy ») avec la réglementation tunisienne des compléments alimentaires et les règles publicitaires de Meta.
