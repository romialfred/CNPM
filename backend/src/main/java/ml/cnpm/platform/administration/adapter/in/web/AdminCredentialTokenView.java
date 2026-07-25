package ml.cnpm.platform.administration.adapter.in.web;

/**
 * Jeton d'activation ou de récupération, remis UNE SEULE FOIS.
 *
 * <p>Seule son empreinte est conservée en base : ni l'opérateur ni le serveur ne pourront
 * le relire. Si l'opérateur le perd, il en émet un nouveau — ce qui invalide le précédent.
 *
 * @param activation vrai pour une première mise en service (le compte n'avait aucun mot de
 *     passe), faux pour une récupération d'accès ; l'écran n'annonce donc pas une
 *     « réinitialisation » à quelqu'un qui n'a jamais eu de mot de passe
 */
public record AdminCredentialTokenView(String token, String expiresAt, boolean activation) { }
