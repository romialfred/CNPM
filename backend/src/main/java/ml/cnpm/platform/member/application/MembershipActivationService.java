package ml.cnpm.platform.member.application;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.member.application.port.out.MembershipActivationRepository;
import ml.cnpm.platform.member.domain.Membership;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * API applicative du module MEMBER : activation d'un membre.
 *
 * <p>C'est le point d'entrée que le module ENROLLMENT appelle à l'approbation d'un dossier —
 * un module ne lit ni n'écrit les tables d'un autre ({@code modules.md}), il passe par cette
 * API. L'opération n'est pas exposée en HTTP : elle n'a de sens que comme conséquence d'une
 * approbation, d'où l'exigence de la permission {@code ENROLLMENT.APPROVE} plutôt que d'une
 * permission MEMBER — activer un membre hors décision d'enrôlement n'est pas un cas d'usage.
 *
 * <p><strong>RG-002 appliquée</strong> : « une entreprise ne peut disposer que d'un compte
 * membre actif par personnalité juridique » — une seconde activation est refusée en conflit.
 *
 * <p><strong>Périmètre assumé (ENR-DEC-001).</strong> La catégorie de cotisation et le numéro
 * d'adhésion sont <em>fournis</em> par l'opérateur qui décide, non calculés : la règle de
 * catégorisation dépend du barème (DEC-008, ouverte) et le format du numéro n'est fixé par
 * aucune source. L'automatisation ultérieure remplacera la saisie sans rupture de contrat.
 */
@Service
public class MembershipActivationService implements ml.cnpm.platform.member.MemberActivation {

    private static final String ENTITY_TYPE = "member.membership";
    private static final String ACTION_ACTIVATED = "MEMBERSHIP.ACTIVATED";

    private final MembershipActivationRepository repository;
    private final AuditRecorder auditRecorder;

    public MembershipActivationService(
            MembershipActivationRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Active un membre : crée son adhésion au statut actif et consigne la transition initiale.
     *
     * <p>Idempotent par clé naturelle (numéro d'adhésion) : un rejeu strictement identique
     * renvoie l'adhésion existante sans second effet ni second audit.
     *
     * @throws StateConflictException si l'entreprise a déjà une adhésion active (RG-002), ou si
     *     le numéro d'adhésion est déjà pris par une adhésion différente
     */
    @Override
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.APPROVE')")
    @Transactional
    public UUID activate(
            UUID organizationId,
            String membershipNumber,
            String categoryCode,
            String reason,
            UUID actorUserId,
            UUID correlationId) {
        Optional<Membership> existing = repository.findByMembershipNumber(membershipNumber);
        if (existing.isPresent()) {
            Membership found = existing.get();
            if (found.organizationId().equals(organizationId)
                    && found.categoryCode().equals(categoryCode)) {
                return found.id();
            }
            throw new StateConflictException(
                    "Une adhésion différente porte déjà ce numéro d'adhésion.");
        }
        if (repository.hasActiveMembership(organizationId)) {
            throw new StateConflictException(
                    "Cette entreprise dispose déjà d'un compte membre actif (RG-002).");
        }

        Membership activated =
                repository.activate(organizationId, membershipNumber, categoryCode, reason, actorUserId);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId,
                        ACTION_ACTIVATED,
                        ENTITY_TYPE,
                        activated.id(),
                        fingerprint(activated),
                        correlationId));
        return activated.id();
    }

    /** Empreinte SHA-256 de l'adhésion activée, pour l'audit. */
    private static String fingerprint(Membership value) {
        String canonical =
                "membershipNumber=" + value.membershipNumber()
                        + ";organizationId=" + value.organizationId()
                        + ";categoryCode=" + value.categoryCode()
                        + ";status=" + value.status();
        return Hashing.sha256Hex(canonical);
    }
}
