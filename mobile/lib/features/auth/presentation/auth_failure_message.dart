import 'package:cnpm_mobile/features/auth/domain/auth_failure.dart';

String? authFailureMessage(AuthFailureKind? failure) {
  return switch (failure) {
    null => null,
    AuthFailureKind.invalidCredentials =>
      'Connexion impossible. Vérifiez les informations saisies.',
    AuthFailureKind.invalidSecondFactor =>
      'Vérification impossible. Vérifiez le code saisi.',
    AuthFailureKind.expiredChallenge =>
      'Cette vérification a expiré. Revenez à la connexion pour recommencer.',
    AuthFailureKind.unavailable =>
      'La connexion réelle est indisponible tant que le client OIDC/PKCE n’est pas configuré.',
  };
}
