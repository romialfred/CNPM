package ml.cnpm.platform.payment.application;

import java.util.Set;

/**
 * Intention de création d'un compte d'encaissement, déjà normalisée au bord du système.
 *
 * <p>Les valeurs textuelles sont épurées (espaces de tête et de fin), et une chaîne vide vaut
 * absence. Le domaine ne reçoit donc jamais ni {@code null} déguisé en blanc, ni marge parasite.
 */
public record CollectionAccountDraft(
        String channel,
        String label,
        String accountHolder,
        String accountIdentifier,
        String bankName,
        String instructions) {

    public static final String CHANNEL_ORANGE_MONEY = "ORANGE_MONEY";
    public static final String CHANNEL_WAVE = "WAVE";
    public static final String CHANNEL_MTN_MONEY = "MTN_MONEY";
    public static final String CHANNEL_BANK_TRANSFER = "BANK_TRANSFER";

    /** Canaux acceptés ; miroir exact de la contrainte de la table. */
    public static final Set<String> CHANNELS =
            Set.of(CHANNEL_ORANGE_MONEY, CHANNEL_WAVE, CHANNEL_MTN_MONEY, CHANNEL_BANK_TRANSFER);

    public CollectionAccountDraft {
        channel = trim(channel);
        label = trim(label);
        accountHolder = trim(accountHolder);
        accountIdentifier = trim(accountIdentifier);
        bankName = blankToNull(bankName);
        instructions = blankToNull(instructions);
    }

    /** Un virement bancaire exige le nom de la banque ; les canaux Mobile Money non. */
    public boolean isBankTransfer() {
        return CHANNEL_BANK_TRANSFER.equals(channel);
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
