# Migration V10 — garde du cycle de livraison outbox

## Objectif

La migration `V10__allow_guarded_outbox_delivery_updates.sql` corrige la protection introduite en V4 : l'enveloppe d'un événement reste append-only, tandis que le publisher peut modifier `status`, `available_at` et `published_at` avant publication.

`PUBLISHED` est terminal. Une contrainte permanente impose l'équivalence entre ce statut et la présence de `published_at`. Une ligne publiée, son horodatage et son enveloppe ne peuvent plus être modifiés. `DELETE` et `TRUNCATE` restent interdits.

La migration ne définit volontairement pas d'autres états de livraison : leur vocabulaire et leur politique de reprise doivent être fixés dans le contrat du publisher avant son implémentation.

## Vérifications avant et après déploiement

1. Sauvegarder la base et vérifier la restauration selon `backup-restore.md`.
2. Arrêter tous les producteurs d'événements et tout publisher pendant la migration.
3. Vérifier l'absence de transaction longue sur `integration.outbox_event`. V10 acquiert un verrou `ACCESS EXCLUSIVE` et peut attendre tant qu'une transaction concurrente conserve un accès à la table.
4. Appliquer Flyway puis vérifier sans mutation, dans les catalogues PostgreSQL, la présence et l'activation du trigger `trg_append_only_integration_outbox_event`, de la fonction `integration.guard_outbox_event_delivery` et de la contrainte validée `ck_outbox_event_publication_metadata`.
5. Vérifier sans mutation que le trigger V5 `trg_truncate_guard_integration_outbox_event` est toujours actif.
6. Sur une base PostgreSQL éphémère ou un environnement de préproduction jetable uniquement, vérifier qu'une mise à jour du payload, un `DELETE`, un `TRUNCATE` et les deux formes d'insertion incohérente sont refusés, puis qu'une transition atomique vers `PUBLISHED` avec `published_at` réussit. Ces essais destructifs sont interdits sur les données de production, même dans une transaction supposée annulée.
7. En production, limiter la preuve post-déploiement aux contrôles non mutatifs des catalogues, à Flyway `validate` et à la supervision. Ne jamais tester une garde en tentant l'opération qu'elle doit interdire.
8. Redémarrer les producteurs puis le publisher et surveiller les erreurs SQL, la profondeur de file et l'âge du plus ancien événement `NEW`.

## Compatibilité des évolutions de schéma

Toute future colonne ajoutée à `integration.outbox_event` doit être classée explicitement comme champ d'enveloppe immuable ou métadonnée de livraison. La migration qui ajoute la colonne doit mettre à jour `integration.guard_outbox_event_delivery` et ses tests dans le même incrément; en l'absence de cette classification, l'évolution est refusée.

## Retour arrière

Il n'existe pas de migration descendante Flyway. Un retour à la garde V4 n'est sûr que si aucun publisher n'a encore modifié les métadonnées de livraison après V10.

1. Arrêter tous les writers et le publisher.
2. Prouver par le journal de déploiement et les contrôles d'activation que le publisher n'a jamais démarré depuis V10, puis vérifier qu'aucune ligne ne possède `status <> 'NEW'` ou `published_at IS NOT NULL`. Une requête SQL seule ne peut pas prouver que `available_at` n'a jamais été modifié : sans cette preuve opérationnelle, le retour à V4 est interdit.
3. Livrer une migration corrective qui supprime le trigger V10, recrée le trigger V4 avec `audit.reject_update_delete()` et supprime la fonction V10.
4. Si une métadonnée a déjà évolué, ne pas revenir à V4 : conserver les données et livrer une correction en avant.

La suppression ou la réécriture des événements existants n'est jamais une stratégie de retour arrière autorisée.
