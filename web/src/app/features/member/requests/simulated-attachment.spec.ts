import { describe, expect, it } from 'vitest';
import { formatSimulatedAttachmentSize, selectSimulatedAttachments } from './simulated-attachment';

function files(...values: File[]): FileList {
  return Object.assign(values, {
    item: (index: number) => values[index] ?? null,
  }) as unknown as FileList;
}

describe('pièces jointes simulées', () => {
  it('ne conserve que les métadonnées autorisées', () => {
    const file = new File(['contenu non lu par le code'], 'preuve-fictive.pdf', {
      type: 'application/pdf',
    });
    const selection = selectSimulatedAttachments(files(file), 0, 'test');
    expect(selection.error).toBeNull();
    expect(selection.accepted[0]).toEqual({
      id: 'test-1',
      fileName: 'preuve-fictive.pdf',
      sizeBytes: file.size,
      mimeType: 'application/pdf',
      simulated: true,
    });
    expect(Object.keys(selection.accepted[0] ?? {})).not.toContain('content');
    expect(formatSimulatedAttachmentSize(2048)).toBe('2 Ko');
  });

  it('rejette un format ou une taille hors limites', () => {
    const executable = new File(['x'], 'danger.exe', { type: 'application/octet-stream' });
    expect(selectSimulatedAttachments(files(executable), 0, 'test').error).toContain('PDF');

    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.pdf', {
      type: 'application/pdf',
    });
    expect(selectSimulatedAttachments(files(oversized), 0, 'test').error).toContain('5 Mo');
  });
});
