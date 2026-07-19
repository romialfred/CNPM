import { Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';
import type { SessionGateway, SessionIdentity } from './session-gateway';

/**
 * Adaptateur de démonstration du port `SESSION_GATEWAY`.
 *
 * L'identité est celle de la persona de démonstration déjà utilisée par AUTH-001
 * (`demo.agent@cnpm.example`), et non une personne réelle : `CLAUDE.md` interdit
 * toute donnée réelle de membre ou d'agent dans les fixtures et les captures.
 *
 * L'adaptateur réel appellera `GET /auth/me`, déjà exposé par le backend. Seul le
 * point d'assemblage des routes changera.
 */
@Injectable()
export class DemoSessionGateway implements SessionGateway {
  readonly identity: Observable<SessionIdentity | null> = of({
    displayName: 'Agent de démonstration',
    roleLabel: 'Administrateur',
    exerciseLabel: '2024',
    notificationCount: 8,
    demoMode: true,
    permissions: [
      'MEMBER.READ',
      'MEMBER.WRITE',
      'ENROLLMENT.CREATE',
      'ENROLLMENT.REVIEW',
      'ENROLLMENT.APPROVE',
    ],
  });
}
