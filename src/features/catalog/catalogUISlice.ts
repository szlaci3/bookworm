import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CatalogSearch, CatalogUIState } from './catalogUI.types';

const initialState: CatalogUIState = {
  query: 'kingdom',
  revision: 0,
  filters: {},
  sort: 'relevance',
  page: 1,
};

export const catalogUISlice = createSlice({
  name: 'catalogUI',
  initialState,
  reducers: {
    applySearch: (state, { payload }: PayloadAction<CatalogSearch>) => ({
      ...payload,
      page: 1,
      revision: state.revision + 1,
    }),
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
  },
});

export const { applySearch, setPage } = catalogUISlice.actions;

export default catalogUISlice.reducer;
