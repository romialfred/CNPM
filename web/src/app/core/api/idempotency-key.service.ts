import { inject, Injectable } from '@angular/core';

import { CNPM_UUID_FACTORY, type UuidFactory } from './request-id';

/**
 * Conserve une clé par intention de commande. Un retry emploie le même identifiant de
 * commande ; `release` n'est appelé qu'après une réponse terminale ou l'abandon explicite.
 */
@Injectable({ providedIn: 'root' })
export class IdempotencyKeyService {
  private readonly uuidFactory: UuidFactory = inject(CNPM_UUID_FACTORY);
  private readonly keys = new Map<string, string>();

  getOrCreate(commandId: string): string {
    const normalizedCommandId = commandId.trim();
    if (normalizedCommandId.length === 0) {
      throw new Error('Un identifiant de commande est requis pour garantir l’idempotence.');
    }

    const existing = this.keys.get(normalizedCommandId);
    if (existing) {
      return existing;
    }

    const key = this.uuidFactory();
    this.keys.set(normalizedCommandId, key);
    return key;
  }

  release(commandId: string): void {
    this.keys.delete(commandId.trim());
  }

  clear(): void {
    this.keys.clear();
  }
}
