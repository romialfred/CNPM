export type CnpmColumnFormat = 'text' | 'date' | 'datetime' | 'money' | 'percent' | 'status';
export interface CnpmColumn<T> {
  id: string;
  header: string;
  accessor: (row: T) => unknown;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  priority?: 1 | 2 | 3;
  format?: CnpmColumnFormat;
}
export interface CnpmPageResult<T> { items: T[]; page: number; pageSize: number; total: number; }
