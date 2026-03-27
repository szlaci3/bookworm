import type { Collection } from '../../types/books';

export interface CollectionsState {
  collectionsById: Record<string, Collection>;
  collectionIds: string[];
  membership: Record<string, string[]>; // collectionId -> bookIds[]
}
