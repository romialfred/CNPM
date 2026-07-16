# Contrats d’API des composants

## Conventions générales

- Entrées immuables et typées.
- Événements sémantiques (`submitted`, `selectionChanged`) plutôt que détails DOM (`clicked`).
- Texte visible configurable via i18n, jamais codé en dur dans le composant générique.
- Aucune requête réseau directement dans un composant de présentation.
- Aucune décision RBAC uniquement côté interface.

## Exemple TypeScript

```ts
export interface CnpmButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'public-cta';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  loading?: boolean;
  disabled?: boolean;
  iconStart?: string;
  iconEnd?: string;
  accessibleLabel?: string;
}
```

## `DataTable`

```ts
export interface CnpmColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => unknown;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  priority?: 1 | 2 | 3;
  format?: 'text' | 'date' | 'money' | 'percent' | 'status';
}
```

## `StatusBadge`

Le composant reçoit un statut métier et un mapping de présentation centralisé. Il est interdit de construire des couleurs de statut dans chaque écran.
