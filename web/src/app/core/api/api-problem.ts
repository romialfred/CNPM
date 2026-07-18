import { HttpErrorResponse } from '@angular/common/http';

export interface ApiFieldError {
  readonly field?: string;
  readonly code?: string;
  readonly message?: string;
}

/** Modèle exact de `components.schemas.Problem` dans le contrat OpenAPI. */
export interface ApiProblem {
  readonly timestamp: string;
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly fieldErrors?: readonly ApiFieldError[];
  readonly correlationId: string;
}

export type ApiErrorCategory =
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not-found'
  | 'conflict'
  | 'business-rule'
  | 'rate-limit'
  | 'server'
  | 'network'
  | 'unknown';

export class CnpmApiError extends Error {
  override readonly name = 'CnpmApiError';

  constructor(
    readonly category: ApiErrorCategory,
    readonly problem: ApiProblem,
    readonly retryable: boolean,
    options?: ErrorOptions,
  ) {
    super(problem.message, options);
  }

  get status(): number {
    return this.problem.status;
  }

  get code(): string {
    return this.problem.code;
  }

  get correlationId(): string {
    return this.problem.correlationId;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function mapHttpError(error: HttpErrorResponse, requestCorrelationId: string): CnpmApiError {
  const category = categoryForStatus(error.status);
  const responseProblem = readProblem(error.error);
  const responseCorrelationId = error.headers.get('X-Correlation-Id');
  const correlationId = firstUuid(
    responseProblem?.correlationId,
    responseCorrelationId,
    requestCorrelationId,
  );
  const status = error.status;
  const problem: ApiProblem = {
    timestamp: responseProblem?.timestamp ?? new Date().toISOString(),
    status,
    code: responseProblem?.code ?? fallbackCode(status),
    message: responseProblem?.message ?? fallbackMessage(status),
    ...(responseProblem?.fieldErrors ? { fieldErrors: responseProblem.fieldErrors } : {}),
    correlationId,
  };

  return new CnpmApiError(category, problem, isRetryable(category), { cause: error });
}

export function categoryForStatus(status: number): ApiErrorCategory {
  switch (status) {
    case 0:
      return 'network';
    case 400:
      return 'validation';
    case 401:
      return 'authentication';
    case 403:
      return 'authorization';
    case 404:
      return 'not-found';
    case 409:
      return 'conflict';
    case 422:
      return 'business-rule';
    case 429:
      return 'rate-limit';
    default:
      return status >= 500 && status <= 599 ? 'server' : 'unknown';
  }
}

function readProblem(value: unknown): ApiProblem | null {
  if (!isRecord(value)) {
    return null;
  }

  const timestamp = typeof value['timestamp'] === 'string' ? value['timestamp'] : null;
  const code = typeof value['code'] === 'string' ? value['code'] : null;
  const message = typeof value['message'] === 'string' ? value['message'] : null;
  const correlationId = typeof value['correlationId'] === 'string' ? value['correlationId'] : null;

  if (!timestamp || !code || !message || !correlationId) {
    return null;
  }

  const fieldErrors = readFieldErrors(value['fieldErrors']);
  return {
    timestamp,
    status: typeof value['status'] === 'number' ? value['status'] : 0,
    code,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
    correlationId,
  };
}

function readFieldErrors(value: unknown): readonly ApiFieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter(isRecord).map((entry) => ({
    ...(typeof entry['field'] === 'string' ? { field: entry['field'] } : {}),
    ...(typeof entry['code'] === 'string' ? { code: entry['code'] } : {}),
    ...(typeof entry['message'] === 'string' ? { message: entry['message'] } : {}),
  }));
}

function firstUuid(...candidates: readonly (string | null | undefined)[]): string {
  return (
    candidates.find(
      (candidate): candidate is string =>
        candidate !== null && candidate !== undefined && UUID_PATTERN.test(candidate),
    ) ?? '00000000-0000-4000-8000-000000000000'
  );
}

function isRetryable(category: ApiErrorCategory): boolean {
  return category === 'network' || category === 'rate-limit' || category === 'server';
}

function fallbackCode(status: number): string {
  switch (status) {
    case 0:
      return 'NETWORK_ERROR';
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'AUTHENTICATION_REQUIRED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'RESOURCE_NOT_FOUND';
    case 409:
      return 'STATE_CONFLICT';
    case 422:
      return 'BUSINESS_RULE_VIOLATION';
    case 429:
      return 'RATE_LIMITED';
    default:
      return status >= 500 && status <= 599 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
  }
}

function fallbackMessage(status: number): string {
  switch (categoryForStatus(status)) {
    case 'network':
      return 'Le service CNPM est momentanément inaccessible.';
    case 'validation':
      return 'La requête contient une donnée invalide.';
    case 'authentication':
      return 'Une authentification valide est requise.';
    case 'authorization':
      return 'Vous ne disposez pas de l’autorisation nécessaire.';
    case 'not-found':
      return 'La ressource demandée est introuvable.';
    case 'conflict':
      return 'L’opération est incompatible avec l’état actuel.';
    case 'business-rule':
      return 'Une règle métier empêche cette opération.';
    case 'rate-limit':
      return 'Trop de requêtes ont été envoyées. Réessayez ultérieurement.';
    case 'server':
      return 'Le service CNPM rencontre une erreur temporaire.';
    case 'unknown':
      return 'La requête n’a pas pu être traitée.';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
