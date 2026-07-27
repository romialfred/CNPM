package ml.cnpm.platform.administration.adapter.in.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import ml.cnpm.platform.administration.application.AdminAccountCreation;
import ml.cnpm.platform.administration.application.AdminAccountService;
import ml.cnpm.platform.administration.application.AdminRolePermissionService;
import ml.cnpm.platform.administration.application.AdminSecurityQueryService;
import ml.cnpm.platform.administration.application.AdminSecurityView;
import ml.cnpm.platform.shared.api.CorrelationId;
import ml.cnpm.platform.shared.security.credential.AccountCredentialService;
import ml.cnpm.platform.shared.security.credential.CredentialLinkService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptateur HTTP de l'écran « Administration et sécurité » : instantané en lecture, et
 * écritures sur les comptes (création, suspension/réactivation, réinitialisation du
 * second facteur).
 *
 * <p>Le contrôleur ne porte ni règle métier ni décision d'autorisation : il valide la
 * forme des entrées au bord du système, résout l'acteur et la corrélation, puis délègue au
 * service applicatif qui porte {@code @PreAuthorize}, transaction, idempotence et audit.
 */
@RestController
public class AdminSecurityController {

    private final AdminSecurityQueryService service;
    private final AdminAccountService accounts;
    private final AdminRolePermissionService rolePermissions;
    private final CredentialLinkService credentialLinks;

    public AdminSecurityController(
            AdminSecurityQueryService service,
            AdminAccountService accounts,
            AdminRolePermissionService rolePermissions,
            CredentialLinkService credentialLinks) {
        this.service = service;
        this.accounts = accounts;
        this.rolePermissions = rolePermissions;
        this.credentialLinks = credentialLinks;
    }

    @GetMapping("/admin/security/snapshot")
    public AdminSecurityView snapshot() {
        return service.load();
    }

    @PostMapping("/admin/security/accounts")
    public ResponseEntity<AdminSecurityView.Account> createAccount(
            @RequestHeader(name = "Idempotency-Key") @Size(min = 16, max = 100) String idempotencyKey,
            @Valid @RequestBody AdminAccountInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        AdminAccountCreation outcome =
                accounts.create(
                        input.toDraft(), actorId(authentication), CorrelationId.current(request));
        // 201 pour une création réelle, 200 pour un rejeu qui ne fait que constater.
        return ResponseEntity.status(outcome.created() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(outcome.account());
    }

    @PostMapping("/admin/security/accounts/{accountId}/status")
    public AdminSecurityView.Account changeStatus(
            @PathVariable("accountId") UUID accountId,
            @Valid @RequestBody AdminAccountStatusInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return accounts.changeStatus(
                accountId,
                input.status(),
                input.reason(),
                actorId(authentication),
                CorrelationId.current(request));
    }

    /**
     * Émet un lien d'activation ou de récupération d'accès.
     *
     * <p>Le lien est envoyé par e-mail au titulaire (bienvenue/activation ou réinitialisation).
     * Le jeton est EN OUTRE remis UNE SEULE FOIS dans cette réponse — repli pour un relais
     * manuel si l'e-mail n'aboutit pas. Il n'est stocké nulle part en clair et ne pourra pas
     * être relu. Le titulaire pose lui-même son mot de passe : l'administration ne le connaît
     * jamais.
     */
    @PostMapping("/admin/security/accounts/{accountId}/password-reset")
    public AdminCredentialTokenView issueCredentialToken(
            @PathVariable("accountId") UUID accountId,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        AccountCredentialService.IssuedToken issued =
                credentialLinks.issueAndNotify(
                        accountId, actorId(authentication), CorrelationId.current(request));
        return new AdminCredentialTokenView(
                issued.token(), issued.expiresAt().toString(), issued.activation());
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/admin/security/accounts/{accountId}")
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(
            @PathVariable("accountId") UUID accountId,
            @Valid @RequestBody AdminReasonInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        accounts.delete(
                accountId, input.reason(), actorId(authentication), CorrelationId.current(request));
    }

    /**
     * Accorde ou retire une permission à un rôle (matrice d'octroi). Restitue la ligne de
     * matrice à jour. L'autorisation fine ({@code IAM.ROLE.ASSIGN}) est portée par le service.
     */
    @PostMapping("/admin/security/roles/{roleId}/permissions")
    public AdminSecurityView.PermissionRow setRolePermission(
            @PathVariable("roleId") UUID roleId,
            @Valid @RequestBody RolePermissionInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return rolePermissions.setGrant(
                roleId,
                input.permissionId(),
                input.granted(),
                actorId(authentication),
                CorrelationId.current(request));
    }

    @PostMapping("/admin/security/accounts/{accountId}/two-factor/reset")
    public AdminSecurityView.Account resetTwoFactor(
            @PathVariable("accountId") UUID accountId,
            @Valid @RequestBody AdminReasonInput input,
            JwtAuthenticationToken authentication,
            HttpServletRequest request) {
        return accounts.resetTwoFactor(
                accountId, input.reason(), actorId(authentication), CorrelationId.current(request));
    }

    /**
     * Identifiant de l'acteur pour l'audit : le sujet du jeton s'il est un UUID,
     * {@code null} sinon — l'audit préfère un acteur absent à un acteur fabriqué.
     */
    private static UUID actorId(JwtAuthenticationToken authentication) {
        String subject = authentication.getToken().getSubject();
        if (subject == null) {
            return null;
        }
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException notAUuid) {
            return null;
        }
    }
}
