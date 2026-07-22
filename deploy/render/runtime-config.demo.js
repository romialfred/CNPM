/**
 * Configuration d'execution du deploiement de DEMONSTRATION (Render, site statique).
 *
 * Le build Angular copie ce fichier sur `runtime-config.js` dans la sortie publiee.
 * `dataMode: 'demo'` => tous les ecrans fonctionnent sur fixtures, sans aucun backend.
 * Pour un deploiement reel (auth native contre le backend), voir deploy/render/README.md.
 */
globalThis.__CNPM_RUNTIME_CONFIG__ = Object.freeze({
  dataMode: 'demo',
  baseUrl: '/v1',
});
