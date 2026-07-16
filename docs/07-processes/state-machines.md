# Machines à états principales

## Enrôlement
`DRAFT → SUBMITTED → UNDER_REVIEW → COMPLEMENT_REQUIRED → UNDER_REVIEW → APPROVED → ACTIVE` ou `REJECTED`.

## Paiement
`INITIATED → PENDING → RECEIVED → RECONCILED → CONFIRMED → ALLOCATED`; branches `REJECTED`, `REFUNDED`, `CANCELLED` via workflows contrôlés.

## Reçu
`PENDING → ISSUED`; correction : `ISSUED → CANCELLED` puis nouveau reçu `ISSUED` référant l’original.

## Requête membre
`DRAFT → SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → WAITING_MEMBER/WAITING_INTERNAL → RESOLVED → CLOSED`; `REOPENED` selon politique.

Toute transition est contrôlée par permission, garde métier, horodatage et audit.
