import type { BooksState } from './books.types';

export const initialState: BooksState = {
  entities: {
    booksById: {},
  },
  search: {
    resultIds: [],
    totalFound: 0,
    status: 'idle',
    error: null,
  },
  detailsStatusById: {},
  detailsErrorById: {},
};
