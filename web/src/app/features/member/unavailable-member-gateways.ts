import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { MemberContributionsGateway } from './contributions/member-contributions-gateway';
import type { MemberDocumentsGateway } from './documents/member-documents-gateway';
import type { MemberShowcaseGateway } from './showcase/member-showcase-gateway';
import type { MemberShowcaseAnalyticsGateway } from './showcase-analytics/member-showcase-analytics.gateway';

/**
 * Le contrat HTTP expose encore `GET /portal/contributions` comme `Resource`
 * générique et aucun endpoint de détail : brancher un mapping ici inventerait le
 * contrat. MP-002/MP-003 restent donc explicitement indisponibles hors mode démo.
 */
export const UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY: MemberContributionsGateway = {
  list: () => unavailableFeature$('MP-002'),
  loadDetail: () => unavailableFeature$('MP-003'),
};

/** `/portal/documents` ne décrit encore aucune projection documentaire membre typée. */
export const UNAVAILABLE_MEMBER_DOCUMENTS_GATEWAY: MemberDocumentsGateway = {
  list: () => unavailableFeature$('MP-012'),
};

/** L’addendum R4 n’est pas promu dans OpenAPI/RBAC/SoD ; tout accès HTTP reste fermé. */
export const UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY: MemberShowcaseGateway = {
  loadDraft: (feature) => unavailableFeature$(feature),
  storeLocalDraft: () => unavailableFeature$('MP-015'),
};

/** L’addendum analytics R4 n’est pas promu ; aucun agrégat HTTP n’est supposé sûr. */
export const UNAVAILABLE_MEMBER_SHOWCASE_ANALYTICS_GATEWAY: MemberShowcaseAnalyticsGateway = {
  load: () => unavailableFeature$('MP-017'),
};
