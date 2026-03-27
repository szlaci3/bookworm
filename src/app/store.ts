import { configureStore } from '@reduxjs/toolkit';
import booksReducer from '../features/books/booksSlice';
import catalogUIReducer from '../features/catalog/catalogUISlice';
import collectionsReducer from '../features/collections/collectionsSlice';

export const store = configureStore({
  reducer: {
    books: booksReducer,
    catalogUI: catalogUIReducer,
    collections: collectionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
