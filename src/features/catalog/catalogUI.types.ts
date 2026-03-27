export interface CatalogUIFilters {
  author?: string;
  yearRange?: [number, number];
}

export type CatalogUISort = 'relevance' | 'year';

export interface CatalogUIState {
  query: string;
  filters: CatalogUIFilters;
  sort: CatalogUISort;
  page: number;
}
