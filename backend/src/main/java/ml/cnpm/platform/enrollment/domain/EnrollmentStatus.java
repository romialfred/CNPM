package ml.cnpm.platform.enrollment.domain;

import java.util.Map;
import java.util.Set;

/**
 * États d'un dossier d'adhésion et transitions autorisées.
 *
 * <p>Table <strong>strictement</strong> conforme à la machine à états normative de
 * {@code docs/07-processes/state-machines.md} :
 * {@code DRAFT → SUBMITTED → UNDER_REVIEW → COMPLEMENT_REQUIRED → UNDER_REVIEW → APPROVED → ACTIVE}
 * ou {@code REJECTED}. Aucune arête n'est ajoutée à la source : en particulier, une décision
 * ne peut jamais être prise depuis {@code SUBMITTED}, le passage par {@code UNDER_REVIEW}
 * (contrôle) est un <strong>prérequis</strong> de la décision. C'est ce qui donne sa portée
 * réelle à la séparation {@code ENROLLMENT.REVIEW} / {@code ENROLLMENT.APPROVE}.
 *
 * <p>Deux bornes assumées, sans invention de règle :
 *
 * <ul>
 *   <li>{@code ACTIVE} n'est pas atteint : l'activation crée l'adhésion et exige une catégorie
 *       de cotisation non tranchée (DEC-008). {@code APPROVED} est terminal dans cet incrément.
 *   <li>La source ne rattache la branche {@code REJECTED} qu'au point de décision
 *       ({@code UNDER_REVIEW}). Un dossier abandonné en {@code COMPLEMENT_REQUIRED} n'a donc
 *       pas de clôture directe : ajouter cette arête serait étendre la source (consigné dans
 *       ENR-DEC-001, avec la question du SLA d'échéance).
 * </ul>
 *
 * <p>Refus par défaut : toute transition absente de la table est rejetée.
 */
public enum EnrollmentStatus {
    DRAFT,
    SUBMITTED,
    UNDER_REVIEW,
    COMPLEMENT_REQUIRED,
    APPROVED,
    REJECTED;

    private static final Map<EnrollmentStatus, Set<EnrollmentStatus>> ALLOWED =
            Map.of(
                    DRAFT, Set.of(SUBMITTED),
                    SUBMITTED, Set.of(UNDER_REVIEW),
                    UNDER_REVIEW, Set.of(COMPLEMENT_REQUIRED, APPROVED, REJECTED),
                    COMPLEMENT_REQUIRED, Set.of(UNDER_REVIEW),
                    APPROVED, Set.of(),
                    REJECTED, Set.of());

    /** Vrai si la transition de cet état vers {@code target} est autorisée. */
    public boolean canTransitionTo(EnrollmentStatus target) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(target);
    }

    /** Vrai si l'état est connu de la table et n'a aucune transition sortante. */
    public boolean isTerminal() {
        return ALLOWED.containsKey(this) && ALLOWED.get(this).isEmpty();
    }
}
