package ml.cnpm.platform.enrollment.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.audit.AuditEntry;
import ml.cnpm.platform.audit.AuditRecorder;
import ml.cnpm.platform.enrollment.application.port.out.EnrollmentCaseRepository;
import ml.cnpm.platform.enrollment.domain.EnrollmentCase;
import ml.cnpm.platform.enrollment.domain.EnrollmentStatus;
import ml.cnpm.platform.shared.api.Hashing;
import ml.cnpm.platform.shared.api.ResourceNotFoundException;
import ml.cnpm.platform.shared.api.StateConflictException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service applicatif du module ENROLLMENT : cycle de vie du dossier d'adhésion.
 *
 * <p>Applique la machine à états normative ({@link EnrollmentStatus}) avec un refus par
 * défaut. La séparation des tâches suit {@code docs/05-security/permissions.csv} : créer et
 * soumettre exigent {@code ENROLLMENT.CREATE}, prendre en charge et demander un complément
 * {@code ENROLLMENT.REVIEW}, approuver ou rejeter {@code ENROLLMENT.APPROVE}. Le passage par
 * {@code UNDER_REVIEW} étant un prérequis de la décision, un porteur d'{@code APPROVE} ne
 * peut pas décider d'un dossier qu'aucun contrôleur n'a pris en charge.
 *
 * <p>Toute transition exige un <strong>acteur identifiable</strong> : {@code state-machines.md}
 * impose que chaque transition soit contrôlée par permission, garde, horodatage et audit, et
 * une trace non imputable ne vaut pas trace. Chaque transition produit un événement d'audit
 * corrélé dans la même transaction ; contrôles et décisions vont dans des tables append-only.
 *
 * <p><strong>Limite connue (identique à MEMBER, ADR-008) :</strong> l'autorisation est purement
 * RBAC ; le <em>périmètre</em> organisation/groupement (ABAC) n'est pas appliqué, alors que
 * {@code security-requirements.md} le prescrit et que {@code REFERENT_GROUPEMENT} est censé
 * n'agir que sur son périmètre. Il suppose un périmètre porté par le jeton (provisionnement
 * Keycloak non réalisé) — à câbler avant exposition en production.
 *
 * <p><strong>Périmètre assumé (ENR-DEC-001).</strong> {@code ACTIVE} n'est pas atteint
 * (catégorie de cotisation non tranchée, DEC-008). Aucun contrôle de format sur les
 * identifiants métier (ENR-003 différé), aucune règle de complétude documentaire (ENR-004
 * différé), pas de date d'effet, pas de nomenclature de motifs, pas de SLA. Ces différés
 * ajoutent des gardes ; ils n'en retirent aucune.
 */
@Service
public class EnrollmentCaseService {

    private static final String ENTITY_TYPE = "enrollment.enrollment_case";
    private static final String ACTION_CREATED = "ENROLLMENT_CASE.CREATED";
    private static final String ACTION_SUBMITTED = "ENROLLMENT_CASE.SUBMITTED";
    private static final String ACTION_REVIEW_STARTED = "ENROLLMENT_CASE.REVIEW_STARTED";
    private static final String ACTION_COMPLEMENT = "ENROLLMENT_CASE.COMPLEMENT_REQUESTED";
    private static final String ACTION_APPROVED = "ENROLLMENT_CASE.APPROVED";
    private static final String ACTION_REJECTED = "ENROLLMENT_CASE.REJECTED";

    private final EnrollmentCaseRepository repository;
    private final AuditRecorder auditRecorder;
    /** API publique du module MEMBER : seul canal autorisé pour créer une adhésion. */
    private final ml.cnpm.platform.member.MemberActivation memberActivation;

    public EnrollmentCaseService(
            EnrollmentCaseRepository repository,
            AuditRecorder auditRecorder,
            ml.cnpm.platform.member.MemberActivation memberActivation) {
        this.repository = repository;
        this.auditRecorder = auditRecorder;
        this.memberActivation = memberActivation;
    }

    /**
     * Crée un dossier au statut {@code DRAFT}, ou renvoie l'existant si un dossier identique
     * porte déjà le même numéro (idempotence par clé naturelle).
     *
     * @throws StateConflictException si le numéro est déjà pris par un dossier différent
     */
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.CREATE')")
    @Transactional
    public EnrollmentCaseCreation create(
            EnrollmentCaseDraft draft, UUID actorUserId, UUID correlationId) {
        Optional<EnrollmentCase> existing = repository.findByCaseNumber(draft.caseNumber());
        if (existing.isPresent()) {
            EnrollmentCase found = existing.get();
            if (found.organizationId().equals(draft.organizationId())
                    && found.channel().equals(draft.channel())) {
                return new EnrollmentCaseCreation(found, false);
            }
            throw new StateConflictException("Un dossier différent porte déjà ce numéro.");
        }

        EnrollmentCase created = repository.create(draft);
        audit(actorUserId, ACTION_CREATED, created, correlationId);
        return new EnrollmentCaseCreation(created, true);
    }

    /**
     * Consulte un dossier. Aucune permission de lecture dédiée n'existe au référentiel
     * ({@code permissions.csv} ne définit que CREATE/REVIEW/APPROVE) : la lecture est ouverte
     * aux trois rôles du processus, sans en inventer une quatrième.
     *
     * @throws ResourceNotFoundException si aucun dossier ne porte cet identifiant
     */
    @PreAuthorize(
            "hasAnyAuthority('PERM_ENROLLMENT.CREATE','PERM_ENROLLMENT.REVIEW','PERM_ENROLLMENT.APPROVE')")
    @Transactional(readOnly = true)
    public EnrollmentCase get(UUID id) {
        return load(id);
    }

    /**
     * Soumet le dossier. Depuis {@code DRAFT} il devient {@code SUBMITTED} ; depuis
     * {@code COMPLEMENT_REQUIRED} il retourne en {@code UNDER_REVIEW}, conformément à la
     * machine à états normative (le complément fourni renvoie le dossier au contrôle).
     */
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.CREATE')")
    @Transactional
    public EnrollmentCase submit(UUID id, UUID actorUserId, UUID correlationId) {
        requireIdentifiableActor(actorUserId);
        EnrollmentCase current = load(id);
        EnrollmentStatus target =
                current.status() == EnrollmentStatus.COMPLEMENT_REQUIRED
                        ? EnrollmentStatus.UNDER_REVIEW
                        : EnrollmentStatus.SUBMITTED;
        EnrollmentCase moved = transition(current, target, Instant.now(), null);
        audit(actorUserId, ACTION_SUBMITTED, moved, correlationId);
        return moved;
    }

    /**
     * Prend le dossier en charge pour contrôle ({@code SUBMITTED → UNDER_REVIEW}) et
     * l'assigne à l'acteur. Cette opération est le seul point d'entrée de l'état de contrôle,
     * donc un prérequis de toute décision.
     */
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.REVIEW')")
    @Transactional
    public EnrollmentCase startReview(UUID id, UUID actorUserId, UUID correlationId) {
        requireIdentifiableActor(actorUserId);
        EnrollmentCase current = load(id);
        EnrollmentCase moved =
                transition(current, EnrollmentStatus.UNDER_REVIEW, null, actorUserId);
        audit(actorUserId, ACTION_REVIEW_STARTED, moved, correlationId);
        return moved;
    }

    /**
     * Demande un complément au demandeur, avec motif (ENR-005). Le contrôle est consigné dans
     * la table append-only des revues. L'échéance mentionnée par ENR-005 n'est pas portée : sa
     * durée n'est fixée par aucune source (ENR-DEC-001).
     */
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.REVIEW')")
    @Transactional
    public EnrollmentCase requestComplement(
            UUID id, String comment, UUID actorUserId, UUID correlationId) {
        requireIdentifiableActor(actorUserId);
        EnrollmentCase current = load(id);
        EnrollmentCase moved =
                transition(current, EnrollmentStatus.COMPLEMENT_REQUIRED, null, null);
        repository.recordReview(
                id, "DOCUMENT", EnrollmentStatus.COMPLEMENT_REQUIRED.name(), comment, actorUserId);
        audit(actorUserId, ACTION_COMPLEMENT, moved, correlationId);
        return moved;
    }

    /**
     * Approuve le dossier <strong>et active le membre</strong> — le contrat intitule
     * l'opération « approuver et activer ». La décision est nominative et consignée
     * (append-only) ; l'activation crée l'adhésion via l'API applicative du module MEMBER,
     * dans la même transaction : décision et activation sont validées ou annulées ensemble.
     *
     * <p>{@code membershipNumber} et {@code categoryCode} sont fournis par le décideur : la
     * règle de catégorisation dépend du barème (DEC-008) et le format du numéro n'est fixé par
     * aucune source (ENR-DEC-001). Leur automatisation ultérieure ne rompra pas le contrat.
     *
     * <p>L'articulation entre la machine à états du dossier et celle du compte membre n'est pas
     * spécifiée par les sources : la lecture retenue est que {@code ACTIVE} qualifie l'adhésion
     * créée, le dossier restant à {@code APPROVED} (consigné dans ENR-DEC-001).
     */
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.APPROVE')")
    @Transactional
    public EnrollmentCase approve(
            UUID id,
            String membershipNumber,
            String categoryCode,
            String comment,
            UUID actorUserId,
            UUID correlationId) {
        EnrollmentCase decided =
                decide(id, EnrollmentStatus.APPROVED, null, comment, actorUserId, correlationId);
        memberActivation.activate(
                decided.organizationId(),
                membershipNumber,
                categoryCode,
                "Activation par approbation du dossier " + decided.caseNumber(),
                actorUserId,
                correlationId);
        return decided;
    }

    /**
     * Rejette le dossier avec motif. Le commentaire est exigé au bord du système ;
     * {@code reasonCode} reste libre, le référentiel des motifs n'étant pas fourni par les
     * sources (ENR-DEC-001).
     */
    @PreAuthorize("hasAuthority('PERM_ENROLLMENT.APPROVE')")
    @Transactional
    public EnrollmentCase reject(
            UUID id, String reasonCode, String comment, UUID actorUserId, UUID correlationId) {
        return decide(id, EnrollmentStatus.REJECTED, reasonCode, comment, actorUserId, correlationId);
    }

    private EnrollmentCase decide(
            UUID id,
            EnrollmentStatus target,
            String reasonCode,
            String comment,
            UUID actorUserId,
            UUID correlationId) {
        requireIdentifiableActor(actorUserId);
        EnrollmentCase current = load(id);
        EnrollmentCase moved = transition(current, target, null, null);
        repository.recordDecision(id, target.name(), reasonCode, comment, actorUserId);
        audit(
                actorUserId,
                target == EnrollmentStatus.APPROVED ? ACTION_APPROVED : ACTION_REJECTED,
                moved,
                correlationId);
        return moved;
    }

    /**
     * Une transition est une action sensible et auditée : sans acteur résoluble, elle ne peut
     * être imputée (et la décision ne pourrait même pas être écrite, {@code decided_by} étant
     * NOT NULL). On refuse plutôt que de produire une trace anonyme.
     */
    private static void requireIdentifiableActor(UUID actorUserId) {
        if (actorUserId == null) {
            throw new AccessDeniedException("Transition impossible : acteur non identifiable.");
        }
    }

    private EnrollmentCase load(UUID id) {
        return repository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dossier d'adhésion introuvable."));
    }

    /** Garde de transition : refus par défaut, conflit d'état si la transition n'est pas permise. */
    private EnrollmentCase transition(
            EnrollmentCase current, EnrollmentStatus target, Instant submittedAt, UUID assignedTo) {
        if (!current.status().canTransitionTo(target)) {
            throw new StateConflictException(
                    "Transition interdite : "
                            + current.status()
                            + " → "
                            + target
                            + (current.status().isTerminal() ? " (état terminal)." : "."));
        }
        return repository.applyStatus(current.id(), target, submittedAt, assignedTo);
    }

    private void audit(UUID actorUserId, String action, EnrollmentCase state, UUID correlationId) {
        auditRecorder.record(
                AuditEntry.created(
                        actorUserId, action, ENTITY_TYPE, state.id(), fingerprint(state), correlationId));
    }

    /** Empreinte SHA-256 de l'état du dossier, pour l'audit — sans exposer la donnée. */
    private static String fingerprint(EnrollmentCase value) {
        String canonical =
                "caseNumber=" + value.caseNumber()
                        + ";organizationId=" + value.organizationId()
                        + ";channel=" + value.channel()
                        + ";status=" + value.status();
        return Hashing.sha256Hex(canonical);
    }
}
