import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Book, RequestStatus } from '../../types/books';
import { initialState } from './books.initialState';

export const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.search.query = '';
      state.search.page = 1;
      state.search.resultIds = [];
      state.search.status = 'idle';
      state.search.error = null;
    },
    setSearchLoading: (state, action: PayloadAction<{ query: string; page: number }>) => {
      state.search.query = action.payload.query;
      state.search.page = action.payload.page;
      state.search.status = 'loading';
      state.search.error = null;
    },
    setSearchSuccess: (
      state,
      action: PayloadAction<{
        books: Record<string, Book>;
        resultIds: string[];
      }>
    ) => {
      // Merge new books into the normalized entity store without destroying cached details
      Object.entries(action.payload.books).forEach(([id, newBook]) => {
        const existingBook = state.entities.booksById[id];
        if (existingBook) {
          state.entities.booksById[id] = { ...existingBook, ...newBook };
        } else {
          state.entities.booksById[id] = newBook;
        }
      });
      
      state.search.resultIds = action.payload.resultIds;
      state.search.status = 'succeeded';
      state.search.error = null;
    },
    setSearchError: (state, action: PayloadAction<string>) => {
      state.search.status = 'failed';
      state.search.error = action.payload;
    },
    setBookDetailStatus: (
      state,
      action: PayloadAction<{ id: string; status: RequestStatus; error?: string | null }>
    ) => {
      const { id, status, error } = action.payload;
      
      state.detailsStatusById[id] = status;
      
      if (error !== undefined) {
        state.detailsErrorById[id] = error;
      } else if (status === 'loading') {
        // Clear any previous detail error when a new fetch starts
        state.detailsErrorById[id] = null; 
      }
    },
    upsertBookDetails: (state, action: PayloadAction<Book>) => {
      const book = action.payload;
      if (state.entities.booksById[book.id]) {
        // Update existing book with new details
        Object.assign(state.entities.booksById[book.id], book);
      } else {
        // Or add it if it doesn't exist (though usually it should from search)
        state.entities.booksById[book.id] = book;
      }
    },
  },
});

export const {
  clearSearch,
  setSearchLoading,
  setSearchSuccess,
  setSearchError,
  setBookDetailStatus,
  upsertBookDetails,
} = booksSlice.actions;

export default booksSlice.reducer;
