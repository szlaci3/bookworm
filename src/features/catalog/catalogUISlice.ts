import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CatalogUIState, CatalogUISort } from './catalogUI.types';

const initialState: CatalogUIState = {
  query: '',
  filters: {},
  sort: 'relevance',
  page: 1,
};

export const catalogUISlice = createSlice({
  name: 'catalogUI',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
      state.page = 1; // Reset to page 1 on new query
    },
    setAuthorFilter: (state, action: PayloadAction<string | undefined>) => {
      state.filters.author = action.payload;
      state.page = 1; // Reset to page 1 on filter change
    },
    setYearRange: (state, action: PayloadAction<[number, number] | undefined>) => {
      state.filters.yearRange = action.payload;
      state.page = 1; // Reset to page 1 on filter change
    },
    setSort: (state, action: PayloadAction<CatalogUISort>) => {
      state.sort = action.payload;
      state.page = 1; // Reset to page 1 on sort change
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    resetCatalogUI: () => {
      return initialState;
    },
  },
});

export const {
  setQuery,
  setAuthorFilter,
  setYearRange,
  setSort,
  setPage,
  resetCatalogUI,
} = catalogUISlice.actions;

export default catalogUISlice.reducer;
