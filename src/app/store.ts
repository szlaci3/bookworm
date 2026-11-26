import { configureStore, type UnknownAction } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { booksApi } from '../features/books/booksApi';
import { createPrefetchEpic } from '../features/nave/prefetch';
import catalogUIReducer from '../features/catalog/catalogUISlice';
import collectionsReducer from '../features/collections/collectionsSlice';

const epic = createEpicMiddleware<UnknownAction, never>();

export const store = configureStore({
  reducer: {
    [booksApi.reducerPath]: booksApi.reducer,
    catalogUI: catalogUIReducer,
    collections: collectionsReducer,
  },
  middleware: defaults => defaults().concat(booksApi.middleware, epic),
});

epic.run(createPrefetchEpic(id =>
  store.dispatch(booksApi.endpoints.details.initiate(id, { subscribe: false }))
));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
