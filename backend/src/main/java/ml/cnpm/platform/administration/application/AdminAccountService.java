package ml.cnpm.platform.administration.application;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.administration.application.port.out.AdminAccountRepository;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Écritures sur les comptes de la plateforme : création, suspension, réactivation et
 * réinitialisation du second facteur.
 *
 * <p>L'autorisation est portée ici, au service applicatif (ADR-008), et refusée par
 * défaut. Les droits requis sont ceux déjà semés dans
 * {@code V3__seed_roles_permissions_and_references.sql} : {@code IAM.USER.WRITE} pour la
 * vie du compte, {@code IAM.ROLE.ASSIGN} en plus à la création puisqu'elle attribue un
 * rôle, {@code IAM.MFA.RESET} pour le second facteur. Aucune de ces permissions n'est
 * inventée pour l'occasion.
 *
 * <p>Chaque opération est transactionnelle et produit son événement d'audit dans la même
 * transaction : l'action et sa trace sont validées ou annulées ensemble. Aucun secret n'y
 * transite — ni mot de passe, ni secret TOTP, ni code de secours, ni le motif complet
 * au-delà de son empreinte.
 */
@Service
public class AdminAccountService {

    private static final String ENTITY_TYPE = "iam.user_account";
    private static final String ACTION_CREATED = "USER_ACCOUNT.CREATED";
    private static final String ACTION_SUSPENDED = "USER_ACCOUNT.SUSPENDED";
    private static final String ACTION_REACTIVATED = "USER_ACCOUNT.REACTIVATED";
    private static final String ACTION_MFA_RESET = "USER_ACCOUNT.MFA_RESET";
    private static final String ACTION_DELETED = "USER_ACCOUNT.DELETED";

    static final String STATUS_ACTIVE = "ACTIVE";
    static final String STATUS_SUSPENDED = "SUSPENDED";

    private final AdminAccountRepository repository;
    private final AuditRecorder auditRecorder;

    AdminAccountService(AdminAccountRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Crée un compte, ou renvoie l'existant si un compte strictement identique porte déjà
     * cette adresse.
     *
     * <p>L'idempotence s'appuie sur l'identité métier — l'adresse de connexion, unique en
     * base — et non sur la seule clé d'en-tête : c'est elle qui empêche réellement le
     * doublon, y compris si le client change de clé entre deux tentatives. Un rejeu à
     * contenu divergent est un conflit, pas une mise à jour silencieuse.
     *
     * @throws StateConflictException si l'adresse est déjà prise par un compte différent,
     *     si le rôle est inconnu, ou si le lien à une adhésion contredit le type de compte
     */
    @PreAuthorize(
            "hasAuthority('PERM_IAM.USER.WRITE') and hasAuthority('PERM_IAM.ROLE.ASSIGN')")
    @Transactional
    public AdminAccountCreation create(
            AdminAccountDraft draft, UUID actorUserId, UUID correlationId) {
        requireConsistentMemberLink(draft);

        Optional<AdminSecurityView.Account> existing = repository.findByEmail(draft.normalizedEmail());
        if (existing.isPresent()) {
            if (sameContent(existing.get(), draft)) {
                return new AdminAccountCreation(existing.get(), false);
            }
            throw new StateConflictException(
                    "Un compte existe déjà pour cette adresse de connexion.");
        }

        if (!repository.roleExists(draft.roleId())) {
            throw new StateConflictException("Le rôle demandé n’existe pas.");
        }

        AdminSecurityView.Account created = repository.create(draft, actorUserId);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_CREATED,
                        ENTITY_TYPE,
                        UUID.fromString(created.id()),
                        fingerprint(created),
                        correlationId));
        return new AdminAccountCreation(created, true);
    }

    /**
     * Suspend ou réactive un compte.
     *
     * <p>Un opérateur ne peut pas suspendre son propre compte : la sanction se prononce sur
     * autrui, et s'auto-exclure priverait la plateforme de l'administrateur au moment même
     * où il agit.
     *
     * @param reason motif obligatoire ; seule son empreinte rejoint le journal
     * @throws ResourceNotFoundException si aucun compte ne porte cet identifiant
     * @throws StateConflictException si le compte est déjà dans cet état, ou si l'acteur se
     *     vise lui-même
     */
    @PreAuthorize("hasAuthority('PERM_IAM.USER.WRITE')")
    @Transactional
    public AdminSecurityView.Account changeStatus(
            UUID accountId, String status, String reason, UUID actorUserId, UUID correlationId) {
        if (!STATUS_ACTIVE.equals(status) && !STATUS_SUSPENDED.equals(status)) {
            throw new StateConflictException("État de compte non pris en charge.");
        }
        AdminSecurityView.Account account = require(accountId);

        if (STATUS_SUSPENDED.equals(status) && accountId.equals(actorUserId)) {
            throw new StateConflictException("Un opérateur ne peut pas suspendre son propre compte.");
        }
        boolean alreadySuspended = STATUS_SUSPENDED.equals(account.status());
        if (alreadySuspended == STATUS_SUSPENDED.equals(status)) {
            // Rejouer une suspension déjà appliquée ne change rien : on renvoie l'état courant
            // sans produire un audit dont l'empreinte avant serait égale à l'empreinte après.
            return account;
        }

        String before = fingerprint(account);
        AdminSecurityView.Account updated = repository.updateStatus(accountId, status, actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        STATUS_SUSPENDED.equals(status) ? ACTION_SUSPENDED : ACTION_REACTIVATED,
                        ENTITY_TYPE,
                        accountId,
                        before,
                        fingerprintWithReason(updated, reason),
                        correlationId));
        return updated;
    }

    /**
     * Efface le second facteur d'un compte : à sa prochaine connexion, son titulaire
     * ré-enrôle une application d'authentification.
     *
     * @throws ResourceNotFoundException si aucun compte ne porte cet identifiant
     */
    @PreAuthorize("hasAuthority('PERM_IAM.MFA.RESET')")
    @Transactional
    public AdminSecurityView.Account resetTwoFactor(
            UUID accountId, String reason, UUID actorUserId, UUID correlationId) {
        AdminSecurityView.Account account = require(accountId);
        String before = fingerprint(account);

        AdminSecurityView.Account updated = repository.resetTwoFactor(accountId, actorUserId);
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_MFA_RESET,
                        ENTITY_TYPE,
                        accountId,
                        before,
                        fingerprintWithReason(updated, reason),
                        correlationId));
        return updated;
    }

    /**
     * Supprime définitivement un compte.
     *
     * <p>Un opérateur ne peut pas supprimer son propre compte : se retirer soi-même de la
     * plateforme au cours de l'action serait aussi dangereux que se suspendre. La trace
     * d'audit est écrite AVANT la suppression, dans la même transaction — après, l'entité
     * n'existe plus, mais l'événement, lui, subsiste (le journal est en ajout seul).
     *
     * @throws ResourceNotFoundException si aucun compte ne porte cet identifiant
     * @throws StateConflictException si l'acteur se vise lui-même
     */
    @PreAuthorize("hasAuthority('PERM_IAM.USER.WRITE')")
    @Transactional
    public void delete(UUID accountId, String reason, UUID actorUserId, UUID correlationId) {
        AdminSecurityView.Account account = require(accountId);
        if (accountId.equals(actorUserId)) {
            throw new StateConflictException("Un opérateur ne peut pas supprimer son propre compte.");
        }
        auditRecorder.record(
                new AuditEntry(
                        "USER",
                        actorUserId,
                        ACTION_DELETED,
                        ENTITY_TYPE,
                        accountId,
                        fingerprint(account),
                        fingerprintWithReason(account, reason),
                        correlationId));
        repository.delete(accountId);
    }

    private AdminSecurityView.Account require(UUID accountId) {
        return repository
                .findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Compte introuvable."));
    }

    /** Un compte MEMBRE désigne une adhésion ; un compte PROFESSIONNEL n'en désigne aucune. */
    private static void requireConsistentMemberLink(AdminAccountDraft draft) {
        boolean member = AdminAccountDraft.TYPE_MEMBER.equals(draft.accountType());
        if (member && draft.memberId() == null) {
            throw new StateConflictException("Un compte membre doit désigner une adhésion.");
        }
        if (!member && draft.memberId() != null) {
            throw new StateConflictException("Un compte professionnel ne se rattache pas à une adhésion.");
        }
    }

    /**
     * Le rejeu est « identique » si l'identité, le type et le profil coïncident. Le rôle
     * n'entre pas dans la comparaison : le compte existant peut avoir reçu d'autres rôles
     * depuis sa création, et exiger l'égalité ferait échouer un rejeu légitime.
     */
    private static boolean sameContent(AdminSecurityView.Account existing, AdminAccountDraft draft) {
        return Objects.equals(existing.fullName(), draft.displayName())
                && Objects.equals(existing.accountType(), draft.accountType())
                && Objects.equals(existing.phone(), trimmedOrNull(draft.phone()))
                && Objects.equals(existing.jobTitle(), trimmedOrNull(draft.jobTitle()))
                && Objects.equals(existing.organization(), trimmedOrNull(draft.organization()))
                && Objects.equals(existing.department(), trimmedOrNull(draft.department()));
    }

    private static String trimmedOrNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * Empreinte de l'état du compte pour le journal. Elle porte ce qui identifie et
     * qualifie le compte, jamais un secret.
     */
    private static String fingerprint(AdminSecurityView.Account account) {
        return Hashing.sha256Hex(
                String.join(
                        "|",
                        account.id(),
                        account.email(),
                        account.fullName(),
                        String.valueOf(account.accountType()),
                        account.status(),
                        account.twoFactor(),
                        account.roleId()));
    }

    /**
     * Empreinte de l'état d'arrivée, liée au motif invoqué.
     *
     * <p>Le motif lui-même n'est pas journalisé en clair : l'empreinte prouve qu'un motif
     * donné accompagnait l'action sans exposer un texte pouvant nommer des tiers.
     */
    private static String fingerprintWithReason(AdminSecurityView.Account account, String reason) {
        return Hashing.sha256Hex(fingerprint(account) + "|" + reason.trim());
    }
}
