package ml.cnpm.platform.shared.security.mfa;

import java.util.Optional;
import java.util.UUID;

/**
 * Port de persistance de l'état MFA d'un compte. L'adaptateur JPA (schéma {@code iam})
 * l'implémente ; {@link MfaService} ne dépend que de ce port, jamais de la base.
 */
public interface MfaAccountStore {

    Optional<MfaAccount> findById(UUID accountId);

    /** Persiste l'état MFA courant du compte (secret chiffré, codes de secours, pas accepté). */
    void save(MfaAccount account);
}
