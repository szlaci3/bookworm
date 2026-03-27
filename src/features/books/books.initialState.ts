import type { BooksState } from './books.types';

export const initialState: BooksState = {
  entities: {
    booksById: {},
  },
  search: {
    query: '',
    page: 1,
    resultIds: [],
    status: 'idle',
    error: null,
  },
  detailsStatusById: {},
};
