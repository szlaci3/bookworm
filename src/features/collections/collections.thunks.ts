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
import { createAppAsyncThunk } from '../../app/createAppAsyncThunk';

export const initializeCollectionsFromStorage = createAppAsyncThunk(
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

    // 5. Load the lightweight book snapshots for collections
    // Redux selectors for collections rely on `state.books.entities.booksById` being populated.
    for (const collectionId of collectionIds) {
      const savedBooks = await loadBooksForCollection(collectionId);
      for (const book of savedBooks) {
        dispatch(upsertBookDetails({
          id: book.id,
          title: book.title,
          authors: book.authors,
          firstPublishYear: book.firstPublishYear,
          coverId: book.coverId,
        }));
      }
    }
  }
);

export const createCollectionThunk = createAppAsyncThunk<void, { id: CollectionId; name: string }>(
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

export const renameCollectionThunk = createAppAsyncThunk<void, { id: CollectionId; newName: string }>(
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

export const deleteCollectionThunk = createAppAsyncThunk<void, CollectionId>(
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

export const addBookToCollectionThunk = createAppAsyncThunk<void, { collectionId: CollectionId; bookId: BookId }>(
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
        coverId: book.coverId,
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

export const removeBookFromCollectionThunk = createAppAsyncThunk<void, { collectionId: CollectionId; bookId: BookId }>(
  'collections/removeBook',
  async ({ collectionId, bookId }, { dispatch }) => {
    await removeBookFromCollectionDb(collectionId, bookId);
    dispatch(removeBookFromCollection({ collectionId, bookId }));
    broadcastCollectionChange();
  }
);
