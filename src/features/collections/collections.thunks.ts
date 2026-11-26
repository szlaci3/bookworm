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
import type { Book } from '../../types/books';
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
    const snapshots = (await Promise.all(collectionIds.map(loadBooksForCollection))).flat();
    dispatch(hydrateCollectionsState({
      savedBooks: Object.fromEntries(snapshots.map(book => [book.id, book])),
      collectionsById, collectionIds, membership: safeMemberships,
    }));
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

export const addBookToCollectionThunk = createAppAsyncThunk<void, { collectionId: CollectionId; book: Book }>(
  'collections/addBook',
  async ({ collectionId, book }, { dispatch }) => {
    const { id, title, authors, firstPublishYear, coverId } = book;
    const snapshot = { id, title, authors, firstPublishYear, coverId };
    await saveBookSnapshot(snapshot);
    // 2. Save membership in Dexie
    await addBookToCollectionDb(collectionId, id);
    // 3. Update Redux
    dispatch(addBookToCollection({ collectionId, book: snapshot }));
    // 4. Notify other tabs
    broadcastCollectionChange();
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
