import { describe, expect, it } from 'vitest';
import { createPkcePair, randomToken } from './pkce';

const BASE64URL = /^[A-Za-z0-9_-]+$/u;

describe('PKCE', () => {
  it('produit un vérificateur base64url d’au moins 43 caractères (RFC 7636)', () => {
    const token = randomToken(32);
    expect(token).toMatch(BASE64URL);
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it('génère des jetons distincts à chaque appel', () => {
    expect(randomToken()).not.toBe(randomToken());
  });

  it('renvoie un défi S256 base64url, distinct du vérificateur', async () => {
    const pair = await createPkcePair();
    expect(pair.method).toBe('S256');
    expect(pair.verifier).toMatch(BASE64URL);
    expect(pair.challenge).toMatch(BASE64URL);
    // Le défi est une empreinte, jamais le secret lui-même.
    expect(pair.challenge).not.toBe(pair.verifier);
    // Sans remplissage : aucune URL n'a à ré-encoder un « = ».
    expect(pair.challenge.includes('=')).toBe(false);
  });

  it('recalcule le même défi pour un vérificateur donné (déterminisme S256)', async () => {
    const first = await createPkcePair();
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(first.verifier),
    );
    let binary = '';
    for (const byte of new Uint8Array(digest)) {
      binary += String.fromCharCode(byte);
    }
    const expected = btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
    expect(first.challenge).toBe(expected);
  });
});
