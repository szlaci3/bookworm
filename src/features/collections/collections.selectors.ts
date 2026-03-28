import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { selectBooksById } from '../books/books.selectors';

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
export const selectBooksInCollection = (collectionId: string) =>
  createSelector(
    [selectBooksById, selectMemberships],
    (booksById, memberships) => {
      const bookIds = memberships[collectionId] || [];
      return bookIds.map((id) => booksById[id]).filter(Boolean);
    }
  );
