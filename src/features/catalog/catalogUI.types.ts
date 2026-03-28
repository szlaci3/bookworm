export interface CatalogUIFilters {
  author?: string;
  yearRange?: [number | undefined, number | undefined];
}

export type CatalogUISort = 'relevance' | 'year_asc' | 'year_desc';

export interface CatalogUIState {
  query: string;
  filters: CatalogUIFilters;
  sort: CatalogUISort;
  page: number;
}
