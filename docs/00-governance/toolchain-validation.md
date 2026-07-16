# Validation de la chaîne d’outillage

## Baseline cible et contrôles exécutés

| Composant | Baseline du dépôt | Résultat dans l’environnement de consolidation |
|---|---:|---|
| Java | 25 LTS | Java 21 disponible seulement ; compilation backend non exécutée localement |
| Maven | 3.9+ | Non installé ; validation prévue par la CI Maven/Java 25 |
| Node.js | 24.15.0 | Exécuté via environnement isolé Node 24.15.0 |
| npm | 10.9.2 | `npm ci` réussi, 557 paquets installés |
| Angular | 22.x | lint réussi, 2 tests unitaires réussis, build de production réussi |
| Flutter | 3.44.0 | Non installé ; runners natifs, analyse et tests à exécuter en R0 |
| Python | 3.12+ | Python 3.13 disponible ; validateurs du dépôt exécutés |
| Docker/Compose | version maintenue | Docker absent ; YAML analysé, démarrage local à exécuter sur la machine de développement |

## Validation Web exécutée

```text
Node.js : v24.15.0
npm : 10.9.2
npm ci : réussi
eslint : réussi
Vitest/Angular : 1 fichier, 2 tests réussis
Angular production build : réussi
Bundle initial : 197,62 kB brut, 54,85 kB estimé transféré
```

`npm audit` signale une vulnérabilité **faible** dans une dépendance transitive de développement d’esbuild utilisée par Vite. Elle concerne le serveur de développement Windows, aucune correction compatible n’était résolue automatiquement au moment de la consolidation, et elle n’affecte pas le bundle de production généré. La CI bloque les vulnérabilités élevées et critiques ; cette dépendance doit être réévaluée à chaque mise à jour Angular/Vite.

## Conséquences

- La structure du dépôt et le socle Web sont validés.
- Les tests backend doivent être exécutés avec Java 25/Maven 3.9, localement ou dans GitLab CI.
- Les runners Android/iOS et `pubspec.lock` doivent être générés avec Flutter 3.44.0 pendant R0.
- Le `docker compose config` et le démarrage des services doivent être exécutés sur un poste disposant de Docker.
- Aucun contrôle non exécuté n’est présenté comme réussi.
