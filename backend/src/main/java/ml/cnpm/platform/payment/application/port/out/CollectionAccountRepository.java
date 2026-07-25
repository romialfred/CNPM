package ml.cnpm.platform.payment.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.payment.application.CollectionAccountDraft;
import ml.cnpm.platform.payment.application.CollectionAccountView;

/**
 * Port sortant de persistance des comptes d'encaissement, sur le schéma {@code payment}.
 *
 * <p>Le domaine ignore PostgreSQL : il ne connaît que ce contrat. Toutes les lectures rendent
 * la même projection {@link CollectionAccountView.Account} pour que l'écran reste cohérent
 * entre une écriture et un rechargement.
 */
public interface CollectionAccountRepository {

    List<CollectionAccountView.Account> findAll();

    Optional<CollectionAccountView.Account> findById(UUID id);

    /** Vrai si un compte porte déjà ce numéro sur ce canal : sert l'idempotence de la création. */
    boolean existsByChannelAndIdentifier(String channel, String identifier);

    /** Créateur d'un compte, pour opposer la séparation des tâches à la validation. */
    Optional<UUID> creatorOf(UUID id);

    CollectionAccountView.Account create(CollectionAccountDraft draft, UUID actorUserId);

    CollectionAccountView.Account approve(UUID id, UUID actorUserId);

    CollectionAccountView.Account disable(UUID id, UUID actorUserId);
}
