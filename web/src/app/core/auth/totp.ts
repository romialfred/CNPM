/**
 * TOTP natif (RFC 6238, HMAC-SHA1, 6 chiffres, période 30 s).
 *
 * Refonte du 2FA « façon SafeX 360 » : l'application génère elle-même le secret, l'URI
 * `otpauth://` et vérifie les codes — aucun fournisseur d'identité externe (Keycloak est
 * abandonné pour le 2FA, cf. open-decisions AUTH-DEC-020). L'implémentation est portée du
 * `TotpService` Java de SafeX et validée contre les vecteurs de test officiels RFC 6238.
 *
 * En mode démo, le secret vit côté client pour permettre un enrôlement réel et scannable
 * avec Microsoft Authenticator. En production, la génération et la vérification appartiennent
 * au backend (portage à venir) : ce module reste alors cantonné au formatage d'affichage.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD_SECONDS = 30;
const DIGITS = 6;

/** Secret aléatoire (20 octets → 32 caractères Base32), comme SafeX. */
export function randomBase32Secret(byteLength = 20): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/** Regroupe le secret par blocs de 4 pour une saisie manuelle lisible. */
export function formatManualKey(secret: string): string {
  return (secret.match(/.{1,4}/gu) ?? [secret]).join(' ');
}

/**
 * URI `otpauth://totp/...` scannable par toute application d'authentification.
 * L'`issuer` est le titre affiché (« CNPM »), la partie compte la ligne du dessous.
 */
export function buildOtpauthUri(params: {
  readonly issuer: string;
  readonly account: string;
  readonly secret: string;
}): string {
  const label = encodeURIComponent(`${params.issuer}:${params.account}`);
  const query = new URLSearchParams({
    secret: params.secret,
    issuer: params.issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  }).toString();
  return `otpauth://totp/${label}?${query}`;
}

/** Génère le code TOTP à un pas donné. */
export async function generateTotpCode(secret: string, step: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const counter = new ArrayBuffer(8);
  const view = new DataView(counter);
  view.setUint32(0, Math.floor(step / 2 ** 32));
  view.setUint32(4, step >>> 0);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
  const offset = signature[signature.length - 1] & 0x0f;
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff);
  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0');
}

/**
 * Valide un code sur une fenêtre de ±1 pas (tolérance d'horloge de 30 s), comme SafeX.
 * Retourne le pas accepté, ou `-1`. L'appelant peut refuser un pas déjà consommé (anti-rejeu).
 */
export async function validateTotp(
  secret: string,
  candidate: string,
  epochSeconds = Math.floor(Date.now() / 1000),
): Promise<number> {
  if (!/^\d{6}$/u.test(candidate)) {
    return -1;
  }
  const currentStep = Math.floor(epochSeconds / PERIOD_SECONDS);
  for (let step = currentStep - 1; step <= currentStep + 1; step += 1) {
    const expected = await generateTotpCode(secret, step);
    if (constantTimeEquals(expected, candidate)) {
      return step;
    }
  }
  return -1;
}

/** Codes de secours mono-usage (format `XXXXXXXX-XXXX`), comme SafeX. */
export function generateRecoveryCodes(count = 8): readonly string[] {
  const codes: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const bytes = new Uint8Array(9);
    crypto.getRandomValues(bytes);
    const raw = base32Encode(bytes);
    codes.push(`${raw.slice(0, 8)}-${raw.slice(8, 12)}`);
  }
  return codes;
}

function constantTimeEquals(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return diff === 0;
}

export function base32Encode(bytes: Uint8Array): string {
  let output = '';
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      output += BASE32_ALPHABET[(buffer >> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }
  if (bitsLeft > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bitsLeft)) & 31];
  }
  return output;
}

export function base32Decode(encoded: string): Uint8Array<ArrayBuffer> {
  const value = encoded.replace(/[=\s]/gu, '').toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const char of value) {
    const digit = BASE32_ALPHABET.indexOf(char);
    if (digit < 0) {
      throw new Error('TOTP_SECRET_INVALID');
    }
    buffer = (buffer << 5) | digit;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  // Adossé à un ArrayBuffer concret : `crypto.subtle` refuse un Uint8Array potentiellement
  // sur SharedArrayBuffer (typage strict TS DOM).
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out;
}
