enum AuthMode { demo, unavailable }

final class AppConfig {
  const AppConfig({required this.authMode});

  const AppConfig.demo() : authMode = AuthMode.demo;

  factory AppConfig.fromEnvironment() {
    const configuredMode = String.fromEnvironment(
      'CNPM_AUTH_MODE',
      defaultValue: 'unavailable',
    );

    return AppConfig(
      authMode: configuredMode == 'demo' ? AuthMode.demo : AuthMode.unavailable,
    );
  }

  final AuthMode authMode;

  bool get isDemo => authMode == AuthMode.demo;
}
