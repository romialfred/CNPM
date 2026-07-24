package ml.cnpm.platform.shared.security.credential;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ml.cnpm.platform.shared.api.CorrelationId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Pose du mot de passe par le titulaire du compte, sur présentation d'un jeton à usage
 * unique (ENR étape 18 « invitation au portail », PRT-001 « récupérer son accès »).
 *
 * <p>Route publique par nécessité : c'est le jeton qui autorise. Exiger une session
 * rendrait la récupération impossible pour qui a justement perdu son accès.
 *
 * <p>La réponse ne porte aucun contenu — ni identité, ni rôle, ni indication sur le compte
 * concerné. Confirmer « le mot de passe de X est posé » transformerait ce point d'entrée en
 * oracle d'existence de comptes.
 */
@RestController
public class PasswordController {

    /**
     * Le mot de passe n'est accepté que dans le CORPS de la requête, jamais en paramètre
     * d'URL : une URL se retrouve dans les journaux de serveurs, de proxys et d'historiques.
     */
    public record SetPasswordInput(
            @NotBlank @Size(max = 200) String token,
            @NotBlank @Size(min = 12, max = 200) String password) { }

    private final AccountCredentialService credentials;

    public PasswordController(AccountCredentialService credentials) {
        this.credentials = credentials;
    }

    @PostMapping("/auth/password")
    public ResponseEntity<Void> setPassword(
            @Valid @RequestBody SetPasswordInput input, HttpServletRequest request) {
        credentials.setPassword(input.token(), input.password(), CorrelationId.current(request));
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
