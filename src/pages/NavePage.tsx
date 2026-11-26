import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { booksApi, withDetails } from '../features/books/booksApi';
import { useBookSearch } from '../features/books/useBookSearch';
import { nearbyBooksChanged } from '../features/nave/prefetch';
import { setPage } from '../features/catalog/catalogUISlice';
import { useLibraryBook } from '../features/collections/useLibraryBook';
import { createNaveScene } from '../features/nave/createNaveScene';
import { DETAIL_PRELOAD_COUNT, PAGE_PRELOAD_REMAINING } from '../features/nave/navigation';
import '../features/nave/nave.css';

function NaveExperience() {
  const dispatch = useAppDispatch();
  const { currentData, hasNextPage, isError, isFetching, fetchNextPage, error } = useBookSearch(1);
  const books = useMemo(() => {
    const results = currentData?.pages.flatMap(page => page.results) ?? [];
    return Array.from(new Map(results.map(book => [book.id, book])).values());
  }, [currentData]);
  const totalFound = currentData?.pages[0].totalFound ?? 0;
  const query = useAppSelector(state => state.catalogUI.query);
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 700px)').matches);
  const [unavailable, setUnavailable] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createNaveScene> | null>(null);
  const summary = books[index];
  const detail = booksApi.useDetailsQuery(summary?.id ?? '', { skip: !summary });
  const current = withDetails(summary, detail.currentData);
  const { isSaved, toggleSaved } = useLibraryBook(current);

  useEffect(() => {
    if (!host.current) return;
    try { scene.current = createNaveScene(host.current, setIndex, () => setUnavailable(true)); }
    catch { queueMicrotask(() => setUnavailable(true)); }
    return () => { scene.current?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.update(books, false); }, [books]);
  useEffect(() => {
    dispatch(nearbyBooksChanged(books.slice(index + 1, index + DETAIL_PRELOAD_COUNT + 1).map(book => book.id)));
    return () => { dispatch(nearbyBooksChanged([])); };
  }, [dispatch, books, index]);
  useEffect(() => {
    if (books.length && index >= books.length - PAGE_PRELOAD_REMAINING && hasNextPage && !isFetching && !isError) {
      void fetchNextPage();
    }
  }, [index, books.length, hasNextPage, isFetching, isError, fetchNextPage]);

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
      <div className="nave-heading"><span>THE LIBRARY</span><h1>{query ? `A journey through “${query}”` : 'A world of books'}</h1><p>{totalFound.toLocaleString()} books to discover</p></div>
      {unavailable && <div className="nave-notice" role="alert">3D rendering is unavailable. <Link to="/2d">Browse the 2D catalog</Link></div>}
      {!books.length && <div className="nave-notice" role="status">{isFetching ? 'Searching the library…' : isError ? (typeof error === 'string' ? error : 'Search failed.') : query ? 'No books found. Try another search.' : 'Search above to enter the library.'}</div>}
      <button className="nave-details-toggle" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} aria-controls="current-book-details">{collapsed ? '‹ Book details' : 'Hide details ›'}</button>
      {!collapsed && <aside id="current-book-details" className="nave-details" aria-label="Current book details">
        <span className="nave-eyebrow">CURRENT BOOK {books.length ? `· ${index + 1}` : ''}</span>
        {current ? <>
          <h2>{current.title}</h2><p className="nave-author">{current.authors.join(', ') || 'Unknown author'}</p>
          <p className="nave-meta">{current.firstPublishYear ? `First published ${current.firstPublishYear}` : 'Publication year unknown'}{current.editionCount ? ` · ${current.editionCount} editions` : ''}</p>
          <div className="nave-actions"><button className="btn btn-primary" onClick={toggleSaved}>{isSaved ? 'Remove from library' : 'Save to library'}</button><Link to={`/books/${current.id}`} state={{ book: current }}>Full details ↗</Link></div>
          {(!detail.currentData && !detail.isError) && <p className="nave-loading" role="status">Loading book details…</p>}
          {detail.isError && <div role="alert"><p>{typeof detail.error === 'string' ? detail.error : 'Could not load book details.'}</p><button className="btn btn-secondary" onClick={() => detail.refetch()}>Retry details</button></div>}
          {detail.currentData && <><h3>About this book</h3><p className="nave-description">{current.description || 'No description available for this book.'}</p>{!!current.subjects?.length && <div className="nave-subjects">{current.subjects.slice(0, 8).map(subject => <span key={subject}>{subject}</span>)}</div>}</>}
        </> : <p>Book details appear here as you explore.</p>}
      </aside>}
      <div className="nave-bottom">
        <div className="nave-progress" aria-live="polite">{current ? `${index + 1} / ${totalFound.toLocaleString()}` : 'Bookworm'}<span>{index === 0 ? 'Beginning of the aisle' : index === books.length - 1 ? hasNextPage ? 'End of loaded books' : 'End of the aisle' : 'Follow your curiosity'}</span></div>
        <div className="nave-controls" aria-label="Movement controls">
          <button {...controls(-1)} disabled={!current || index === 0} aria-label="Walk backward"><span>↓</span><small>Backward</small></button>
          <div className="nave-controls__hint">WALK THE AISLE<br/><span>↑ &nbsp; ↓</span></div>
          <button {...controls(1)} disabled={!current || index >= books.length - 1} aria-label="Walk forward"><span>↑</span><small>Forward</small></button>
        </div>
        <div className="nave-page-status" role="status">{books.length > 0 && isFetching ? 'Loading more books…' : 'Use your keyboard or hold the arrows'}</div>
      </div>
      {books.length > 0 && isError && <div className="nave-notice" role="alert">{(typeof error === 'string' ? error : 'Search failed.')}<button className="btn btn-primary" onClick={() => fetchNextPage()}>Retry loading more books</button></div>}
    </section>
  );
}
export default function NavePage() {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector(state => state.catalogUI);
  useEffect(() => {
    if (catalog.page !== 1) dispatch(setPage(1));
  }, [dispatch, catalog.page]);
  return <NaveExperience key={catalog.revision} />;
}
