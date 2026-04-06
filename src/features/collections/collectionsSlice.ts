import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CollectionsState } from './collections.types';
import type { BookId, CollectionId } from '../../types/ids';

const initialState: CollectionsState = {
  collectionsById: {
    library: {
      id: 'library',
      name: 'My Library',
      isSystem: true,
    },
  },
  collectionIds: ['library'],
  membership: {
    library: [],
  },
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    createCollection: (
      state,
      action: PayloadAction<{ id: CollectionId; name: string }>
    ) => {
      const { id, name } = action.payload;
      if (!state.collectionsById[id]) {
        state.collectionsById[id] = { id, name };
        state.collectionIds.push(id);
        state.membership[id] = [];
      }
    },
    renameCollection: (
      state,
      action: PayloadAction<{ id: CollectionId; newName: string }>
    ) => {
      const { id, newName } = action.payload;
      const collection = state.collectionsById[id];
      if (collection && !collection.isSystem) {
        collection.name = newName;
      }
    },
    deleteCollection: (state, action: PayloadAction<CollectionId>) => {
      const id = action.payload;
      const collection = state.collectionsById[id];
      if (collection && !collection.isSystem) {
        delete state.collectionsById[id];
        state.collectionIds = state.collectionIds.filter((cId) => cId !== id);
        delete state.membership[id];
      }
    },
    addBookToCollection: (
      state,
      action: PayloadAction<{ collectionId: CollectionId; bookId: BookId }>
    ) => {
      const { collectionId, bookId } = action.payload;
      if (state.membership[collectionId]) {
        // Prevent duplicate membership entries
        if (!state.membership[collectionId].includes(bookId)) {
          state.membership[collectionId].push(bookId);
        }
      }
    },
    removeBookFromCollection: (
      state,
      action: PayloadAction<{ collectionId: CollectionId; bookId: BookId }>
    ) => {
      const { collectionId, bookId } = action.payload;
      if (state.membership[collectionId]) {
        state.membership[collectionId] = state.membership[collectionId].filter(
          (id) => id !== bookId
        );
      }
    },
  },
});

export const {
  createCollection,
  renameCollection,
  deleteCollection,
  addBookToCollection,
  removeBookFromCollection,
} = collectionsSlice.actions;

export default collectionsSlice.reducer;
