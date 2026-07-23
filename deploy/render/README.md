# Déploiement Render — CNPM Digital Platform

Deux profils de déploiement :

| Fichier | Ce qu'il déploie | Coût | Quand |
|---|---|---|---|
| [`render.yaml`](../../render.yaml) (par défaut) | **Site statique, mode démo** — tous les écrans sur fixtures, sans backend | Gratuit | Démo / vitrine accessible à un domaine |
| [`render.full-stack.yaml`](render.full-stack.yaml) | PostgreSQL + API Spring Boot + front (mode http) | Payant | Backend réel |

## Ce que je peux / ne peux pas faire

Je prépare la **configuration**. Je **ne peux pas** créer ton compte Render, autoriser
Render↔GitHub, cliquer « Apply », ajouter le domaine ni modifier ton DNS — ce sont tes
actions. La config ci-dessous rend ta part minimale.

---

## 1) Déployer (site statique démo)

1. Render → **New +** → **Blueprint**.
2. Connecte le dépôt **`romialfred/CNPM`**, branche **`main`**.
3. Render lit `render.yaml` → un seul service **`cnpm-web`** (site statique gratuit).
4. **Apply** → build (`npm ci && npm run build`) puis publication.
5. À la fin : `https://cnpm-web.onrender.com` (l'URL Render par défaut).

Le site est en **mode démo** : connexion avec n'importe quels identifiants + code `123456`,
et tous les modules fonctionnent (répertoire, cotisations, paiement, etc.).

---

## 2) Brancher le domaine `cnmp.data-univers.com`

**a. Côté Render** — service `cnpm-web` → **Settings → Custom Domains → Add Custom Domain**
→ saisis `cnmp.data-univers.com`. Render affiche alors **la valeur DNS exacte à créer**
(un enregistrement CNAME) et vérifiera le domaine.

**b. Côté DNS** (chez ton registrar / hébergeur de `data-univers.com`) — crée **un seul
enregistrement CNAME** :

| Champ | Valeur |
|---|---|
| **Type** | `CNAME` |
| **Nom / Host** | `cnmp` *(juste le sous-domaine ; la zone `data-univers.com` est ajoutée automatiquement)* |
| **Valeur / Cible** | **la cible affichée par Render** — en général `cnpm-web.onrender.com` |
| **TTL** | défaut (Auto / 3600) |
| **Proxy (Cloudflare)** | **désactivé** (DNS only / nuage gris) le temps de la validation |

- Si un ancien enregistrement `cnmp` existe déjà (A ou CNAME), **remplace-le** par ce CNAME.
- **HTTPS** : Render émet le certificat TLS (Let's Encrypt) automatiquement une fois le
  CNAME propagé — rien à faire.
- Propagation : quelques minutes à ~1 h.

> ⚠️ Orthographe : tu as écrit **`cnmp`** (et non `cnpm`). Utilise exactement le
> sous-domaine que tu as créé — le CNAME doit porter le même libellé.

---

## Variante backend réel

Pour PostgreSQL + API : dans Render, crée le Blueprint à partir de
`deploy/render/render.full-stack.yaml` (renomme-le `render.yaml` ou pointe-le), puis
renseigne les secrets. Voir les limites (mémoire, version PG, RabbitMQ) plus bas.

### Points à connaître (full-stack)

- **Coût** : base free (~90 j), backend `starter` (payant), front gratuit.
- **Mémoire** : si le backend OOM au démarrage, passe `cnpm-backend` en `plan: standard`.
- **PostgreSQL 16** (Render n'a pas PG18 ; migrations compatibles).
- **RabbitMQ** : non managé sur Render ; l'app démarre sans broker (événements différés),
  brancher un CloudAMQP gratuit via les variables `RABBITMQ_*`.
- **CORS** : ajuste `CNPM_WEB_CORS_ALLOWED_ORIGINS` si le front reçoit un autre sous-domaine.
