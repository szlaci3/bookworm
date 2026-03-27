import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CollectionsState } from './collections.types';

const initialState: CollectionsState = {
  collectionsById: {},
  collectionIds: [],
  membership: {}, // Maps collectionId to array of bookIds
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    createCollection: (
      state,
      action: PayloadAction<{ id: string; name: string }>
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
      action: PayloadAction<{ id: string; newName: string }>
    ) => {
      const { id, newName } = action.payload;
      if (state.collectionsById[id]) {
        state.collectionsById[id].name = newName;
      }
    },
    deleteCollection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.collectionsById[id]) {
        delete state.collectionsById[id];
        state.collectionIds = state.collectionIds.filter((cId) => cId !== id);
        delete state.membership[id];
      }
    },
    addBookToCollection: (
      state,
      action: PayloadAction<{ collectionId: string; bookId: string }>
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
      action: PayloadAction<{ collectionId: string; bookId: string }>
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
