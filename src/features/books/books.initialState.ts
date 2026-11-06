import type { BooksState } from './books.types';
import seed from '../../data/kingdom.json';
import details from '../../data/kingdom-details.json';
import type { Book } from '../../types/books';

export const initialState: BooksState = {
  entities: { booksById: Object.fromEntries(seed.results.map(book => [book.id, {
    ...book, ...(details as Record<string, Partial<Book>>)[book.id],
  }])) },
  search: {
    resultIds: seed.results.map(book => book.id), totalFound: seed.totalFound,
    status: 'succeeded', error: null, loadedPage: 1, hasMore: true,
    generation: 0, requestId: null, cumulative: false,
  },
  detailsStatusById: Object.fromEntries(Object.keys(details).map(id => [id, 'succeeded'])),
  detailsErrorById: {},
};
