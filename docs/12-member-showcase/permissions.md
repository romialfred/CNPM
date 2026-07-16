# Permissions et séparation des tâches — vitrine membre

| Permission | Description |
|---|---|
| `SHOWCASE.PUBLIC.READ` | Consulter une vitrine publiée |
| `SHOWCASE.OWN.READ` | Consulter la vitrine et les révisions de son organisation |
| `SHOWCASE.OWN.WRITE` | Modifier un brouillon de son organisation |
| `SHOWCASE.OWN.SUBMIT` | Soumettre une révision à modération |
| `SHOWCASE.OWN.ANALYTICS.READ` | Consulter les statistiques agrégées de sa vitrine |
| `SHOWCASE.MODERATION.READ` | Consulter la file de modération |
| `SHOWCASE.MODERATION.DECIDE` | Approuver, rejeter ou demander une correction |
| `SHOWCASE.PUBLISH` | Publier ou planifier une version approuvée |
| `SHOWCASE.SUSPEND` | Suspendre une vitrine publique |
| `SHOWCASE.ADMIN` | Paramétrer les règles globales sans s’auto-attribuer les autres permissions |

## Séparation des tâches

- Le soumissionnaire ne peut pas décider sur sa soumission.
- Le modérateur ne peut pas modifier le contenu membre pendant la décision.
- La suspension urgente est autorisée à un rôle habilité, auditée et revue a posteriori.
- Le badge vérifié est attribué par une règle ou un rôle CNPM distinct de l’éditeur membre.
- La suppression physique est interdite ; utiliser dépublication, suspension et rétention approuvée.
