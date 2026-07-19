import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { ContributionsGateway } from './contributions/contributions-gateway';
import type { DashboardGateway } from './dashboard/dashboard-gateway';
import type { DocumentsGateway } from './documents/documents-gateway';
import type { EnrollmentGateway } from './enrollment-form/enrollment-gateway';
import type { MemberDetailGateway } from './member-detail/member-detail-gateway';
import type { PaymentsGateway } from './payments/payments-gateway';
import type { RecoveryGateway } from './recovery/recovery-gateway';
import type { ReceiptsGateway } from './receipts/receipts-gateway';
import type { ReportingGateway } from './reporting/reporting-gateway';
import type { RequestsGateway } from './requests/requests-gateway';
import type { AdminSecurityGateway } from './security/admin-security-gateway';

export const UNAVAILABLE_DASHBOARD_GATEWAY: DashboardGateway = {
  exercises: [],
  load: () => unavailableFeature$('BO-001'),
};

/** Les routes GED exposent encore Resource/PageResource, sans projection métier stable. */
export const UNAVAILABLE_DOCUMENTS_GATEWAY: DocumentsGateway = {
  search: () => unavailableFeature$('BO-023'),
};

export const UNAVAILABLE_MEMBER_DETAIL_GATEWAY: MemberDetailGateway = {
  load: () => unavailableFeature$('BO-003'),
};

export const UNAVAILABLE_ENROLLMENT_GATEWAY: EnrollmentGateway = {
  load: () => unavailableFeature$('BO-009'),
  saveDraft: () => unavailableFeature$('BO-009'),
  checkRegistration: () => unavailableFeature$('BO-009'),
  scanDocument: () => unavailableFeature$('BO-009'),
  submit: () => unavailableFeature$('BO-009'),
};

export const UNAVAILABLE_CONTRIBUTIONS_GATEWAY: ContributionsGateway = {
  searchCalls: () => unavailableFeature$('BO-011'),
};

export const UNAVAILABLE_PAYMENTS_GATEWAY: PaymentsGateway = {
  search: () => unavailableFeature$('BO-014'),
  reconcile: () => unavailableFeature$('BO-014'),
  reportAnomaly: () => unavailableFeature$('BO-014'),
};

export const UNAVAILABLE_RECOVERY_GATEWAY: RecoveryGateway = {
  search: () => unavailableFeature$('BO-017'),
};

/**
 * `/receipts*` ne fournit que `Resource`/`PageResource`. Sans projection typée des
 * montants, membres, paiements, statuts et corrections, le profil HTTP échoue fermé.
 */
export const UNAVAILABLE_RECEIPTS_GATEWAY: ReceiptsGateway = {
  search: () => unavailableFeature$('BO-016'),
};

export const UNAVAILABLE_REPORTING_GATEWAY: ReportingGateway = {
  load: () => unavailableFeature$('BO-028'),
};

/**
 * `/service-requests*` n'expose actuellement que `Resource`/`PageResource`, sans
 * projection métier stable pour BO-021/022. Un mode HTTP explicite vaut mieux qu'un
 * mapping conjectural de `attributes`.
 */
export const UNAVAILABLE_REQUESTS_GATEWAY: RequestsGateway = {
  search: () => unavailableFeature$('BO-021'),
  get: () => unavailableFeature$('BO-022'),
};

export const UNAVAILABLE_ADMIN_SECURITY_GATEWAY: AdminSecurityGateway = {
  load: () => unavailableFeature$('BO-030'),
};
