import type { SimulatedMemberAttachment } from './member-requests-gateway';

export const MAX_SIMULATED_ATTACHMENTS = 3;
export const MAX_SIMULATED_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'] as const;

export interface SimulatedAttachmentSelection {
  readonly accepted: readonly SimulatedMemberAttachment[];
  readonly error: string | null;
}

/**
 * Extrait seulement des métadonnées. Aucun `FileReader`, buffer, URL objet ou upload
 * n'est créé côté navigateur.
 */
export function selectSimulatedAttachments(
  files: FileList | null,
  existingCount: number,
  idPrefix: string,
): SimulatedAttachmentSelection {
  if (!files || files.length === 0) return { accepted: [], error: null };
  const remaining = MAX_SIMULATED_ATTACHMENTS - existingCount;
  if (remaining <= 0) {
    return {
      accepted: [],
      error: `Trois pièces jointes maximum sont autorisées.`,
    };
  }

  const accepted: SimulatedMemberAttachment[] = [];
  for (const file of Array.from(files).slice(0, remaining)) {
    const lowerName = file.name.toLocaleLowerCase('fr');
    const extensionAccepted = ACCEPTED_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension),
    );
    if (!extensionAccepted) {
      return {
        accepted: [],
        error: 'Formats acceptés : PDF, PNG, JPG ou JPEG.',
      };
    }
    if (file.size > MAX_SIMULATED_ATTACHMENT_BYTES) {
      return {
        accepted: [],
        error: 'Chaque pièce jointe doit peser au maximum 5 Mo.',
      };
    }
    accepted.push({
      id: `${idPrefix}-${existingCount + accepted.length + 1}`,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      simulated: true,
    });
  }

  return {
    accepted,
    error:
      files.length > remaining
        ? `Seules ${remaining} pièce${remaining > 1 ? 's' : ''} ont été retenues pour respecter la limite de trois.`
        : null,
  };
}

export function formatSimulatedAttachmentSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} octets`;
  return `${Math.ceil(sizeBytes / 1024)} Ko`;
}
