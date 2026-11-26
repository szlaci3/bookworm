import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/app/store';
import { booksApi } from '../src/features/books/booksApi';
import { nearbyBooksChanged } from '../src/features/nave/prefetch';
import { setTimeout as delay } from 'node:timers/promises';
import { openLibraryApi } from '../src/services/openLibrary/openLibraryApi';
import { readCatalogView, saveCatalogView } from '../src/app/viewPreference';
import { BOOK_DROP_DURATION, advanceBookDrop, BOOK_SPACING, clampPosition, currentBookIndex } from '../src/features/nave/navigation';
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

test('concurrent searches isolate late results and reuse cached pages', async () => {
  const original = globalThis.fetch;
  const waiting = new Map<string, (value: Response) => void>();
  globalThis.fetch = input => new Promise(resolve => {
    waiting.set(new URL(String(input)).searchParams.get('q')!, resolve);
  });
  const result = (id: string) => Response.json({ numFound: 1, docs: [{ key: `/works/${id}`, title: id }] });
  const search = booksApi.endpoints.search;
  try {
    const old = store.dispatch(search.initiate({ query: 'old' }));
    const newest = store.dispatch(search.initiate({ query: 'new' }));
    waiting.get('new')!(result('NEW')); await newest;
    waiting.get('old')!(result('OLD')); await old;
    assert.equal(search.select({ query: 'new' })(store.getState()).data?.pages[0].results[0].id, 'NEW');
    globalThis.fetch = () => { throw new Error('Repeated cached query'); };
    const cached = store.dispatch(search.initiate({ query: 'old' }));
    assert.equal((await cached.unwrap()).pages[0].results[0].id, 'OLD');
    old.unsubscribe(); newest.unsubscribe(); cached.unsubscribe();
  } finally {
    store.dispatch(booksApi.util.resetApiState());
    globalThis.fetch = original;
  }
});

test('navigation drops stale neighbors and shares in-flight details with the reader', async () => {
  const original = globalThis.fetch;
  const requests: string[] = [];
  const release = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  const finished = Promise.withResolvers<void>();
  globalThis.fetch = async input => {
    const id = new URL(String(input)).pathname.split('/').pop()!.replace('.json', '');
    requests.push(id);
    if (id === 'OLnear') { started.resolve(); await release.promise; }
    if (id === 'OLnew') finished.resolve();
    return Response.json({ title: id });
  };
  try {
    store.dispatch(nearbyBooksChanged(['OLtransient']));
    store.dispatch(nearbyBooksChanged(['OLnear', 'OLobsolete']));
    await started.promise;
    const reader = store.dispatch(booksApi.endpoints.details.initiate('OLnear'));
    store.dispatch(nearbyBooksChanged(['OLnew']));
    await delay(150);
    assert.deepEqual(requests, ['OLnear']);
    release.resolve();
    assert.equal((await reader.unwrap()).title, 'OLnear');
    await finished.promise;
    const next = store.dispatch(booksApi.endpoints.details.initiate('OLnew'));
    await next.unwrap();
    assert.deepEqual(requests, ['OLnear', 'OLnew']);
    reader.unsubscribe(); next.unsubscribe();
  } finally {
    release.resolve();
    store.dispatch(nearbyBooksChanged([]));
    store.dispatch(booksApi.util.resetApiState());
    globalThis.fetch = original;
  }
});

test('book drop completes while stationary and reverses without jumping', () => {
  const halfway = advanceBookDrop(0, true, BOOK_DROP_DURATION / 2);
  assert.equal(halfway, 0.5);
  assert.equal(advanceBookDrop(halfway, false, 0), halfway);
  assert.equal(advanceBookDrop(halfway, false, BOOK_DROP_DURATION / 4), 0.25);
  assert.equal(advanceBookDrop(halfway, true, BOOK_DROP_DURATION), 1);
  assert.equal(advanceBookDrop(1, false, BOOK_DROP_DURATION), 0);
  assert.equal(advanceBookDrop(0, true, 0, true), 1);
  assert.equal(advanceBookDrop(1, false, 0, true), 0);
});
