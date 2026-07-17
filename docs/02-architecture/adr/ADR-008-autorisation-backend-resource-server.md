# ADR - Application de l'autorisation côté backend (resource server)

- **Statut** : Proposée
- **Date** : 2026-07-17

## Contexte

ADR-003 centralise l'identité dans Keycloak (OIDC/OAuth 2.0, 2FA). Il restait à
décider **comment le monolithe applique l'autorisation** à la réception d'un
jeton. `docs/05-security/security-architecture.md` impose le refus par défaut, un
contrôle serveur sur chaque cas d'usage et des erreurs normalisées ; l'interface
n'est jamais une frontière de sécurité.

## Décision

1. **Refus par défaut** : une unique `SecurityFilterChain` exige un jeton valide
   sur toute route, sauf une liste blanche étroite (sondes actuator de santé/info,
   métriques Prometheus, vérification publique d'un reçu par jeton opaque).
2. **API sans état** : sessions désactivées (`STATELESS`), le jeton est porté à
   chaque appel. CSRF désactivé — correct pour une API consommée par jeton porteur
   et non par cookie de session.
3. **Rôles Keycloak → autorités Spring** : les rôles de realm (`realm_access.roles`)
   deviennent des autorités préfixées `ROLE_`. Aucune autorité n'est dérivée d'un
   profil technique ; un jeton sans rôle n'obtient aucune autorité.
4. **Autorisation fine par cas d'usage** : `@EnableMethodSecurity` active
   `@PreAuthorize` sur les services applicatifs. Les contrôleurs ne portent aucune
   règle métier ni décision d'autorisation implicite.
5. **Erreurs normalisées** : 401 (`AUTHENTICATION_REQUIRED`) et 403 (`FORBIDDEN`)
   sont rendues au format `Problem` du contrat avec un `correlationId`, sans trace
   ni détail technique.

## Justification

Le refus par défaut et la vérification serveur systématique sont exigés par les
sources de sécurité. Le mapping des rôles de realm est le point d'intégration
minimal avec Keycloak ; il est isolé dans un convertisseur testé unitairement pour
ses cas limites (revendication absente ou malformée → aucune autorité).

## Portée et limites (à ce stade)

- La validation cryptographique du jeton (signature, émetteur) repose sur
  `issuer-uri`. **La validation d'audience** dispose d'un mécanisme prêt
  (`AudienceValidator` + `JwtValidationConfig`), **activé dès que
  `cnpm.security.jwt.expected-audiences` est renseigné** — ce qui suppose le client
  Keycloak provisionné. Tant que la propriété est absente, l'audience n'est pas
  vérifiée : cet état transitoire doit être clos avant toute connexion à un
  Keycloak réel.
- **Aucun test d'intégration Keycloak** n'existe : la validation signature/émetteur/
  audience n'est pas exercée de bout en bout (seul `AudienceValidator` est testé
  unitairement). À ajouter via un Testcontainers Keycloak.
- **Le step-up / MFA** exigé pour les opérations sensibles (export massif,
  validation financière, administration IAM) **n'est pas encore implémenté**.
- Le **périmètre organisation/groupement** (ABAC) n'est pas encore appliqué : seul
  le RBAC par rôle l'est.
- **Audit des refus** : un refus d'autorisation **403** est désormais tracé. Le
  gestionnaire `accessDeniedHandler` de `SecurityConfig` écrit un événement
  `AUTHORIZATION_DENIED` (sévérité `WARNING`) dans `audit.security_event` via
  `SecurityEventRecorder`, en best-effort — une panne d'audit ne masque pas le refus.
  Le chemin de **succès** d'une action sensible est audité transactionnellement
  (`audit.audit_event`). Le **401 anonyme n'est volontairement pas audité** (volume
  élevé, signal faible : une requête sans jeton n'identifie personne). Enrichissements
  restants : adresse source (`inet`) et corrélation dans l'événement de sécurité.
- `/actuator/prometheus` **n'est pas public** : il exige une authentification. La
  collecte de métriques passera par un accès authentifié ou un port de gestion isolé
  par politique réseau.
- Ces limites sont suivies dans `docs/00-governance/quality-scorecard.md` et ne
  doivent pas être présentées comme résolues.

## Conséquences

- Tout nouvel endpoint est protégé par défaut ; l'ouvrir au public est un acte
  explicite et revu.
- Chaque cas d'usage sensible devra porter son `@PreAuthorize` et un test négatif
  d'autorisation (rôle insuffisant → 403), en plus du test d'authentification.
- Toute exception à ces règles requiert un nouvel ADR approuvé.
