import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { selectBooksById } from '../books/books.selectors';
import type { CollectionId, BookId } from '../../types/ids';
import { LIBRARY_COLLECTION_ID } from './collections.constants';
import type { Book } from '../../types/books';

export const selectCollectionsState = (state: RootState) => state.collections;

export const selectCollectionsById = (state: RootState) => state.collections.collectionsById;
export const selectCollectionIds = (state: RootState) => state.collections.collectionIds;
export const selectMemberships = (state: RootState) => state.collections.membership;

/**
 * Returns all collection objects as an array.
 */
export const selectAllCollections = createSelector(
  [selectCollectionsById, selectCollectionIds],
  (collectionsById, ids) => ids.map((id) => collectionsById[id])
);

/**
 * Factory selector (curried) to get book objects for a specific collection.
 */
export const selectBooksInCollection = (collectionId: CollectionId) =>
  createSelector(
    [selectBooksById, selectMemberships],
    (booksById, memberships) => {
      const bookIds = memberships[collectionId] || [];
      return bookIds.map((id) => booksById[id]).filter(Boolean);
    }
  );

export const selectLibraryCollection = createSelector(
  [selectCollectionsById],
  (collectionsById) => collectionsById[LIBRARY_COLLECTION_ID]
);

export const selectLibraryBookIds = createSelector(
  [selectMemberships],
  (memberships) => memberships[LIBRARY_COLLECTION_ID] || []
);

export const selectLibraryBooks = createSelector(
  [selectBooksById, selectLibraryBookIds],
  (booksById, libraryBookIds) => libraryBookIds.map((id) => booksById[id]).filter((book): book is Book => Boolean(book))
);

export const selectIsBookSaved = createSelector(
  [selectLibraryBookIds, (_: RootState, bookId: BookId) => bookId],
  (libraryBookIds, bookId) => libraryBookIds.includes(bookId)
);
