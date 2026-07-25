package ml.cnpm.platform.administration.application.port.out;

import java.util.Optional;
import java.util.UUID;
import ml.cnpm.platform.administration.application.AdminAccountDraft;
import ml.cnpm.platform.administration.application.AdminSecurityView;

/**
 * Port sortant des écritures sur les comptes de la plateforme.
 *
 * <p>Le service applicatif décide (autorisation, idempotence, invariants, audit) ; ce port
 * ne fait qu'exécuter. Il ne renvoie jamais de secret : la projection {@code Account} ne
 * porte ni mot de passe, ni secret TOTP, ni code de secours.
 */
public interface AdminAccountRepository {

    /** Compte portant cette adresse, la casse étant sans effet sur l'identité. */
    Optional<AdminSecurityView.Account> findByEmail(String email);

    Optional<AdminSecurityView.Account> findById(UUID id);

    /** Le rôle existe-t-il ? Un rôle inconnu est une entrée invalide, pas une erreur serveur. */
    boolean roleExists(UUID roleId);

    /**
     * Crée le compte et lui attribue son rôle.
     *
     * <p>Le compte naît actif en base mais sans connexion ni second facteur : la lecture le
     * présente donc « invité » tant qu'il ne s'est pas connecté.
     */
    AdminSecurityView.Account create(AdminAccountDraft draft, UUID actorUserId);

    /** Applique le nouvel état du compte ({@code ACTIVE} ou {@code SUSPENDED}). */
    AdminSecurityView.Account updateStatus(UUID id, String status, UUID actorUserId);

    /**
     * Efface le second facteur : secret, codes de secours et borne anti-rejeu.
     *
     * <p>Le compte repasse « en attente d'enrôlement » ; aucun secret n'est produit ici, le
     * nouveau sera négocié à la prochaine connexion de l'utilisateur.
     */
    AdminSecurityView.Account resetTwoFactor(UUID id, UUID actorUserId);

    /**
     * Supprime définitivement le compte. Les rattachements du compte (rôles, second facteur,
     * jetons d'accès) partent en cascade par contrainte de clé étrangère. Aucune écriture
     * financière n'est liée à un compte, donc rien d'immuable n'est touché.
     */
    void delete(UUID id);
}
