import type { Book, Collection } from '../../types/books';
import type { BookId, CollectionId } from '../../types/ids';

export interface CollectionsState {
  savedBooks: Record<BookId, Book>;
  collectionsById: Record<CollectionId, Collection>;
  collectionIds: CollectionId[];
  membership: Record<CollectionId, BookId[]>;
}
