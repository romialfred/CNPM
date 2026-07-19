import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { HomeGateway } from './home/home-gateway';
import type { ShowcaseGateway } from './showcase/showcase-gateway';

export const UNAVAILABLE_HOME_GATEWAY: HomeGateway = {
  loadHighlights: () => unavailableFeature$('PUB-001'),
};

export const UNAVAILABLE_SHOWCASE_GATEWAY: ShowcaseGateway = {
  listPublished: () => unavailableFeature$('PUB-004/PUB-005'),
  findBySlug: () => unavailableFeature$('PUB-006'),
};
