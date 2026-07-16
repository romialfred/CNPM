package ml.cnpm.platform.shared.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProblemResponse(Instant timestamp, int status, String code, String message,
                              List<FieldError> fieldErrors, UUID correlationId) {
    public record FieldError(String field, String code, String message) {}
}
