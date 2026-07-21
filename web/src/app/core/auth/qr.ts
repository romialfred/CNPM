import { toDataURL } from 'qrcode';

/**
 * Rend un VRAI QR code scannable (PNG data URI) à partir d'une URI `otpauth://`.
 *
 * Contrairement au motif décoratif précédent, cette image est un code QR valide que
 * Microsoft Authenticator (ou toute application TOTP) peut scanner directement. La
 * génération est locale — aucune image ni requête externe.
 */
export function renderOtpauthQr(uri: string): Promise<string> {
  return toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: { dark: '#0b123b', light: '#ffffff' },
  });
}
