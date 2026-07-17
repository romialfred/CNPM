package ml.cnpm.platform.shared.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

/**
 * Rend les erreurs de validation d'entrée au format {@code Problem} du contrat.
 *
 * <p>Les 401/403 sont produits par les filtres de sécurité, en amont de Spring MVC, et
 * restent traités par {@link ProblemResponseWriter}. Les 400 de validation, eux,
 * surviennent pendant l'exécution du contrôleur : sans ce gestionnaire, Spring rendrait
 * un corps par défaut dépourvu de {@code code} et de {@code correlationId} exigés par le
 * contrat, et un {@code Content-Type} non conforme.
 *
 * <p>Ce conseil ne capture <strong>que</strong> des exceptions de validation : il ne
 * touche pas {@code AccessDeniedException}, qui doit continuer de remonter jusqu'à la
 * chaîne de sécurité pour produire le 403 normalisé.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final String VALIDATION_CODE = "VALIDATION_ERROR";
    private static final String VALIDATION_MESSAGE = "La requête comporte des paramètres invalides.";
    private static final String CONFLICT_CODE = "STATE_CONFLICT";

    /** Validation des paramètres de méthode (Spring 6.1+/7) : {@code @Min/@Max/@Size} sur les query params. */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ProblemResponse> onMethodValidation(
            HandlerMethodValidationException exception, HttpServletRequest request) {
        List<ProblemResponse.FieldError> fieldErrors =
                exception.getAllErrors().stream()
                        .map(
                                error ->
                                        new ProblemResponse.FieldError(
                                                null, VALIDATION_CODE, error.getDefaultMessage()))
                        .toList();
        return badRequest(fieldErrors, request);
    }

    /** Validation d'un corps de requête annoté {@code @Valid} (créations à venir). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemResponse> onBodyValidation(
            MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<ProblemResponse.FieldError> fieldErrors =
                exception.getBindingResult().getFieldErrors().stream()
                        .map(
                                error ->
                                        new ProblemResponse.FieldError(
                                                error.getField(), VALIDATION_CODE, error.getDefaultMessage()))
                        .toList();
        return badRequest(fieldErrors, request);
    }

    /** Violations de contraintes hors liaison MVC (défense en profondeur). */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemResponse> onConstraintViolation(
            ConstraintViolationException exception, HttpServletRequest request) {
        List<ProblemResponse.FieldError> fieldErrors =
                exception.getConstraintViolations().stream()
                        .map(ApiExceptionHandler::toFieldError)
                        .toList();
        return badRequest(fieldErrors, request);
    }

    /** En-tête requis absent (ex. {@code Idempotency-Key} sur une création). */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ProblemResponse> onMissingHeader(
            MissingRequestHeaderException exception, HttpServletRequest request) {
        ProblemResponse.FieldError fieldError =
                new ProblemResponse.FieldError(
                        exception.getHeaderName(), VALIDATION_CODE, "En-tête requis absent.");
        return badRequest(List.of(fieldError), request);
    }

    /** État incompatible avec l'opération (ex. valeur de référentiel déjà existante). */
    @ExceptionHandler(StateConflictException.class)
    public ResponseEntity<ProblemResponse> onStateConflict(
            StateConflictException exception, HttpServletRequest request) {
        return conflict(exception.getMessage(), request);
    }

    /**
     * Violation d'intégrité (ex. contrainte d'unicité franchie par une création
     * concurrente qui a passé la vérification préalable en même temps qu'une autre). Rendu
     * comme un conflit d'état, avec un message générique — jamais le détail de la
     * contrainte SQL.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ProblemResponse> onDataIntegrityViolation(HttpServletRequest request) {
        return conflict("L'opération entre en conflit avec l'état actuel de la ressource.", request);
    }

    private static ResponseEntity<ProblemResponse> conflict(
            String message, HttpServletRequest request) {
        ProblemResponse body =
                new ProblemResponse(
                        Instant.now(),
                        HttpStatus.CONFLICT.value(),
                        CONFLICT_CODE,
                        message,
                        List.of(),
                        CorrelationId.current(request));
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(body);
    }

    private static ProblemResponse.FieldError toFieldError(ConstraintViolation<?> violation) {
        return new ProblemResponse.FieldError(
                violation.getPropertyPath().toString(), VALIDATION_CODE, violation.getMessage());
    }

    private static ResponseEntity<ProblemResponse> badRequest(
            List<ProblemResponse.FieldError> fieldErrors, HttpServletRequest request) {
        ProblemResponse body =
                new ProblemResponse(
                        Instant.now(),
                        HttpStatus.BAD_REQUEST.value(),
                        VALIDATION_CODE,
                        VALIDATION_MESSAGE,
                        fieldErrors,
                        CorrelationId.current(request));
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(body);
    }
}
