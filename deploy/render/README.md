# Déploiement Render — CNPM Digital Platform

Ce dossier contient les artefacts de déploiement pour [Render](https://render.com).

## Ce que je peux et ne peux pas faire

Je prépare la **configuration** (ce dépôt). Je **ne peux pas** créer ton compte Render,
autoriser la connexion GitHub↔Render, provisionner des services, ni engager une
facturation : ces étapes se font dans ton tableau de bord Render, avec ton compte.

---

## Option A — Démonstration (recommandée, gratuite, fonctionne tout de suite)

Le front Angular publié en **site statique**, en mode `demo` : toutes les vues
fonctionnent sur données fictives, **sans aucun backend**. C'est ce que décrit
[`render.yaml`](../../render.yaml) à la racine.

### Étapes (dans le navigateur, connecté à Render)
1. Sur Render : **New +** → **Blueprint**.
2. Connecte le dépôt GitHub **`romialfred/CNPM`** (autorise l'accès Render↔GitHub).
3. Choisis la branche (`main` ou `Dev`). Render lit `render.yaml` automatiquement.
4. **Apply** → Render construit et publie le site. Tu obtiens une URL
   `https://cnpm-web.onrender.com`.

Détails techniques : build `npm ci && npm run build`, publication de
`web/dist/cnpm-web/browser`, config d'exécution basculée en `demo` via
[`runtime-config.demo.js`](runtime-config.demo.js), routage SPA vers `index.html`.

---

## Option B — Complet « http » (backend réel) — préparation requise, payant

Le mode `http` fait dialoguer le front avec le backend Spring Boot (auth native).
Ce déploiement n'est **pas** activé dans `render.yaml` : il demande des décisions et
des moyens que seul un humain fournit. À prévoir :

| Élément | Sur Render | Remarque |
|---|---|---|
| PostgreSQL | Base managée | Flyway applique les migrations au démarrage. Vérifier la version PG proposée vs 18. |
| Backend Spring Boot (Java 25) | Web Service **Docker** | Nécessite un `Dockerfile` (à écrire) ; `mvn package` → jar exécutable. |
| RabbitMQ | **Non managé par Render** | Service privé Docker (payant) ou fournisseur externe (ex. CloudAMQP). Sans lui, la santé AMQP reste DOWN et les événements outbox échouent. |
| Front Angular | Servi par le backend (même origine) **ou** site statique + `baseUrl` absolue + CORS | Le front appelle `/v1` : le plus simple est de servir l'Angular depuis le backend. |
| Secrets | `DATABASE_PASSWORD`, `RABBITMQ_*`, `APP_JWT_SECRET`, `OIDC_ISSUER_URI`… | Jamais commités ; saisis dans Render (env vars `sync:false`). |

Contraintes du dépôt (voir `CLAUDE.md`) : **ne pas déployer sans approbation humaine
explicite**, et certaines décisions produit sont encore bloquées
(`docs/00-governance/open-decisions.md`).

👉 Si tu veux ce déploiement complet, dis-le : je prépare le `Dockerfile` backend, le
blueprint multi-services et le service de RabbitMQ, après ta validation du coût et du périmètre.
