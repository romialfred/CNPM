package ml.cnpm.platform.shared.security;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ml.cnpm.platform.shared.security.mfa.MfaAccount;
import ml.cnpm.platform.shared.security.mfa.MfaChallengeService.MfaChallengeException;
import ml.cnpm.platform.shared.security.mfa.MfaService;
import ml.cnpm.platform.shared.security.mfa.MfaService.Enrollment;
import ml.cnpm.platform.shared.security.mfa.MfaService.EnrollmentResult;
import ml.cnpm.platform.shared.security.mfa.MfaService.MfaException;

/**
 * Second facteur natif (AUTH-DEC-020) : enrôlement (QR/clé + confirmation avec codes de
 * secours) et vérification débouchant sur le jeton de session applicatif. Aucun accès aux
 * API n'est possible sans passer par {@code /auth/mfa/verify}.
 */
@RestController
@RequestMapping("/auth/mfa")
public class MfaController {

    public record ChallengeRequest(String challenge) { }

    public record CodeRequest(String challenge, String code, String recoveryCode) { }

    private final MfaService mfa;
    private final AppTokenService tokens;

    public MfaController(MfaService mfa, AppTokenService tokens) {
        this.mfa = mfa;
        this.tokens = tokens;
    }

    @PostMapping("/enroll/start")
    public ResponseEntity<Map<String, Object>> start(@RequestBody ChallengeRequest request) {
        try {
            Enrollment enrollment = mfa.beginEnrollment(request.challenge());
            return ResponseEntity.ok(Map.of(
                    "manualKey", enrollment.manualKey(),
                    "otpAuthUri", enrollment.otpAuthUri()));
        } catch (MfaException | MfaChallengeException ex) {
            return failure(ex.getMessage());
        }
    }

    @PostMapping("/enroll/confirm")
    public ResponseEntity<Map<String, Object>> confirm(@RequestBody CodeRequest request) {
        try {
            EnrollmentResult result = mfa.confirmEnrollment(request.challenge(), request.code());
            return ResponseEntity.ok(Map.of("recoveryCodes", result.recoveryCodes()));
        } catch (MfaException | MfaChallengeException ex) {
            return failure(ex.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(@RequestBody CodeRequest request) {
        try {
            MfaAccount account = mfa.verify(request.challenge(), request.code(), request.recoveryCode());
            String token = tokens.issue(account.id(), account.login(), List.copyOf(account.roles()));
            return ResponseEntity.ok(Map.of("status", "AUTHENTICATED", "accessToken", token));
        } catch (MfaException | MfaChallengeException ex) {
            return failure(ex.getMessage());
        }
    }

    private ResponseEntity<Map<String, Object>> failure(String code) {
        HttpStatus status = "MFA_CHALLENGE_LOCKED".equals(code)
                ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.UNAUTHORIZED;
        return ResponseEntity.status(status).body(Map.of(
                "errorCode", code == null ? "MFA_ERROR" : code,
                "errorMessage", "Vérification multifacteur refusée."));
    }
}
