package ml.cnpm.platform.payment.application;

import java.util.List;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.payment.application.port.out.CollectionAccountRepository;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Écritures et lectures des comptes d'encaissement de la CNPM.
 *
 * <p>Ce service porte la souveraineté exigée par le TDR : une coordonnée d'encaissement n'est
 * diffusable qu'après validation par un SECOND agent. La création dépose donc un brouillon,
 * et la validation — qui le rend diffusable — est refusée à son propre auteur (séparation des
 * tâches). Ces règles sont vérifiées côté serveur, jamais déléguées à l'écran.
 *
 * <p>L'autorisation est portée ici (ADR-008), refusée par défaut, sur des permissions déjà
 * semées dans {@code V3} : {@code ADMIN.PARAMETER.READ} pour lire, {@code ADMIN.PARAMETER.WRITE}
 * pour créer ou retirer un compte, {@code ADMIN.REFERENTIAL.APPROVE} pour valider sa diffusion
 * — une donnée de référence sensible. Aucune permission n'est inventée.
 *
 * <p>Chaque opération est transactionnelle et produit son audit dans la même transaction ;
 * aucun secret n'y transite — le numéro d'encaissement n'en est pas un, mais seule son
 * empreinte rejoint le journal, avec l'état du compte.
 */
@Service
public class CollectionAccountService {

    private static final String ENTITY_TYPE = "payment.collection_account";
    private static final String ACTION_CREATED = "COLLECTION_ACCOUNT.CREATED";
    private static final String ACTION_APPROVED = "COLLECTION_ACCOUNT.APPROVED";
    private static final String ACTION_DISABLED = "COLLECTION_ACCOUNT.DISABLED";

    static final String STATUS_DRAFT = "DRAFT";
    static final String STATUS_ACTIVE = "ACTIVE";

    private final CollectionAccountRepository repository;
    private final AuditRecorder auditRecorder;

    CollectionAccountService(CollectionAccountRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    @PreAuthorize("hasAuthority('PERM_ADMIN.PARAMETER.READ')")
    @Transactional(readOnly = true)
    public CollectionAccountView.CollectionAccountList list() {
        return new CollectionAccountView.CollectionAccountList(repository.findAll());
    }

    /**
     * Enregistre un compte d'encaissement en brouillon.
     *
     * <p>Un compte naît toujours 'DRAFT' : il n'est pas encore diffusable. Deux comptes ne
     * peuvent porter le même numéro sur le même canal — cette clé naturelle empêche le
     * doublon, y compris entre deux tentatives concurrentes.
     *
     * @throws StateConflictException si le canal est inconnu, si le nom de la banque manque
     *     pour un virement, ou si ce numéro existe déjà sur ce canal
     */
    @PreAuthorize("hasAuthority('PERM_ADMIN.PARAMETER.WRITE')")
    @Transactional
    public CollectionAccountView.Account create(
            CollectionAccountDraft draft, UUID actorUserId, UUID correlationId) {
        if (!CollectionAccountDraft.CHANNELS.contains(draft.channel())) {
            throw new StateConflictException("Canal d’encaissement non pris en charge.");
        }
        if (draft.isBankTransfer() && draft.bankName() == null) {
            throw new StateConflictException("Le nom de la banque est requis pour un virement.");
        }
        if (repository.existsByChannelAndIdentifier(draft.channel(), draft.accountIdentifier())) {
            throw new StateConflictException("Ce compte d’encaissement existe déjà pour ce canal.");
        }

        CollectionAccountView.Account created = repository.create(draft, actorUserId);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_CREATED,
                        ENTITY_TYPE,
                        UUID.fromString(created.id()),
                        fingerprint(created),
                        correlationId));
        return created;
    }

    /**
     * Valide un compte d'encaissement : il devient 'ACTIVE' et donc diffusable au paiement.
     *
     * <p>Un agent ne peut pas valider un compte qu'il a lui-même créé — c'est le garde-fou du
     * TDR sur la diffusion des coordonnées, matérialisé par la séparation des tâches.
     *
     * @throws ResourceNotFoundException si aucun compte ne porte cet identifiant
     * @throws StateConflictException si le compte n'est pas en brouillon, ou si l'acteur en est
     *     l'auteur
     */
    @PreAuthorize("hasAuthority('PERM_ADMIN.REFERENTIAL.APPROVE')")
    @Transactional
    public CollectionAccountView.Account approve(
            UUID accountId, UUID actorUserId, UUID correlationId) {
        CollectionAccountView.Account account = require(accountId);
        if (!STATUS_DRAFT.equals(account.status())) {
            throw new StateConflictException("Seul un compte en brouillon peut être validé.");
        }
        UUID creator =
                repository
                        .creatorOf(accountId)
                        .orElseThrow(
                                () ->
                                        new StateConflictException(
                                                "Auteur du compte inconnu : validation impossible."));
        if (creator.equals(actorUserId)) {
            throw new StateConflictException(
                    "La validation doit être prononcée par un autre agent que l’auteur.");
        }

        String before = fingerprint(account);
        CollectionAccountView.Account approved = repository.approve(accountId, actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_APPROVED,
                        ENTITY_TYPE,
                        accountId,
                        before,
                        fingerprint(approved),
                        correlationId));
        return approved;
    }

    /**
     * Retire un compte de la diffusion : il passe 'DISABLED' et ne sera plus proposé au paiement.
     *
     * @param reason motif obligatoire ; seule son empreinte rejoint le journal
     * @throws ResourceNotFoundException si aucun compte ne porte cet identifiant
     * @throws StateConflictException si le compte n'est pas actif
     */
    @PreAuthorize("hasAuthority('PERM_ADMIN.PARAMETER.WRITE')")
    @Transactional
    public CollectionAccountView.Account disable(
            UUID accountId, String reason, UUID actorUserId, UUID correlationId) {
        CollectionAccountView.Account account = require(accountId);
        if (!STATUS_ACTIVE.equals(account.status())) {
            throw new StateConflictException("Seul un compte actif peut être désactivé.");
        }

        String before = fingerprint(account);
        CollectionAccountView.Account disabled = repository.disable(accountId, actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_DISABLED,
                        ENTITY_TYPE,
                        accountId,
                        before,
                        fingerprintWithReason(disabled, reason),
                        correlationId));
        return disabled;
    }

    private CollectionAccountView.Account require(UUID accountId) {
        return repository
                .findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Compte d’encaissement introuvable."));
    }

    /** Empreinte de l'état du compte pour le journal : ce qui l'identifie et le qualifie. */
    private static String fingerprint(CollectionAccountView.Account account) {
        return Hashing.sha256Hex(
                String.join(
                        "|",
                        account.id(),
                        account.channel(),
                        account.label(),
                        account.accountIdentifier(),
                        account.status()));
    }

    private static String fingerprintWithReason(CollectionAccountView.Account account, String reason) {
        return Hashing.sha256Hex(fingerprint(account) + "|" + reason.trim());
    }
}
