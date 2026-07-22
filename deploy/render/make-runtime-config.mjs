/**
 * Genere le runtime-config.js publie par le site statique, a partir de variables
 * d'environnement fournies par Render au build. Usage :
 *
 *   node deploy/render/make-runtime-config.mjs <fichier-de-sortie>
 *
 * Variables lues :
 *   CNPM_DATA_MODE  'http' (defaut) ou 'demo'
 *   API_HOST        hote du backend (ex. fromService host) -> baseUrl https://<host>
 *   CNPM_BASE_URL   force explicitement le baseUrl (prioritaire sur API_HOST)
 *
 * En 'http', le front appelle le backend en origine distincte ; le backend autorise
 * cette origine via CNPM_WEB_CORS_ALLOWED_ORIGINS. En 'demo', aucun backend n'est requis.
 */
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
if (!out) {
  console.error('Chemin de sortie requis.');
  process.exit(1);
}

const mode = process.env.CNPM_DATA_MODE === 'demo' ? 'demo' : 'http';
const host = (process.env.API_HOST || '').trim();
const baseUrl = (process.env.CNPM_BASE_URL || '').trim() || (host ? `https://${host}` : '/v1');

const body = `globalThis.__CNPM_RUNTIME_CONFIG__=Object.freeze(${JSON.stringify({ dataMode: mode, baseUrl })});\n`;
writeFileSync(out, body);
console.log(`runtime-config -> dataMode=${mode} baseUrl=${baseUrl}`);
