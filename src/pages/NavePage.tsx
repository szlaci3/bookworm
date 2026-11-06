import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectSearchResults } from '../features/books/books.selectors';
import { fetchWorkDetailsThunk, searchBooksThunk } from '../features/books/books.thunks';
import { setPage } from '../features/catalog/catalogUISlice';
import { selectIsBookSaved } from '../features/collections/collections.selectors';
import { addBookToCollectionThunk, removeBookFromCollectionThunk } from '../features/collections/collections.thunks';
import { LIBRARY_COLLECTION_ID } from '../features/collections/collections.constants';
import { createNaveScene } from '../features/nave/createNaveScene';
import { DETAIL_PRELOAD_COUNT, PAGE_PRELOAD_REMAINING } from '../features/nave/navigation';
import '../features/nave/nave.css';

function NaveExperience() {
  const dispatch = useAppDispatch();
  const books = useAppSelector(selectSearchResults);
  const search = useAppSelector(state => state.books.search);
  const query = useAppSelector(state => state.catalogUI.query);
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const [unavailable, setUnavailable] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createNaveScene> | null>(null);
  const current = books[index];
  const detailStatus = useAppSelector(state => current ? state.books.detailsStatusById[current.id] : undefined);
  const detailError = useAppSelector(state => current ? state.books.detailsErrorById[current.id] : undefined);
  const saved = useAppSelector(state => current ? selectIsBookSaved(state, current.id) : false);

  useEffect(() => {
    if (!host.current) return;
    try { scene.current = createNaveScene(host.current, setIndex, () => setUnavailable(true)); }
    catch { queueMicrotask(() => setUnavailable(true)); }
    return () => { scene.current?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.update(books, false); }, [books]);
  useEffect(() => {
    // Current work plus the next two works. The thunk deduplicates cached/in-flight details.
    for (const book of books.slice(index, index + DETAIL_PRELOAD_COUNT + 1)) dispatch(fetchWorkDetailsThunk(book.id));
  }, [dispatch, books, index]);
  useEffect(() => {
    if (books.length && index >= books.length - PAGE_PRELOAD_REMAINING && search.hasMore && search.status === 'succeeded') {
      dispatch(searchBooksThunk({ page: search.loadedPage + 1, append: true }));
    }
  }, [dispatch, index, books.length, search.hasMore, search.loadedPage, search.status]);

  const save = () => {
    if (!current) return;
    dispatch(saved ? removeBookFromCollectionThunk({ collectionId: LIBRARY_COLLECTION_ID, bookId: current.id })
      : addBookToCollectionThunk({ collectionId: LIBRARY_COLLECTION_ID, bookId: current.id }));
  };
  const controls = (direction: number) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.blur(); scene.current?.move(direction);
    },
    onPointerUp: () => scene.current?.move(0),
    onPointerCancel: () => scene.current?.move(0),
    onLostPointerCapture: () => scene.current?.move(0),
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); scene.current?.move(direction); }
    },
    onKeyUp: () => scene.current?.move(0),
    onBlur: () => scene.current?.move(0),
  });
  return (
    <section className="nave-page" aria-label="3D book catalog">
      <div className="nave-viewport" ref={host} />
      <div className="nave-heading"><span>THE LIBRARY</span><h1>{query ? `A journey through “${query}”` : 'A world of books'}</h1><p>{search.totalFound.toLocaleString()} books to discover</p></div>
      {unavailable && <div className="nave-notice" role="alert">3D rendering is unavailable. <Link to="/2d">Browse the 2D catalog</Link></div>}
      {!books.length && <div className="nave-notice" role="status">{search.status === 'loading' ? 'Searching the library…' : search.status === 'failed' ? search.error : query ? 'No books found. Try another search.' : 'Search above to enter the library.'}</div>}
      <button className="nave-details-toggle" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-controls="current-book-details">{collapsed ? '‹ Book details' : 'Hide details ›'}</button>
      {!collapsed && <aside id="current-book-details" className="nave-details" aria-label="Current book details">
        <span className="nave-eyebrow">CURRENT BOOK {books.length ? `· ${index + 1}` : ''}</span>
        {current ? <>
          <h2>{current.title}</h2><p className="nave-author">{current.authors.join(', ') || 'Unknown author'}</p>
          <p className="nave-meta">{current.firstPublishYear ? `First published ${current.firstPublishYear}` : 'Publication year unknown'}{current.editionCount ? ` · ${current.editionCount} editions` : ''}</p>
          <div className="nave-actions"><button className="btn btn-primary" onClick={save}>{saved ? 'Remove from library' : 'Save to library'}</button><Link to={`/books/${current.id}`}>Full details ↗</Link></div>
          {(!detailStatus || detailStatus === 'idle' || detailStatus === 'loading') && <p className="nave-loading" role="status">Loading book details…</p>}
          {detailStatus === 'failed' && <div role="alert"><p>{detailError || 'Could not load book details.'}</p><button className="btn btn-secondary" onClick={() => dispatch(fetchWorkDetailsThunk(current.id))}>Retry details</button></div>}
          {detailStatus === 'succeeded' && <><h3>About this book</h3><p className="nave-description">{current.description || 'No description available for this book.'}</p>{!!current.subjects?.length && <div className="nave-subjects">{current.subjects.slice(0, 8).map(subject => <span key={subject}>{subject}</span>)}</div>}</>}
        </> : <p>Book details appear here as you explore.</p>}
      </aside>}
      <div className="nave-bottom">
        <div className="nave-progress" aria-live="polite">{current ? `${index + 1} / ${search.totalFound.toLocaleString()}` : 'Bookworm'}<span>{index === 0 ? 'Beginning of the aisle' : index === books.length - 1 ? search.hasMore ? 'End of loaded books' : 'End of the aisle' : 'Follow your curiosity'}</span></div>
        <div className="nave-controls" aria-label="Movement controls">
          <button {...controls(-1)} disabled={!current || index === 0} aria-label="Walk backward"><span>↓</span> <kbd>S</kbd><small>Backward</small></button>
          <div className="nave-controls__hint">WALK THE AISLE<br/><span>↑ / W &nbsp; ↓ / S</span></div>
          <button {...controls(1)} disabled={!current || index >= books.length - 1} aria-label="Walk forward"><span>↑</span> <kbd>W</kbd><small>Forward</small></button>
        </div>
        <div className="nave-page-status" role="status">{books.length > 0 && search.status === 'loading' ? 'Loading more books…' : 'Use your keyboard or hold the arrows'}</div>
      </div>
      {books.length > 0 && search.status === 'failed' && <div className="nave-notice" role="alert">{search.error}<button className="btn btn-primary" onClick={() => dispatch(searchBooksThunk({ page: search.loadedPage + 1, append: true }))}>Retry loading more books</button></div>}
    </section>
  );
}
export default function NavePage() {
  const dispatch = useAppDispatch();
  const generation = useAppSelector(state => state.books.search.generation);
  const normalized = useRef(false);
  const search = useAppSelector(state => state.books.search);
  useEffect(() => {
    if (!normalized.current && search.loadedPage > 1 && !search.cumulative) {
      normalized.current = true; dispatch(setPage(1)); dispatch(searchBooksThunk());
    }
  }, [dispatch, search.loadedPage, search.cumulative]);
  return <NaveExperience key={generation} />;
}
