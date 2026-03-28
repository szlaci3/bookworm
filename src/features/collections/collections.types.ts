import type { Collection } from '../../types/books';
import type { BookId, CollectionId } from '../../types/ids';

export interface CollectionsState {
  collectionsById: Record<CollectionId, Collection>;
  collectionIds: CollectionId[];
  membership: Record<CollectionId, BookId[]>;
}
