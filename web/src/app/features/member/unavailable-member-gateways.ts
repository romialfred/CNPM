import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { MemberContributionsGateway } from './contributions/member-contributions-gateway';
import type { MemberHomeGateway } from './home/member-home-gateway';
import type { MemberRequestsGateway } from './requests/member-requests-gateway';

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

/** OpenAPI ne porte encore que Resource/PageResource/ResourceInput pour ces routes. */
export const UNAVAILABLE_MEMBER_REQUESTS_GATEWAY: MemberRequestsGateway = {
  list: () => unavailableFeature$('MP-009'),
  create: () => unavailableFeature$('MP-010'),
  loadDetail: () => unavailableFeature$('MP-011'),
  addMessage: () => unavailableFeature$('MP-011'),
};
