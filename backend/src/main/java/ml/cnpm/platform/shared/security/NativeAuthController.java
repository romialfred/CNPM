package ml.cnpm.platform.shared.security;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.shared.security.mfa.CnpmMfaRolePolicy;
import ml.cnpm.platform.shared.security.mfa.IamNativeAccountJdbc;
import ml.cnpm.platform.shared.security.mfa.IamNativeAccountJdbc.AuthAccount;
import ml.cnpm.platform.shared.security.mfa.MfaChallengeService;
import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.Purpose;

/**
 * Étape identifiants de l'authentification NATIVE (AUTH-DEC-020) : validation du mot de
 * passe applicatif, puis émission d'un challenge de second facteur. L'accès complet n'est
 * jamais délivré ici — il l'est seulement après {@code /auth/mfa/verify}.
 *
 * <p>Réponse neutre : identifiants inconnus et mot de passe erroné renvoient le MÊME 401,
 * pour ne pas révéler l'existence d'un compte.
 */
@RestController
@RequestMapping("/auth/login")
public class NativeAuthController {

    public record LoginRequest(String email, String password) { }

    private final IamNativeAccountJdbc accounts;
    private final PasswordEncoder passwordEncoder;
    private final CnpmMfaRolePolicy rolePolicy;
    private final MfaChallengeService challenges;
    private final AppTokenService tokens;

    public NativeAuthController(IamNativeAccountJdbc accounts, PasswordEncoder passwordEncoder,
            CnpmMfaRolePolicy rolePolicy, MfaChallengeService challenges, AppTokenService tokens) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.rolePolicy = rolePolicy;
        this.challenges = challenges;
        this.tokens = tokens;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Optional<AuthAccount> found = request.email() == null ? Optional.empty()
                : accounts.findAuthByEmail(request.email().trim());

        if (found.isEmpty() || found.get().passwordHash() == null
                || !passwordEncoder.matches(request.password(), found.get().passwordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errorCode", "INVALID_CREDENTIALS",
                            "errorMessage", "Identifiants non reconnus."));
        }

        AuthAccount account = found.get();
        if (!rolePolicy.requiresMfa(account.roles())) {
            // Cas résiduel (aucun rôle) : accès direct, sans second facteur.
            String token = tokens.issue(account.id(), account.email(), List.copyOf(account.roles()));
            return ResponseEntity.ok(Map.of("status", "AUTHENTICATED", "accessToken", token));
        }

        boolean enrolled = account.mfaEnabled() && account.mfaSecretEncrypted() != null
                && !account.mfaSecretEncrypted().isBlank();
        Purpose purpose = enrolled ? Purpose.VERIFY : Purpose.ENROLL;
        String challenge = challenges.issue(account.id(), account.email(), purpose).token();

        return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).body(Map.of(
                "errorCode", enrolled ? "MFA_REQUIRED" : "MFA_ENROLLMENT_REQUIRED",
                "errorMessage", enrolled
                        ? "Vérification à deux facteurs requise."
                        : "Enrôlement du second facteur requis avant tout accès.",
                "challenge", challenge));
    }
}
