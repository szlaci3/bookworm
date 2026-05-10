import Dexie, { type EntityTable } from 'dexie';
import type { BookId, CollectionId } from '../../../types/ids';

// Interfaces for DB tables
export interface CollectionRecord {
  id: CollectionId;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: number;
}

export interface CollectionMembershipRecord {
  id?: number; // Auto-increment primary key
  collectionId: CollectionId;
  bookId: BookId;
}

export interface SavedBookRecord {
  id: BookId;
  title: string;
  authors: string[];
  firstPublishYear?: number;
}

export const db = new Dexie('BookwormCollectionsDB') as Dexie & {
  collections: EntityTable<CollectionRecord, 'id'>;
  memberships: EntityTable<CollectionMembershipRecord, 'id'>;
  savedBooks: EntityTable<SavedBookRecord, 'id'>;
};

// Schema declaration
db.version(1).stores({
  collections: 'id, name, createdAt',
  memberships: '++id, collectionId, bookId, [collectionId+bookId]', 
  savedBooks: 'id, title'
});

export default db;
