export interface CatalogUIFilters {
  author?: string;
  yearRange?: [number | undefined, number | undefined];
}

export type CatalogUISort = 'relevance' | 'year_asc' | 'year_desc';

export interface CatalogSearch {
  query: string;
  filters: CatalogUIFilters;
  sort: CatalogUISort;
}

export interface CatalogUIState extends CatalogSearch {
  revision: number;
  page: number;
}
