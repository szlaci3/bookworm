import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { BookId } from '../../types/ids';
import type { RequestStatus } from '../../types/books';

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

export const selectBookById = (state: RootState, bookId: BookId) => 
  state.books.entities.booksById[bookId];

export const selectBookDetailStatusById = (state: RootState, bookId: BookId): RequestStatus =>
  state.books.detailsStatusById[bookId] || 'idle';

// Read detail error by book ID
export const selectBookDetailErrorById = (state: RootState, bookId: BookId): string | null =>
  state.books.detailsErrorById[bookId] || null;

// Determine if we have sufficient detail content to avoid fetching
export const selectHasBookDetails = (state: RootState, bookId: BookId): boolean => {
  const book = state.books.entities.booksById[bookId];
  if (!book) return false;
  
  const hasDescription = Boolean(book.description && book.description.trim().length > 0);
  const hasSubjects = Boolean(book.subjects && book.subjects.length > 0);
  
  return hasDescription || hasSubjects;
};
