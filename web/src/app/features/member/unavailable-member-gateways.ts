import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { MemberContributionsGateway } from './contributions/member-contributions-gateway';
import type { MemberDocumentsGateway } from './documents/member-documents-gateway';
import type { MemberHomeGateway } from './home/member-home-gateway';
import type { MemberProfileGateway } from './profile/member-profile-gateway';
import type { MemberReceiptsGateway } from './receipts/member-receipts-gateway';
import type { MemberRequestsGateway } from './requests/member-requests-gateway';
import type { MemberShowcaseGateway } from './showcase/member-showcase-gateway';
import type { MemberUsersGateway } from './users/member-users-gateway';

export const UNAVAILABLE_MEMBER_HOME_GATEWAY: MemberHomeGateway = {
  load: () => unavailableFeature$('MP-001'),
};

/**
 * Le contrat HTTP expose encore `GET /portal/contributions` comme `Resource`
 * générique et aucun endpoint de détail : brancher un mapping ici inventerait le
 * contrat. MP-002/MP-003 restent donc explicitement indisponibles hors mode démo.
 */
export const UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY: MemberContributionsGateway = {
  list: () => unavailableFeature$('MP-002'),
  loadDetail: () => unavailableFeature$('MP-003'),
};

/** `/receipts*` reste générique et ne fournit aucun document membre typé. */
export const UNAVAILABLE_MEMBER_RECEIPTS_GATEWAY: MemberReceiptsGateway = {
  list: () => unavailableFeature$('MP-007'),
  loadDetail: () => unavailableFeature$('MP-008'),
};

/** OpenAPI ne porte encore que Resource/PageResource/ResourceInput pour ces routes. */
export const UNAVAILABLE_MEMBER_REQUESTS_GATEWAY: MemberRequestsGateway = {
  list: () => unavailableFeature$('MP-009'),
  create: () => unavailableFeature$('MP-010'),
  loadDetail: () => unavailableFeature$('MP-011'),
  addMessage: () => unavailableFeature$('MP-011'),
};

/** `/portal/documents` ne décrit encore aucune projection documentaire membre typée. */
export const UNAVAILABLE_MEMBER_DOCUMENTS_GATEWAY: MemberDocumentsGateway = {
  list: () => unavailableFeature$('MP-012'),
};

/** Aucun endpoint typé et auto-scopé ne porte encore le profil membre. */
export const UNAVAILABLE_MEMBER_PROFILE_GATEWAY: MemberProfileGateway = {
  load: () => unavailableFeature$('MP-013'),
};

/** Aucun endpoint membre ne garantit encore le périmètre d’organisation IAM. */
export const UNAVAILABLE_MEMBER_USERS_GATEWAY: MemberUsersGateway = {
  list: () => unavailableFeature$('MP-014'),
};

/** L’addendum R4 n’est pas promu dans OpenAPI/RBAC/SoD ; tout accès HTTP reste fermé. */
export const UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY: MemberShowcaseGateway = {
  loadDraft: (feature) => unavailableFeature$(feature),
  storeLocalDraft: () => unavailableFeature$('MP-015'),
};
