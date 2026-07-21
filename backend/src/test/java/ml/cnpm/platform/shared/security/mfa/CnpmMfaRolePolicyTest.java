package ml.cnpm.platform.shared.security.mfa;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CnpmMfaRolePolicyTest {

    private final CnpmMfaRolePolicy policy = new CnpmMfaRolePolicy();

    @Test
    @DisplayName("exige le 2FA pour tout rôle réel, y compris le membre standard")
    void requiresMfaForEveryRealRole() {
        assertThat(policy.requiresMfa("MEMBRE_UTILISATEUR")).isTrue();
        assertThat(policy.requiresMfa("SUPER_ADMIN_TECH")).isTrue();
        assertThat(policy.requiresMfa(List.of("AUDITEUR_INTERNE"))).isTrue();
        // Absence d'identité : rien à exiger.
        assertThat(policy.requiresMfa("")).isFalse();
        assertThat(policy.requiresMfa((String) null)).isFalse();
        assertThat(policy.requiresMfa(List.of())).isFalse();
    }

    @Test
    @DisplayName("réserve la gestion du second facteur au super-admin et à l'admin sécurité")
    void restrictsMfaManagement() {
        assertThat(policy.canManageMfa(List.of("ADMIN_SECURITE"))).isTrue();
        assertThat(policy.canManageMfa(List.of("SUPER_ADMIN_TECH"))).isTrue();
        assertThat(policy.canManageMfa(List.of("MEMBRE_UTILISATEUR", "COMPTABLE"))).isFalse();
        assertThat(policy.canManageMfa(List.of())).isFalse();
    }

    @Test
    @DisplayName("normalise casse, accents, tirets et espaces")
    void normalizesRoleTokens() {
        assertThat(policy.canManageMfa(List.of("admin-securité"))).isTrue();
        assertThat(policy.isCanonicalRole("membre utilisateur")).isTrue();
        assertThat(policy.isCanonicalRole("ROLE_INEXISTANT")).isFalse();
    }
}
