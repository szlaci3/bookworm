import db from './collectionsDb';
import type { CollectionRecord, SavedBookRecord } from './collectionsDb';
import type { BookId, CollectionId } from '../../../types/ids';
import { LIBRARY_COLLECTION_ID } from '../collections.constants';

/**
 * Ensures the default "My Library" collection exists.
 */
export async function initializeDefaultLibrary(): Promise<void> {
  const existing = await db.collections.get(LIBRARY_COLLECTION_ID);
  if (!existing) {
    await db.collections.add({
      id: LIBRARY_COLLECTION_ID,
      name: 'My Library',
      isSystem: true,
      createdAt: Date.now(),
    });
  }
}

/**
 * Loads all collections from the database.
 */
export async function loadAllCollections(): Promise<CollectionRecord[]> {
  return await db.collections.toArray();
}

/**
 * Saves a new collection or updates an existing one.
 */
export async function saveCollection(collection: CollectionRecord): Promise<void> {
  await db.collections.put(collection);
}

/**
 * Deletes a collection and all of its membership records.
 * Prevents deleting system collections.
 */
export async function deleteCollection(id: CollectionId): Promise<void> {
  await db.transaction('rw', db.collections, db.memberships, async () => {
    const collection = await db.collections.get(id);
    if (collection && collection.isSystem) {
      throw new Error("Cannot delete system collections");
    }
    await db.collections.delete(id);
    await db.memberships.where('collectionId').equals(id).delete();
  });
}

/**
 * Saves a lightweight snapshot of a book so it can be displayed in a collection
 * without needing a full API fetch.
 */
export async function saveBookSnapshot(book: SavedBookRecord): Promise<void> {
  await db.savedBooks.put(book);
}

/**
 * Adds a book to a collection if it isn't already a member.
 */
export async function addBookToCollection(collectionId: CollectionId, bookId: BookId): Promise<void> {
  const exists = await db.memberships.where({ collectionId, bookId }).count();
  if (exists === 0) {
    await db.memberships.add({ collectionId, bookId });
  }
}

/**
 * Removes a book from a collection.
 */
export async function removeBookFromCollection(collectionId: CollectionId, bookId: BookId): Promise<void> {
  await db.memberships.where({ collectionId, bookId }).delete();
}

/**
 * Loads all saved book snapshots that belong to the given collection.
 */
export async function loadBooksForCollection(collectionId: CollectionId): Promise<SavedBookRecord[]> {
  const memberships = await db.memberships.where('collectionId').equals(collectionId).toArray();
  const bookIds = memberships.map((m) => m.bookId);
  const books = await db.savedBooks.bulkGet(bookIds);
  // filter out any undefined (in case a membership exists but the book snapshot is missing)
  return books.filter((b): b is SavedBookRecord => b !== undefined);
}

/**
 * Utility: Gets a dictionary of all memberships (useful for initializing Redux state).
 */
export async function loadAllMemberships(): Promise<Record<CollectionId, BookId[]>> {
  const allMemberships = await db.memberships.toArray();
  const result: Record<CollectionId, BookId[]> = {};
  for (const m of allMemberships) {
      if (!result[m.collectionId]) {
          result[m.collectionId] = [];
      }
      result[m.collectionId].push(m.bookId);
  }
  return result;
}
