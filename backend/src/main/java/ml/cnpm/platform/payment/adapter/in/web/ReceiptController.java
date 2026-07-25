package ml.cnpm.platform.payment.adapter.in.web;

import java.util.UUID;
import ml.cnpm.platform.payment.application.ReceiptService;
import ml.cnpm.platform.payment.application.ReceiptView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur HTTP des reçus officiels.
 *
 * <p>La vérification par jeton est PUBLIQUE (déclarée telle dans la politique de sécurité) : un
 * tiers peut confirmer l'authenticité d'un reçu sans compte. La liste et le détail restent
 * protégés par {@code RECEIPT.READ}, porté côté service.
 */
@RestController
public class ReceiptController {

    private final ReceiptService service;

    public ReceiptController(ReceiptService service) {
        this.service = service;
    }

    @GetMapping("/receipts")
    public ReceiptView.ReceiptList list() {
        return service.list();
    }

    @GetMapping("/receipts/{id}")
    public ReceiptView.Receipt get(@PathVariable("id") UUID id) {
        return service.get(id);
    }

    @GetMapping("/receipts/verify/{token}")
    public ReceiptView.Verification verify(@PathVariable("token") String token) {
        return service.verify(token);
    }
}
