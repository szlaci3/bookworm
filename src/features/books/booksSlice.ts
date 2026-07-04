import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Book, RequestStatus } from '../../types/books';
import { initialState } from './books.initialState';
import { fetchWorkDetailsThunk, searchBooksThunk } from './books.thunks';


export const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearSearch: (state) => {
      state.search.resultIds = [];
      state.search.totalFound = 0;
      state.search.status = 'idle';
      state.search.error = null;
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
  extraReducers: (builder) => {
    builder
      .addCase(searchBooksThunk.pending, (state) => {
        state.search.status = 'loading';
        state.search.error = null;
      })
      .addCase(searchBooksThunk.fulfilled, (state, action) => {
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
        state.search.totalFound = action.payload.totalFound;
        state.search.status = 'succeeded';
        state.search.error = null;
      })
      .addCase(searchBooksThunk.rejected, (state, action) => {
        state.search.status = 'failed';
        state.search.error = action.error.message ?? 'Failed to search books.';
      })
      .addCase(fetchWorkDetailsThunk.pending, (state, action) => {
        const workId = action.meta.arg;
        state.detailsStatusById[workId] = 'loading';
        state.detailsErrorById[workId] = null;
      })
      .addCase(fetchWorkDetailsThunk.fulfilled, (state, action) => {
        const book = action.payload;
        const existingBook = state.entities.booksById[book.id];

        if (existingBook) {
          Object.assign(existingBook, book);
        } else {
          state.entities.booksById[book.id] = book;
        }

        state.detailsStatusById[book.id] = 'succeeded';
        state.detailsErrorById[book.id] = null;
      })
      .addCase(fetchWorkDetailsThunk.rejected, (state, action) => {
        const workId = action.meta.arg;
        state.detailsStatusById[workId] = 'failed';
        state.detailsErrorById[workId] = action.error.message ?? 'Failed to fetch book details.';
      });
  },
});

export const {
  clearSearch,
  setBookDetailStatus,
  upsertBookDetails,
} = booksSlice.actions;

export default booksSlice.reducer;
