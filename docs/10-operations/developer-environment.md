# Environnement développeur

## Prérequis
JDK 25, Maven 3.9+, Node 24.15.0 (ou version explicitement admise par `web/package.json`), npm 10.9.2+, Flutter 3.44, Docker/Podman, Git et un éditeur UTF-8.

## Démarrage
1. Copier `.env.example` vers `.env` et utiliser uniquement des secrets locaux.
2. Lancer `docker compose --env-file .env -f infrastructure/docker/compose.yaml up -d`.
3. Exécuter les migrations Flyway.
4. Démarrer le backend, puis le Web et le mobile.
5. Exécuter `bash scripts/validate-pack.sh` avant toute pull request.
