import type { AppDispatch, RootState } from '../../app/store';
import { openLibraryApi } from '../../services/openLibrary/openLibraryApi';
import {
  setSearchLoading,
  setSearchSuccess,
  setSearchError,
  setBookDetailStatus,
  upsertBookDetails,
} from './booksSlice';
import type { Book } from '../../types/books';

/**
 * Thunk to trigger search operations using current catalogUI state.
 */
export const searchBooksThunk =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const { query, page, filters, sort } = getState().catalogUI;

    if (!query.trim()) return;

    dispatch(setSearchLoading({ query, page }));

    try {
      const { results } = await openLibraryApi.searchBooks({
        query,
        page,
        author: filters.author,
        sort,
        yearRange: filters.yearRange,
      });

      // Normalize array into a record map for the store's entity shape
      const booksRecord: Record<string, Book> = {};
      const resultIds: string[] = [];

      results.forEach((book) => {
        booksRecord[book.id] = book;
        resultIds.push(book.id);
      });

      dispatch(setSearchSuccess({ books: booksRecord, resultIds }));
    } catch (error: any) {
      dispatch(setSearchError(error.message || 'Failed to search books'));
    }
  };

/**
 * Thunk to fetch detailed work metadata for a specific book ID.
 * Expects the base book entity to already exist in Redux from a previous search.
 */
export const fetchWorkDetailsThunk =
  (workId: string) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const existingBook = state.books.entities.booksById[workId];
    
    // Check current detail status to avoid redundant calls (e.g. from double mounts)
    const currentStatus = state.books.detailsStatusById[workId];
    if (currentStatus === 'loading' || currentStatus === 'succeeded') {
      return;
    }

    // This automatically clears the previous error in the updated reducer
    dispatch(setBookDetailStatus({ id: workId, status: 'loading' }));

    try {
      const details = await openLibraryApi.fetchWorkDetails(workId);

      const updatedBook: Book = existingBook 
        ? { ...existingBook, ...details }
        : {
            ...details,
            id: workId,
            title: details.title || 'Unknown Title',
            authors: [],
          };

      dispatch(upsertBookDetails(updatedBook));
      dispatch(setBookDetailStatus({ id: workId, status: 'succeeded' }));
    } catch (error: any) {
      // Store a useful error message when detail fetch fails
      dispatch(
        setBookDetailStatus({ 
          id: workId, 
          status: 'failed', 
          error: error.message || 'Failed to fetch book details.'
        })
      );
    }
  };
