import type { Book, RequestStatus } from '../../types/books';

export interface BooksEntityState {
  booksById: Record<string, Book>;
}

export interface BooksSearchState {
  query: string;
  page: number;
  resultIds: string[];
  status: RequestStatus;
  error: string | null;
}

export interface BooksState {
  entities: BooksEntityState;
  search: BooksSearchState;
  detailsStatusById: Record<string, RequestStatus>;
}
