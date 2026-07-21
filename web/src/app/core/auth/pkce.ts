/**
 * PKCE (RFC 7636) et aléas de sécurité pour le flux Authorization Code.
 *
 * Le vérificateur et le défi sont produits par la Web Crypto du navigateur — jamais un
 * générateur maison : `code_verifier` doit être imprévisible, et le défi doit être le
 * SHA-256 encodé en base64url du vérificateur (méthode S256, la seule acceptée ici ;
 * `plain` exposerait le secret dans l'URL d'autorisation).
 */

export interface PkcePair {
  /** Secret conservé côté client, envoyé seulement à l'échange de code. */
  readonly verifier: string;
  /** Empreinte publique, envoyée dans l'URL d'autorisation. */
  readonly challenge: string;
  readonly method: 'S256';
}

/** base64url sans remplissage, seule forme admise dans une URL par RFC 7636. */
function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

/**
 * Jeton aléatoire base64url. Sert au `code_verifier` (RFC 7636 : 43 à 128 caractères)
 * comme au `state`/`nonce` anti-rejeu. 32 octets donnent ~43 caractères, le minimum.
 */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function createPkcePair(): Promise<PkcePair> {
  const verifier = randomToken(32);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)), method: 'S256' };
}
