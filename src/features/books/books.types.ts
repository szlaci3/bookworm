import type { Book, RequestStatus } from '../../types/books';

export interface BooksEntityState {
  booksById: Record<string, Book>;
}

export interface BooksSearchState {
  resultIds: string[];
  totalFound: number;
  status: RequestStatus;
  error: string | null;
  loadedPage: number;
  hasMore: boolean;
  generation: number;
  requestId: string | null;
  cumulative: boolean;
}

export interface BooksState {
  entities: BooksEntityState;
  search: BooksSearchState;
  detailsStatusById: Record<string, RequestStatus>;
  detailsErrorById: Record<string, string | null>;
}
