/**
 * Profil du livrable client. Ce fichier statique peut être remplacé par le
 * déploiement sans reconstruire les bundles Angular.
 */
globalThis.__CNPM_RUNTIME_CONFIG__ = Object.freeze({
  // 'demo' : tous les écrans sont servis sur fixtures riches, sans backend — profil
  // propriétaire à accès complet. Idéal pour une démonstration de bout en bout.
  // Repasser à 'http' pour l'authentification native réelle contre le backend (proxy /v1 -> :8080).
  dataMode: 'demo',
  baseUrl: '/v1',
});
