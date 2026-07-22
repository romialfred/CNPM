package ml.cnpm.platform.shared.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class CurrentUserControllerTest {

    /**
     * Projection déterministe sans base : le contrôleur ne fait que composer son résultat,
     * on vérifie ici sa projection du jeton, pas la résolution SQL de {@link SessionIdentityProjection}.
     */
    private final CurrentUserController controller =
            new CurrentUserController(
                    new SessionIdentityProjection(null) {
                        @Override
                        public Identity resolve(String subject, List<String> roleCodes) {
                            return new Identity(
                                    "Nom " + subject,
                                    roleCodes.isEmpty() ? "Aucun rôle attribué" : String.join(" · ", roleCodes));
                        }
                    });

    @Test
    void exposesOnlySortedRealmRolesAndServerDerivedPermissions() {
        Jwt jwt =
                Jwt.withTokenValue("token")
                        .header("alg", "none")
                        .subject("user-123")
                        .claim("preferred_username", "acomptable")
                        .claim("email", "a.comptable@example.test")
                        .claim("realm_access", Map.of("roles", List.of("UNTRUSTED_CLAIM_ROLE")))
                        .build();
        JwtAuthenticationToken authentication =
                new JwtAuthenticationToken(
                        jwt,
                        List.of(
                                new SimpleGrantedAuthority("SCOPE_openid"),
                                new SimpleGrantedAuthority("PERM_PAYMENT.READ"),
                                new SimpleGrantedAuthority("ROLE_SUPPORT"),
                                new SimpleGrantedAuthority("PERM_MEMBER.READ"),
                                new SimpleGrantedAuthority("ROLE_COMPTABLE"),
                                new SimpleGrantedAuthority("PERM_PAYMENT.READ"),
                                new SimpleGrantedAuthority("PERM_")));

        CurrentUserResponse response = controller.currentUser(authentication);

        assertEquals("user-123", response.subject());
        assertEquals("acomptable", response.username());
        assertEquals("a.comptable@example.test", response.email());
        // Nom et libellé de rôle projetés par la résolution d'identité (source iam.*).
        assertEquals("Nom user-123", response.displayName());
        assertEquals("COMPTABLE · SUPPORT", response.roleLabel());
        assertEquals(List.of("COMPTABLE", "SUPPORT"), response.roles());
        assertEquals(List.of("MEMBER.READ", "PAYMENT.READ"), response.permissions());
        assertThrows(UnsupportedOperationException.class, () -> response.roles().add("OTHER"));
        assertThrows(
                UnsupportedOperationException.class,
                () -> response.permissions().add("OTHER.READ"));
    }

    @Test
    void keepsOptionalIdentityClaimsNullableAndReturnsEmptyAuthorityLists() {
        Jwt jwt =
                Jwt.withTokenValue("token")
                        .header("alg", "none")
                        .subject("user-with-minimal-token")
                        .build();

        CurrentUserResponse response =
                controller.currentUser(new JwtAuthenticationToken(jwt, List.of()));

        assertEquals("user-with-minimal-token", response.subject());
        assertNull(response.username());
        assertNull(response.email());
        assertEquals(List.of(), response.roles());
        assertEquals(List.of(), response.permissions());
        // Sans revendication 2FA, le serveur ne conclut rien : null, jamais false.
        assertNull(response.mfaEnrolled());
        assertNull(response.mfaRequired());
    }

    @Test
    void reflectsExplicitMfaClaimsFromTheIdentityProvider() {
        Jwt jwt =
                Jwt.withTokenValue("token")
                        .header("alg", "none")
                        .subject("user-enrolled")
                        .claim("mfa_enrolled", Boolean.TRUE)
                        .claim("mfa_required", Boolean.FALSE)
                        .build();

        CurrentUserResponse response =
                controller.currentUser(new JwtAuthenticationToken(jwt, List.of()));

        assertEquals(Boolean.TRUE, response.mfaEnrolled());
        assertEquals(Boolean.FALSE, response.mfaRequired());
    }

    @Test
    void derivesEnrolmentFromAmrWhenNoExplicitClaimIsPresent() {
        // La session courante a présenté un OTP : le second facteur est donc enrôlé,
        // même sans mappeur `mfa_enrolled` dédié.
        Jwt jwt =
                Jwt.withTokenValue("token")
                        .header("alg", "none")
                        .subject("user-with-otp-session")
                        .claim("amr", List.of("pwd", "otp"))
                        .build();

        CurrentUserResponse response =
                controller.currentUser(new JwtAuthenticationToken(jwt, List.of()));

        assertEquals(Boolean.TRUE, response.mfaEnrolled());
        // `amr` ne dit rien de l'obligation : elle reste indéterminée.
        assertNull(response.mfaRequired());
    }

    @Test
    void doesNotInferEnrolmentFromASingleFactorSession() {
        Jwt jwt =
                Jwt.withTokenValue("token")
                        .header("alg", "none")
                        .subject("user-password-only")
                        .claim("amr", List.of("pwd"))
                        .build();

        CurrentUserResponse response =
                controller.currentUser(new JwtAuthenticationToken(jwt, List.of()));

        // Une session à un seul facteur ne prouve PAS l'absence d'enrôlement : null.
        assertNull(response.mfaEnrolled());
    }
}
