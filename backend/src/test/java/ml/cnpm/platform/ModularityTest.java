package ml.cnpm.platform;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Garde-fou des frontières de modules (Spring Modulith).
 *
 * <p>{@code .claude/rules/architecture.md} : « Aucun module ne lit directement les
 * tables privées d'un autre module ; toute exception à une frontière de module
 * nécessite un ADR. » Cette vérification statique échoue si un module en importe un
 * autre hors de son API, ou introduit un cycle — avant que le premier deuxième module
 * métier ne rende la violation possible en silence.
 */
class ModularityTest {

    private final ApplicationModules modules = ApplicationModules.of(CnpmPlatformApplication.class);

    @Test
    void respectsModuleBoundaries() {
        modules.verify();
    }
}
