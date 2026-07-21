/**
 * Profil du livrable client. Ce fichier statique peut être remplacé par le
 * déploiement sans reconstruire les bundles Angular.
 */
globalThis.__CNPM_RUNTIME_CONFIG__ = Object.freeze({
  // 'http' : authentification native réelle contre le backend (proxy /v1 -> :8080).
  // Repasser à 'demo' pour parcourir tous les écrans sur fixtures, sans backend.
  dataMode: 'http',
  baseUrl: '/v1',
});
