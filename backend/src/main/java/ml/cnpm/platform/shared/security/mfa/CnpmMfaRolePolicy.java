package ml.cnpm.platform.shared.security.mfa;

import java.text.Normalizer;
import java.util.Collection;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Component;

/**
 * Politique centrale du second facteur pour CNPM (AUTH-DEC-020).
 *
 * <p>Décision produit : le 2FA est <b>obligatoire pour tout utilisateur authentifié</b>
 * (« chaque utilisateur doit enrôler son 2FA à la première connexion »). La règle est
 * DÉRIVÉE des rôles côté serveur, en défense en profondeur : on ne fait jamais confiance à
 * un claim {@code mfa_required} produit par une source externe.
 *
 * <p>La <b>gestion</b> du facteur (réinitialisation / désactivation) reste réservée : elle
 * est déjà portée par la permission {@code IAM.MFA.RESET} (accordée à {@code ADMIN_SECURITE},
 * cf. séparation des tâches CNPM). {@link #canManageMfa(Collection)} l'expose aussi au
 * super-administrateur technique, conformément à la demande « seul le super-admin peut
 * désactiver ». Réattribuer cette autorité relève d'un choix RBAC, pas de ce code.
 */
@Component
public class CnpmMfaRolePolicy {

    /** Rôles habilités à réinitialiser / désactiver un second facteur (séparation des tâches). */
    private static final Set<String> MFA_MANAGER_ROLES = Set.of("SUPER_ADMIN_TECH", "ADMIN_SECURITE");

    /** Vingt rôles canoniques du dépôt (docs/05-security/rbac-grants.csv). */
    private static final Set<String> CANONICAL_ROLES = Set.of(
            "SUPER_ADMIN_TECH", "ADMIN_SECURITE", "PRESTATAIRE_TECH", "ADMIN_FONCTIONNEL",
            "DIRECTION_GENERALE", "DIRECTION_FINANCIERE", "SECRETAIRE_GENERAL", "COMPTABLE",
            "CAISSIER", "AGENT_RECOUVREMENT", "COMMUNICATION", "JURIDIQUE", "VALIDATEUR_ENROLEMENT",
            "SUPPORT", "RESPONSABLE_GROUPEMENT", "REFERENT_GROUPEMENT", "MEMBRE_ADMIN",
            "AUDITEUR_INTERNE", "AUDITEUR_EXTERNE", "MEMBRE_UTILISATEUR");

    /**
     * Un rôle donné exige-t-il le 2FA ? Universel à CNPM : tout rôle réel l'exige. Un rôle
     * vide (aucune identité) n'exige rien. Par sécurité (fail-secure), un rôle inconnu est
     * traité comme exigeant le 2FA plutôt que l'inverse.
     */
    public boolean requiresMfa(String role) {
        return !normalize(role).isEmpty();
    }

    /** Vrai dès qu'au moins un rôle réel est présent : tout utilisateur authentifié est concerné. */
    public boolean requiresMfa(Collection<String> roles) {
        return roles != null && roles.stream().anyMatch(this::requiresMfa);
    }

    /** Le compte peut-il réinitialiser / désactiver un second facteur ? */
    public boolean canManageMfa(Collection<String> roles) {
        return roles != null && roles.stream().map(CnpmMfaRolePolicy::normalize).anyMatch(MFA_MANAGER_ROLES::contains);
    }

    /** Le rôle fait-il partie des rôles canoniques connus. */
    public boolean isCanonicalRole(String role) {
        return CANONICAL_ROLES.contains(normalize(role));
    }

    static String normalize(String role) {
        if (role == null || role.isBlank()) {
            return "";
        }
        return Normalizer.normalize(role, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toUpperCase(Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
    }
}
