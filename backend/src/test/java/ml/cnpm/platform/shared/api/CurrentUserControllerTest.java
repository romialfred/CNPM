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

    private final CurrentUserController controller = new CurrentUserController();

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
    }
}
