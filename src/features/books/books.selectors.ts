import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export const selectBooksState = (state: RootState) => state.books;

export const selectBooksById = (state: RootState) => state.books.entities.booksById;
export const selectSearchState = (state: RootState) => state.books.search;
export const selectDetailsStatusById = (state: RootState) => state.books.detailsStatusById;

/**
 * Derived selector to get the array of book objects for current search results.
 */
export const selectSearchResults = createSelector(
  [selectBooksById, selectSearchState],
  (booksById, search) => search.resultIds.map((id) => booksById[id]).filter(Boolean)
);

/**
 * Derived selector for search status and error.
 */
export const selectSearchStatus = (state: RootState) => state.books.search.status;
export const selectSearchError = (state: RootState) => state.books.search.error;
