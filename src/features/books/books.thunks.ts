import { openLibraryApi } from '../../services/openLibrary/openLibraryApi';
import { saveAuthorMetadataBatch, getAuthorMetadata } from '../collections/persistence/collectionsRepository';
import type { Book } from '../../types/books';
import { createAppAsyncThunk } from '../../app/createAppAsyncThunk';

/**
 * Thunk to trigger search operations using current catalogUI state.
 */
export const searchBooksThunk = createAppAsyncThunk(
  'books/search',
  async (_, {  getState }) => {
    const { query, page, filters, sort } = getState().catalogUI;

    if (!query.trim()) {
      return {
        books: {},
        totalFound: 0,
        resultIds: [],
      };
    }

    const { results, totalFound } = await openLibraryApi.searchBooks({
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

    // Persist only author names for these works to a small metadata cache
    await saveAuthorMetadataBatch(results.map(book => ({
      id: book.id,
      authors: book.authors,
    })));

    return { books: booksRecord, resultIds, totalFound };
  }
);

/**
 * Thunk to fetch detailed work metadata for a specific book ID.
 * If the base book entity already exists in Redux from a previous search, ensures authors have value.
 */
export const fetchWorkDetailsThunk = createAppAsyncThunk<Book, string>(
  'books/fetchWorkDetails',
  async (workId, { getState }) => {
    const details = await openLibraryApi.fetchWorkDetails(workId);

    // Check if we have cached authors from a previous search (e.g. in a different tab/session)
    const cachedAuthors = await getAuthorMetadata(workId);

    // Re-read existing book to avoid overwriting data
    const latestExistingBook = getState().books.entities.booksById[workId];

    // latestExistingBook already has most data from search and it was stored in Redux.
    // details is from API but lacks author.
    // cachedAuthors has the author from a previous search and it was stored in IndexedDB.
    return latestExistingBook
      ? {
        ...latestExistingBook,
        ...details,
        authors: (latestExistingBook.authors && latestExistingBook.authors.length > 0)
          ? latestExistingBook.authors
          : cachedAuthors || []
      }
      : {
        ...details,
        id: workId,
        title: details.title || 'Unknown Title',
        authors: cachedAuthors || []
      };
  },
  {
    condition: (workId, { getState }) => {
      // Check current detail status to avoid redundant calls (e.g. from double mounts)
      const currentStatus = getState().books.detailsStatusById[workId];
      return currentStatus !== 'loading' && currentStatus !== 'succeeded';
    },
  }
);
