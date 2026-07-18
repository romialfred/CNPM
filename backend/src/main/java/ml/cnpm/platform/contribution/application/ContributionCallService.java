package ml.cnpm.platform.contribution.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.contribution.application.port.out.ContributionCallRepository;
import ml.cnpm.platform.contribution.domain.ContributionCall;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service applicatif du module COTISATION : émission et consultation des appels.
 *
 * <p>Autorisation par permission ({@code permissions.csv}) : émettre exige
 * {@code CONTRIBUTION.GENERATE} (sensible, auditée), consulter {@code CONTRIBUTION.READ}.
 * L'émission est idempotente par clé naturelle (numéro d'appel) et produit un événement
 * d'audit corrélé dans la même transaction.
 *
 * <p><strong>Montant saisi, non calculé.</strong> Le barème de cotisation n'est fixé par
 * aucune source : ni le BRS, ni le TDR — ce dernier ne contient qu'un barème de
 * <em>rémunération du prestataire</em>, dont « les taux exacts seront négociés » (§V, §6.2).
 * L'agent saisit donc le montant, comme il choisit la catégorie (DEC-008, ENR-DEC-001). Le
 * calcul automatique par barème s'ajoutera sans rompre ce contrat : il remplacera une saisie,
 * il ne retirera aucune garde.
 *
 * <p>RG-004 : un appel émis n'est jamais supprimé ; son annulation ou son ajustement passera
 * par une écriture compensatrice (module d'ajustement, non livré ici).
 */
@Service
public class ContributionCallService {

    private static final String ENTITY_TYPE = "contribution.contribution_call";
    private static final String ACTION_ISSUED = "CONTRIBUTION_CALL.ISSUED";

    private final ContributionCallRepository repository;
    private final AuditRecorder auditRecorder;

    public ContributionCallService(
            ContributionCallRepository repository, AuditRecorder auditRecorder) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
    }

    /**
     * Émet un appel de cotisation, ou renvoie l'existant si un appel identique porte déjà le
     * même numéro.
     *
     * @throws StateConflictException si le numéro est déjà pris par un appel différent
     */
    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.GENERATE')")
    @Transactional
    public ContributionCallIssuance issue(
            ContributionCallDraft draft, UUID actorUserId, UUID correlationId) {
        Optional<ContributionCall> existing = repository.findByCallNumber(draft.callNumber());
        if (existing.isPresent()) {
            ContributionCall found = existing.get();
            if (found.membershipId().equals(draft.membershipId())
                    && found.amountDue().compareTo(draft.amountDue()) == 0
                    && found.fiscalYear() == draft.fiscalYear()) {
                return new ContributionCallIssuance(found, false);
            }
            throw new StateConflictException("Un appel différent porte déjà ce numéro.");
        }

        ContributionCall issued = repository.issue(draft);
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId, ACTION_ISSUED, ENTITY_TYPE, issued.id(), fingerprint(issued),
                        correlationId));
        return new ContributionCallIssuance(issued, true);
    }

    /** Appels d'un membre, avec leur reste dû. */
    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public List<ContributionCall> listByMembership(UUID membershipId) {
        return repository.findByMembership(membershipId);
    }

    /** Total restant dû d'un membre — somme des soldes de ses appels. */
    @PreAuthorize("hasAuthority('PERM_CONTRIBUTION.READ')")
    @Transactional(readOnly = true)
    public BigDecimal outstandingBalance(UUID membershipId) {
        return repository.findByMembership(membershipId).stream()
                .map(ContributionCall::balanceAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Empreinte SHA-256 de l'appel émis, pour l'audit. */
    private static String fingerprint(ContributionCall value) {
        String canonical =
                "callNumber=" + value.callNumber()
                        + ";membershipId=" + value.membershipId()
                        + ";fiscalYear=" + value.fiscalYear()
                        + ";amountDue=" + value.amountDue().toPlainString()
                        + ";currency=" + value.currency();
        return Hashing.sha256Hex(canonical);
    }
}
