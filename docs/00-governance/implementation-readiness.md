# État de préparation à l’implémentation

## Prêt pour démarrer

- sources métier et spécifications fonctionnelles ;
- DCTD, architecture modulaire et stack cible ;
- modèle PostgreSQL, dictionnaire et migrations initiales ;
- OpenAPI/AsyncAPI, conventions et catalogue d’erreurs ;
- RBAC, 2FA, séparation des tâches et modèle de menaces ;
- backlog, traçabilité et catalogue de recette ;
- BPMN, intégrations, sauvegarde, PRA et réversibilité ;
- handoff UI/UX consolidé avec tokens, composants, écrans, actifs et tests ;
- exigences, modèle et addendum API de la vitrine publique des membres ;
- configuration Claude Code/Codex, garde-fous et validation du dépôt ;
- socle Angular validé sous Node 24.15.0 par installation déterministe, lint, tests unitaires et build de production.

## Travaux de release R0 à exécuter

- confirmer les versions majeures après un prototype de compatibilité complet ;
- compiler et tester le backend sous Java 25/Maven 3.9 ;
- générer les runners Flutter Android/iOS et `pubspec.lock`, puis exécuter analyse et tests ;
- configurer les clients OpenAPI et OIDC/PKCE ;
- compléter les modules backend au-delà du squelette ;
- activer les tests Playwright/axe contre les premiers écrans réels ;
- ajouter Storybook uniquement après validation d’une version compatible Angular 22/TypeScript 6 sans contournement ;
- promouvoir le modèle/API/RBAC du module vitrine dans les contrats canoniques au démarrage de R4 ;
- installer les actifs officiels approuvés, notamment le SVG du logo et la photothèque ;
- fermer les décisions bloquantes de la release visée.

## Blocages fonctionnels connus

Les paiements, reçus officiels, barèmes, primes, partage de revenus, modération publique, partenaires de communication et hébergement ne doivent pas être finalisés avant les décisions correspondantes dans `open-decisions.md`.

## Conclusion

Le dépôt est prêt pour lancer R0, le design system, les écrans pilotes et les modules non bloqués. Il constitue une baseline d’implémentation structurée, pas une application métier achevée ni un environnement de production déjà configuré.
