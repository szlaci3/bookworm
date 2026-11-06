import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectCatalogQuery, selectCatalogSort, selectCatalogFilters } from '../../features/catalog/catalogUI.selectors';
import { setQuery, setAuthorFilter, setYearRange, setSort, resetCatalogUI } from '../../features/catalog/catalogUISlice';
import { searchBooksThunk } from '../../features/books/books.thunks';
import { clearSearch } from '../../features/books/booksSlice';
import type { CatalogUISort } from '../../features/catalog/catalogUI.types';

export default function HeaderSearch() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const query = useAppSelector(selectCatalogQuery);
  const sort = useAppSelector(selectCatalogSort);
  const filters = useAppSelector(selectCatalogFilters);
  // Local draft state for explicit submit flow
  const [draftQuery, setDraftQuery] = useState(query);
  const [draftAuthor, setDraftAuthor] = useState(filters.author || '');
  const [draftYearStart, setDraftYearStart] = useState<string>(filters.yearRange?.[0]?.toString() ?? '');
  const [draftYearEnd, setDraftYearEnd] = useState<string>(filters.yearRange?.[1]?.toString() ?? '');
  const [draftSort, setDraftSort] = useState<CatalogUISort>(sort);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.currentTarget.querySelector('details')?.removeAttribute('open');
    if (!draftQuery.trim()) return;

    // Apply all drafts to Redux applied state
    dispatch(setQuery(draftQuery));
    dispatch(setAuthorFilter(draftAuthor.trim() ? draftAuthor.trim() : undefined));
    
    const startNum = draftYearStart ? parseInt(draftYearStart, 10) : undefined;
    const endNum = draftYearEnd ? parseInt(draftYearEnd, 10) : undefined;
    
    if (startNum === undefined && endNum === undefined) {
      dispatch(setYearRange(undefined));
    } else {
      dispatch(setYearRange([startNum, endNum]));
    }
    
    dispatch(setSort(draftSort));
    
    // Each setter above resets the page to 1 automatically in the reducer
    // Now trigger the actual API request explicitly
    dispatch(searchBooksThunk());
    if (pathname !== '/2d' && pathname !== '/3d') navigate('/');
  };

  const handleClearSearch = () => {
    // Clear local inputs entirely
    setDraftQuery('');
    setDraftAuthor('');
    setDraftYearStart('');
    setDraftYearEnd('');
    setDraftSort('relevance');

    // Clear applied Redux state
    dispatch(resetCatalogUI());
    dispatch(setQuery(''));

    // Purge results data, don't trigger new API call
    dispatch(clearSearch());
  };

  const handleClearFilters = () => {
    // Keep current search query, but clear draft filters
    setDraftAuthor('');
    setDraftYearStart('');
    setDraftYearEnd('');
    setDraftSort('relevance');

    // Apply to Redux state
    dispatch(setQuery(draftQuery));
    dispatch(setAuthorFilter(undefined));
    dispatch(setYearRange(undefined));
    dispatch(setSort('relevance'));

    // Trigger API call using current query without filters
    if (draftQuery.trim()) {
      dispatch(searchBooksThunk());
    }
  };

  return (
      <form onSubmit={handleSearchSubmit} className="header-search">
        <div className="header-search__primary">
          <input
            className="input-base"
            type="text"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search books…" aria-label="Search books"
          />
          <button type="submit" className="btn btn-primary" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          </button>
        </div>
        <details className="header-overflow">
          <summary aria-label="More search and navigation options">•••</summary>
          <div className="header-overflow__panel">
            <nav className="overflow-nav" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}><Link to={pathname === '/3d' ? '/2d' : '/3d'}>{pathname === '/3d' ? '2D' : '3D'}</Link><Link to="/collections">Collections</Link></nav>
          <button type="button" onClick={handleClearFilters} className="btn btn-secondary">
            Clear filters
          </button>
          <button type="button" onClick={handleClearSearch} className="btn btn-secondary">
            Clear search
          </button>


        {/* Filter and Sort Draft Controls */}
        <div className="filter-bar__options">
          {/* Author Filter */}
          <div className="filter-group">
            <label>Author contains</label>
            <input 
              className="input-base"
              type="text" 
              value={draftAuthor} 
              onChange={(e) => setDraftAuthor(e.target.value)} 
              placeholder="e.g. Tolkien" aria-label="Author contains"
            />
          </div>

          {/* Year Range Filter */}
          <div className="filter-group">
            <label>Publication Year</label>
            <div className="filter-group__range">
              <input 
                className="input-base"
                type="number" 
                value={draftYearStart} 
                onChange={(e) => setDraftYearStart(e.target.value)} 
                placeholder="From" aria-label="Publication year from"
              />
              <span>—</span>
              <input 
                className="input-base"
                type="number" 
                value={draftYearEnd} 
                onChange={(e) => setDraftYearEnd(e.target.value)} 
                placeholder="To" aria-label="Publication year to"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select aria-label="Sort by" className="input-base" value={draftSort} onChange={(e) => setDraftSort(e.target.value as CatalogUISort)}>
              <option value="relevance">Relevance</option>
              <option value="year_asc">Year (Oldest First)</option>
              <option value="year_desc">Year (Newest First)</option>
            </select>
          </div>
        </div>
          </div>
        </details>
      </form>

  );
}
