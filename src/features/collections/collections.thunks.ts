import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  initializeDefaultLibrary,
  loadAllCollections,
  loadAllMemberships,
  loadBooksForCollection,
  saveCollection,
  deleteCollection as deleteCollectionDb,
  saveBookSnapshot,
  addBookToCollection as addBookToCollectionDb,
  removeBookFromCollection as removeBookFromCollectionDb,
} from './persistence/collectionsRepository';
import {
  hydrateCollectionsState,
  createCollection,
  renameCollection,
  deleteCollection,
  addBookToCollection,
  removeBookFromCollection
} from './collectionsSlice';
import { upsertBookDetails } from '../books/booksSlice';
import type { CollectionsState } from './collections.types';
import type { RootState } from '../../app/store';
import type { BookId, CollectionId } from '../../types/ids';
import { broadcastCollectionChange } from './collections.sync';

export const initializeCollectionsFromStorage = createAsyncThunk(
  'collections/initializeFromStorage',
  async (_, { dispatch }) => {
    // 1. Ensure the DB is initialized with defaults if empty
    await initializeDefaultLibrary();

    // 2. Load all raw data from persistent storage
    const collectionsArray = await loadAllCollections();
    const membershipsHash = await loadAllMemberships();

    // 3. Reshape collections array into the normalized object expected by Redux
    const collectionsById = collectionsArray.reduce((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {} as CollectionsState['collectionsById']);

    const collectionIds = collectionsArray.map((c) => c.id);

    // Ensure we have a membership array for every known collection to prevent undefined errors
    const safeMemberships = { ...membershipsHash };
    for (const c of collectionsArray) {
      if (!safeMemberships[c.id]) {
        safeMemberships[c.id] = [];
      }
    }

    // 4. Dispatch the payload to fully replace the Redux state with what we pulled from Dexie
    const stateSnapshot: CollectionsState = {
      collectionsById,
      collectionIds,
      membership: safeMemberships,
    };
    dispatch(hydrateCollectionsState(stateSnapshot));

    // 5. Load the lightweight book snapshots (from the library, or globally)
    // Redux selectors for collections rely on `state.books.entities.booksById` being populated.
    // If a user refreshes, `booksById` is empty. We need to load all "savedBooks" into it.
    // For simplicity, we can load books for every collection and upsert them.
    for (const collectionId of collectionIds) {
      const savedBooks = await loadBooksForCollection(collectionId);
      for (const book of savedBooks) {
        dispatch(upsertBookDetails({
          id: book.id,
          title: book.title,
          authors: book.authors,
          firstPublishYear: book.firstPublishYear,
        }));
      }
    }
  }
);

export const createCollectionThunk = createAsyncThunk<void, { id: CollectionId; name: string }>(
  'collections/create',
  async ({ id, name }, { dispatch }) => {
    // 1. Save to Dexie
    await saveCollection({ id, name, isSystem: false, createdAt: Date.now() });
    // 2. Update Redux
    dispatch(createCollection({ id, name }));
    // 3. Notify other tabs
    broadcastCollectionChange();
  }
);

export const renameCollectionThunk = createAsyncThunk<void, { id: CollectionId; newName: string }>(
  'collections/rename',
  async ({ id, newName }, { dispatch, getState }) => {
    const state = getState() as RootState;
    const collection = state.collections.collectionsById[id];
    if (collection && !collection.isSystem) {
      await saveCollection({ ...collection, name: newName, isSystem: false, createdAt: Date.now() });
      dispatch(renameCollection({ id, newName }));
      broadcastCollectionChange();
    }
  }
);

export const deleteCollectionThunk = createAsyncThunk<void, CollectionId>(
  'collections/delete',
  async (id, { dispatch, getState }) => {
    const state = getState() as RootState;
    const collection = state.collections.collectionsById[id];
    if (collection && !collection.isSystem) {
      await deleteCollectionDb(id);
      dispatch(deleteCollection(id));
      broadcastCollectionChange();
    }
  }
);

export const addBookToCollectionThunk = createAsyncThunk<void, { collectionId: CollectionId; bookId: BookId }>(
  'collections/addBook',
  async ({ collectionId, bookId }, { dispatch, getState }) => {
    const state = getState() as RootState;
    const book = state.books.entities.booksById[bookId];

    if (book) {
      // 1. Persist a minimal snapshot of the book
      await saveBookSnapshot({
        id: book.id,
        title: book.title,
        authors: book.authors,
        firstPublishYear: book.firstPublishYear,
      });
      // 2. Save membership in Dexie
      await addBookToCollectionDb(collectionId, bookId);
      // 3. Update Redux
      dispatch(addBookToCollection({ collectionId, bookId }));
      // 4. Notify other tabs
      broadcastCollectionChange();
    }
  }
);

export const removeBookFromCollectionThunk = createAsyncThunk<void, { collectionId: CollectionId; bookId: BookId }>(
  'collections/removeBook',
  async ({ collectionId, bookId }, { dispatch }) => {
    await removeBookFromCollectionDb(collectionId, bookId);
    dispatch(removeBookFromCollection({ collectionId, bookId }));
    broadcastCollectionChange();
  }
);
