import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/app/store';
import { setQuery } from '../src/features/catalog/catalogUISlice';
import { searchBooksThunk } from '../src/features/books/books.thunks';
import { clearSearch } from '../src/features/books/booksSlice';
import { openLibraryApi } from '../src/services/openLibrary/openLibraryApi';
import { readCatalogView, saveCatalogView } from '../src/app/viewPreference';
import { BOOK_SPACING, clampPosition, currentBookIndex } from '../src/features/nave/navigation';
import db from '../src/features/collections/persistence/collectionsDb';

test('navigation clamps boundaries and selects the next closest book at the cutoff', () => {
  assert.equal(clampPosition(-1, 100), 0);
  assert.equal(clampPosition(1e6, 100), 99 * BOOK_SPACING);
  assert.equal(clampPosition(10, 0), 0);
  assert.equal(currentBookIndex(BOOK_SPACING - .01, 100), 0);
  assert.equal(currentBookIndex(BOOK_SPACING, 100), 1);
  assert.equal(currentBookIndex(1e6, 100), 99);
});

test('Dexie persists view without changing collections', async () => {
  await db.collections.put({ id: 'test', name: 'Preserved collection', isSystem: false, createdAt: 1 });
  assert.equal(await readCatalogView(), '3d');
  await saveCatalogView('2d'); assert.equal(await readCatalogView(), '2d');
  await saveCatalogView('3d'); assert.equal(await readCatalogView(), '3d');
  assert.equal((await db.collections.get('test'))?.name, 'Preserved collection');
});

test('bundled kingdom query and initial details do not fetch', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected request'); };
  try {
    const result = await openLibraryApi.searchBooks({ query: 'kingdom', page: 1, sort: 'relevance' });
    assert.equal(result.results.length, 100);
    assert.equal(result.results[0].title, 'The Last Kingdom');
    assert.ok((await openLibraryApi.fetchWorkDetails(result.results[0].id)).description);
  } finally { globalThis.fetch = original; }
});

test('late search results cannot overwrite a newer search or cleared results', async () => {
  const original = globalThis.fetch;
  const waiting = new Map<string, (value: Response) => void>();
  globalThis.fetch = input => new Promise(resolve => {
    waiting.set(new URL(String(input)).searchParams.get('q')!, resolve);
  });
  const result = (id: string) => new Response(JSON.stringify({ numFound: 1, docs: [{ key: `/works/${id}`, title: id }] }));
  try {
    store.dispatch(setQuery('old')); const old = store.dispatch(searchBooksThunk());
    store.dispatch(setQuery('new')); const newest = store.dispatch(searchBooksThunk());
    waiting.get('new')!(result('NEW')); await newest;
    waiting.get('old')!(result('OLD')); await old;
    assert.deepEqual(store.getState().books.search.resultIds, ['NEW']);
    store.dispatch(setQuery('clear')); const pending = store.dispatch(searchBooksThunk());
    store.dispatch(clearSearch()); waiting.get('clear')!(result('CLEARED')); await pending;
    assert.deepEqual(store.getState().books.search.resultIds, []);
  } finally { globalThis.fetch = original; }
});
