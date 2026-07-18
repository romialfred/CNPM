import { InjectionToken } from '@angular/core';

export type UuidFactory = () => string;

/** Générateur partagé de valeurs UUID non sensibles pour corrélation et idempotence. */
export const CNPM_UUID_FACTORY = new InjectionToken<UuidFactory>('CNPM_UUID_FACTORY', {
  providedIn: 'root',
  factory: () => secureUuidV4,
});

function secureUuidV4(): string {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues !== 'function') {
    throw new Error(
      'Un générateur cryptographique est requis pour créer un identifiant de requête.',
    );
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}
