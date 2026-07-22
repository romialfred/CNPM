# Déploiement Render — CNPM Digital Platform

Configuration de déploiement pour [Render](https://render.com). Le blueprint
[`render.yaml`](../../render.yaml) décrit le déploiement **complet « http »**.

## Ce que je peux et ne peux pas faire

Je prépare et vérifie la **configuration** (ce dépôt). Je **ne peux pas**, à ta place :
créer ton compte Render, autoriser la connexion Render↔GitHub, provisionner des
services, saisir les secrets ni accepter la facturation. Ces étapes se font dans ton
tableau de bord Render — la config est faite pour que ta part soit minimale.

`CLAUDE.md` interdit un déploiement sans **approbation humaine explicite** : c'est
précisément l'Apply que tu déclenches toi-même ci-dessous.

---

## Architecture déployée (mode `http`)

| Service | Type Render | Rôle |
|---|---|---|
| `cnpm-db` | PostgreSQL managé | Flyway applique les 16 migrations au démarrage. |
| `cnpm-backend` | Web Service **Docker** (Java 25) | API Spring Boot, **auth native** (sans Keycloak). |
| `cnpm-web` | Site statique | Front Angular (mode `http`) appelant le backend. |

- Le front et le backend sont sur **deux origines** : le backend autorise l'origine du
  front en **CORS** (`CNPM_WEB_CORS_ALLOWED_ORIGINS`). Le `baseUrl` du front est câblé
  automatiquement sur l'hôte du backend (`API_HOST` via `fromService`).
- **Auth native** : `CNPM_SECURITY_NATIVE_JWT_ENABLED=true` + `APP_JWT_SECRET` (généré
  par Render). L'auto-configuration Keycloak se retire ; aucun appel réseau OIDC au boot.

---

## Étapes (dans le navigateur, connecté à Render)

1. Render → **New +** → **Blueprint**.
2. Connecte le dépôt GitHub **`romialfred/CNPM`** (autorise l'accès Render↔GitHub).
3. Branche **`main`**. Render lit `render.yaml` et liste les 3 services + la base.
4. **Apply**. Render génère les secrets (`APP_JWT_SECRET`, mot de passe RabbitMQ),
   provisionne la base, construit l'image backend puis le site statique.
5. À la fin : front `https://cnpm-web.onrender.com`, API `https://cnpm-backend.onrender.com`.

---

## Points à connaître (limites honnêtes)

- **Coût.** La base free expire ~90 jours ; le backend est en `starter` (payant). Un
  site statique est gratuit. Ajuste les `plan:` selon ton budget.
- **Mémoire.** Spring Boot + Hibernate sur 512 Mo, c'est juste. En cas d'OOM au
  démarrage, monte `cnpm-backend` en `plan: standard`.
- **Version PostgreSQL.** Render ne propose pas encore PG18 ; le blueprint cible PG16.
  Les migrations n'utilisent pas de syntaxe PG18 (vérifié), mais teste après le 1er déploiement.
- **CORS.** Si Render attribue au front un sous-domaine différent de
  `https://cnpm-web.onrender.com`, mets à jour `CNPM_WEB_CORS_ALLOWED_ORIGINS` sur le backend.
- **RabbitMQ.** Render n'a pas de broker managé. Par défaut l'app **démarre sans broker**
  (connexion paresseuse) : lecture et parcours OK, mais les événements outbox sont différés.
  Pour la fonctionnalité complète, crée un broker (ex. [CloudAMQP](https://www.cloudamqp.com)
  plan gratuit) et renseigne sur `cnpm-backend` : `RABBITMQ_HOST`, `RABBITMQ_PORT`,
  `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`.
- **Cold start.** Une instance qui s'endort (plans économiques) répond en ~50 s au premier appel.
- **Première fois.** Un déploiement multi-services demande souvent 1–2 ajustements en
  direct (mémoire, CORS, base). Les logs Render de chaque service indiquent la cause.

---

## Variante démonstration (gratuite, sans backend)

Pour publier uniquement le front sur fixtures : déploie le seul service `cnpm-web` en
mettant sa variable `CNPM_DATA_MODE` à **`demo`** (le script
[`make-runtime-config.mjs`](make-runtime-config.mjs) bascule alors le `baseUrl` sur `/v1`
sans appeler de backend).
