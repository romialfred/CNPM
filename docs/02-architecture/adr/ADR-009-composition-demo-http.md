# ADR - Composition explicite des sources démo et HTTP

- **Statut** : Acceptée
- **Date** : 2026-07-18

## Contexte

Les maquettes validées doivent rester entièrement démontrables avec des données
fictives, alors que les contrats backend ne livrent pas encore tous les agrégats visuels.
Un repli automatique de l'API vers les fixtures masquerait une panne, pourrait faire
prendre des données fictives pour des données institutionnelles et rendrait les tests
d'intégration non probants.

## Décision

1. Le Web utilise une source globale `CNPM_DATA_MODE`, limitée à `http` ou `demo`.
2. La valeur par défaut est `http` (fermeture sûre). Le livrable de démonstration active
   `demo` explicitement au bootstrap.
3. Le mode ne peut pas être modifié par query string, `localStorage` ou `sessionStorage`.
4. Une erreur HTTP n'entraîne jamais un repli vers un adaptateur `Demo*Gateway`.
5. Les ports sont assemblés dans les routes ou un composition root, jamais dans les
   composants de présentation. Les adaptateurs HTTP restent compilés et testés en mode démo.
6. Les écrans signalent explicitement les données fictives lorsque le mode démo les
   expose.

## Conséquences

- La démonstration premium reste stable sans affaiblir la détection des erreurs réelles.
- Chaque tranche verticale remplace son adaptateur démo au même point d'assemblage.
- Un mode HTTP peut temporairement afficher un état indisponible pour un agrégat absent ;
  il ne fabrique jamais `0`, une liste vide ou un succès à partir des fixtures.
- La configuration de déploiement devra fournir le mode et la racine `/v1` sans exposer
  de sélecteur aux utilisateurs.

La configuration est lue depuis `/runtime-config.js`, actif statique remplaçable au
déploiement sans reconstruire les bundles. Le fichier versionné active explicitement
le profil de démonstration ; son absence ferme en mode HTTP.

En mode HTTP, tout port encore sans adaptateur contractuel renvoie une erreur de feature
indisponible. Cette règle vaut pour les routes publiques, membre et administration : un
parcours réel ne peut donc jamais ouvrir silencieusement un écran alimenté par fixtures.

AUTH suit la même règle. Tant que le client OIDC/PKCE Keycloak n'est pas livré, le
profil HTTP affiche une connexion indisponible ; il n'introduit ni Resource Owner
Password Grant ni relais natif de mot de passe vers le backend.

## Première application

BO-002 dispose du premier `HttpMembersGateway`. Le contrat R0 fournit l'identité,
l'entreprise, la catégorie, le groupement et le contact ; les montants, la dernière
activité, le marqueur grand cotisant, les facettes globales et la synthèse restent absents.
L'adaptateur les représente comme indisponibles et n'invente aucun agrégat en attendant la
décision ADR-006 et les contrats correspondants.

Le shell administrateur dispose aussi de `HttpSessionGateway` sur `GET /auth/me`. Les
champs que cette projection ne porte pas (exercice actif et compteur de notifications)
restent explicitement indisponibles ; ils ne reprennent jamais les valeurs de la persona
de démonstration en mode HTTP.
