import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  ReferenceValueConflictError,
  ReferenceValueNotFoundError,
  type ReferenceValue,
  type ReferenceValueInput,
  type ReferenceValuePage,
  type ReferenceValueQuery,
  type ReferenceValuesGateway,
  type ReferenceValueUpdate,
} from './settings-gateway';

/**
 * Jeu fermé et entièrement fictif pour BO-033.
 *
 * Les domaines commencent par `DEMO_` afin qu'aucun ne soit interprété comme une
 * nomenclature officielle. L'écran conserve un champ texte et ne propose aucune liste
 * institutionnelle inventée.
 */
const INITIAL_VALUES: readonly ReferenceValue[] = [
  {
    id: '33000000-0000-4000-8000-000000000001',
    domain: 'DEMO_CLASSE_INTERNE',
    code: 'DEMO_STANDARD',
    label: 'Classe standard fictive',
    sortOrder: 10,
    active: true,
    validFrom: null,
    validTo: null,
    version: 1,
  },
  {
    id: '33000000-0000-4000-8000-000000000002',
    domain: 'DEMO_CLASSE_INTERNE',
    code: 'DEMO_ARCHIVEE',
    label: 'Classe archivée fictive',
    sortOrder: 20,
    active: false,
    validFrom: null,
    validTo: null,
    version: 3,
  },
  {
    id: '33000000-0000-4000-8000-000000000003',
    domain: 'DEMO_USAGE_INTERNE',
    code: 'DEMO_ASSISTE',
    label: 'Usage assisté fictif',
    sortOrder: 10,
    active: true,
    validFrom: null,
    validTo: null,
    version: 2,
  },
];

@Injectable()
export class DemoSettingsGateway implements ReferenceValuesGateway {
  private values = INITIAL_VALUES.map((value) => ({ ...value }));
  private nextId = 4;

  list(query: ReferenceValueQuery): Observable<ReferenceValuePage> {
    const domain = query.domain?.trim();
    const matching = this.values
      .filter((value) => !domain || value.domain === domain)
      .sort(
        (left, right) =>
          left.domain.localeCompare(right.domain, 'fr') ||
          left.sortOrder - right.sortOrder ||
          left.code.localeCompare(right.code, 'fr'),
      );
    const start = Math.max(0, query.page - 1) * query.pageSize;
    return of({
      rows: matching.slice(start, start + query.pageSize).map((value) => ({ ...value })),
      totalItems: matching.length,
      totalPages: Math.ceil(matching.length / query.pageSize),
    });
  }

  create(input: ReferenceValueInput): Observable<ReferenceValue> {
    const normalized = normalizeInput(input);
    const existing = this.values.find(
      (value) => value.domain === normalized.domain && value.code === normalized.code,
    );
    if (existing) {
      if (
        existing.label === normalized.label &&
        existing.sortOrder === normalized.sortOrder &&
        existing.active === normalized.active
      ) {
        return of({ ...existing });
      }
      return throwError(() => new ReferenceValueConflictError());
    }

    const created: ReferenceValue = {
      id: `33000000-0000-4000-8000-${String(this.nextId++).padStart(12, '0')}`,
      ...normalized,
      validFrom: null,
      validTo: null,
      version: 0,
    };
    this.values = [...this.values, created];
    return of({ ...created });
  }

  update(
    id: string,
    expectedVersion: number,
    changes: ReferenceValueUpdate,
  ): Observable<ReferenceValue> {
    const index = this.values.findIndex((value) => value.id === id);
    if (index < 0) {
      return throwError(() => new ReferenceValueNotFoundError());
    }
    const current = this.values[index];
    if (current.version !== expectedVersion) {
      return throwError(() => new ReferenceValueConflictError());
    }

    const label = changes.label !== undefined ? changes.label.trim() : current.label;
    const sortOrder = changes.sortOrder ?? current.sortOrder;
    const active = changes.active ?? current.active;
    if (label === current.label && sortOrder === current.sortOrder && active === current.active) {
      return of({ ...current });
    }

    const updated: ReferenceValue = {
      ...current,
      label,
      sortOrder,
      active,
      version: current.version + 1,
    };
    this.values = this.values.map((value, valueIndex) => (valueIndex === index ? updated : value));
    return of({ ...updated });
  }
}

function normalizeInput(input: ReferenceValueInput) {
  return {
    domain: input.domain.trim(),
    code: input.code.trim(),
    label: input.label.trim(),
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  };
}
