import type { RootState } from '../../app/store';

export const selectCatalogUI = (state: RootState) => state.catalogUI;

export const selectCatalogQuery = (state: RootState) => state.catalogUI.query;
export const selectCatalogFilters = (state: RootState) => state.catalogUI.filters;
export const selectCatalogSort = (state: RootState) => state.catalogUI.sort;
export const selectCatalogPage = (state: RootState) => state.catalogUI.page;
