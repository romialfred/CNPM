import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { type MemberEvent, type MemberEventsGateway } from './member-events.gateway';

interface EventResponse {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly type: string;
  readonly startAt: string;
  readonly endAt?: string | null;
  readonly capacity?: number | null;
  readonly status: string;
}

interface EventPageResponse {
  readonly items: readonly EventResponse[];
}

/** Adaptateur HTTP des actualités/événements, sans repli vers des données locales. */
@Injectable()
export class HttpMemberEventsGateway implements MemberEventsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(): Observable<readonly MemberEvent[]> {
    return this.http
      .get<EventPageResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/events?page=0&size=50'))
      .pipe(
        map((response) => response.items.map(mapEvent)),
        catchError((error: unknown) => throwError(() => error)),
      );
  }
}

function mapEvent(item: EventResponse): MemberEvent {
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    type: item.type,
    startAt: item.startAt,
    endAt: item.endAt ?? null,
    capacity: item.capacity ?? null,
    status: item.status,
  };
}
