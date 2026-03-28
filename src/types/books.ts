import type { BookId, CollectionId } from "./ids";

/**
 * Generic status for API request lifecycles.
 */
export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Core Book entity representing a normalized book in the Redux store.
 * Combines fields from both the Open Library Search API and the Works API.
 */
export interface Book {
  id: BookId; // e.g., 'OL...W' like 'OL45883W' or generic work identifier
  title: string;
  authors: string[];
  firstPublishYear?: number;
  editionCount?: number;

  // Detail fields fetched via Works API
  description?: string;
  subjects?: string[];
}

/**
 * Represents the normalized paginated results of a book search for the store.
 */
export interface BookSearchResult {
  query: string;
  page: number;
  resultIds: BookId[];
  totalFound: number;
}

/**
 * User-defined collection metadata for grouping books.
 * Note: Memberships (book arrays) are maintained separately in the relationships part of the Redux state.
 */
export interface Collection {
  id: CollectionId;
  name: string;
}
