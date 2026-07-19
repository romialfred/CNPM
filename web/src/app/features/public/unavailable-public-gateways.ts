import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type { HomeGateway } from './home/home-gateway';
import type { EditorialGateway } from './editorial/editorial-gateway';
import type { ShowcaseGateway } from './showcase/showcase-gateway';
import type { ReceiptVerificationGateway } from './verification/receipt-verification-gateway';

export const UNAVAILABLE_HOME_GATEWAY: HomeGateway = {
  loadHighlights: () => unavailableFeature$('PUB-001'),
};

export const UNAVAILABLE_SHOWCASE_GATEWAY: ShowcaseGateway = {
  listPublished: () => unavailableFeature$('PUB-004/PUB-005'),
  findBySlug: () => unavailableFeature$('PUB-006'),
};

export const UNAVAILABLE_EDITORIAL_GATEWAY: EditorialGateway = {
  listArticles: () => unavailableFeature$('PUB-009'),
  findArticle: () => unavailableFeature$('PUB-010'),
  listEvents: () => unavailableFeature$('PUB-011'),
};

export const UNAVAILABLE_RECEIPT_VERIFICATION_GATEWAY: ReceiptVerificationGateway = {
  verify: () => unavailableFeature$('PUB-015/REC-006'),
};
