import type { PaymentOperator, PaymentOperatorKind } from './member-payments-gateway';

/**
 * Catalogue des opérateurs de règlement proposés au membre.
 *
 * Les logos sont des représentations de marque servies en local (`assets/payment/`) ;
 * la couleur de marque n'est qu'une donnée d'accent (appliquée en variable CSS inline,
 * jamais codée en dur dans une feuille de style).
 */
export interface PaymentOperatorDescriptor {
  readonly id: PaymentOperator;
  readonly name: string;
  readonly kind: PaymentOperatorKind;
  readonly logo: string;
  readonly tagline: string;
  readonly brand: string;
}

export const PAYMENT_OPERATORS: readonly PaymentOperatorDescriptor[] = [
  {
    id: 'ORANGE_MONEY',
    name: 'Orange Money',
    kind: 'mobile-money',
    logo: '/assets/payment/orange-money.svg',
    tagline: 'Confirmation par code secret sur votre téléphone',
    brand: '#FF7900',
  },
  {
    id: 'WAVE',
    name: 'Wave',
    kind: 'mobile-money',
    logo: '/assets/payment/wave.svg',
    tagline: 'Validation dans l’application Wave',
    brand: '#1DC8FF',
  },
  {
    id: 'MTN_MONEY',
    name: 'MTN MoMo',
    kind: 'mobile-money',
    logo: '/assets/payment/mtn-momo.svg',
    tagline: 'Approbation par push USSD MTN',
    brand: '#FFCC00',
  },
  {
    id: 'VISA',
    name: 'Carte Visa',
    kind: 'card',
    logo: '/assets/payment/visa.svg',
    tagline: 'Débit sécurisé par authentification 3-D Secure',
    brand: '#1A1F71',
  },
];
