package ml.cnpm.platform.shared.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;

class ApiCatalogContractTest {

    @Test
    void catalogContainsEveryCanonicalOpenApiOperationInContractOrder() throws IOException {
        Path root = repositoryRoot();
        List<String> openApiOperationIds =
                Files.readAllLines(root.resolve("docs/04-api/openapi.yaml"), StandardCharsets.UTF_8)
                        .stream()
                        .map(String::trim)
                        .filter(line -> line.startsWith("operationId:"))
                        .map(line -> line.substring("operationId:".length()).trim())
                        .toList();
        List<String> catalogOperationIds =
                Files.readAllLines(root.resolve("docs/04-api/api-catalog.csv"), StandardCharsets.UTF_8)
                        .stream()
                        .skip(1)
                        .filter(line -> !line.isBlank())
                        .map(line -> line.split(";", -1))
                        .map(columns -> columns[3])
                        .toList();

        assertEquals(openApiOperationIds, catalogOperationIds);
        assertEquals(79, catalogOperationIds.size());
        assertTrue(catalogOperationIds.contains("startEnrollmentReview"));
    }

    @Test
    void currentUserOperationUsesItsDedicatedSchemaWithoutClaimingAbacOrMfa() throws IOException {
        String contract =
                Files.readString(
                        repositoryRoot().resolve("docs/04-api/openapi.yaml"),
                        StandardCharsets.UTF_8);
        String operation = between(contract, "  /auth/me:", "  /auth/step-up:");
        String schema = between(contract, "    CurrentUser:", "    Uuid:");

        assertTrue(operation.contains("$ref: '#/components/schemas/CurrentUser'"));
        assertTrue(schema.contains("      - permissions"));
        assertTrue(schema.contains("        permissions:"));
        assertFalse(schema.contains("mfaLevel:"));
        assertFalse(schema.contains("organizationScope:"));
        assertFalse(schema.contains("groupScope:"));
    }

    private static String between(String value, String startMarker, String endMarker) {
        int start = value.indexOf(startMarker);
        int end = value.indexOf(endMarker, start + startMarker.length());
        assertTrue(start >= 0, () -> "Marqueur absent : " + startMarker);
        assertTrue(end > start, () -> "Marqueur absent : " + endMarker);
        return value.substring(start, end);
    }

    private static Path repositoryRoot() {
        Path current = Path.of("").toAbsolutePath();
        while (current != null) {
            if (Files.isRegularFile(current.resolve("docs/04-api/openapi.yaml"))) {
                return current;
            }
            current = current.getParent();
        }
        throw new IllegalStateException("Racine du dépôt CNPM introuvable");
    }
}
