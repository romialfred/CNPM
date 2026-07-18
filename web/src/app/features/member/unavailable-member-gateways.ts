import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { MemberHomeGateway } from './home/member-home-gateway';

export const UNAVAILABLE_MEMBER_HOME_GATEWAY: MemberHomeGateway = {
  load: () => unavailableFeature$('MP-001'),
};
