import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectCatalogQuery, selectCatalogSort, selectCatalogFilters } from '../../features/catalog/catalogUI.selectors';
import { applySearch } from '../../features/catalog/catalogUISlice';
import type { CatalogUISort } from '../../features/catalog/catalogUI.types';
import { readTheme, setTheme } from '../theme';
import { ThemeToggle } from './ThemeToggle';

export default function HeaderSearch() {
  const [theme, updateTheme] = useState(readTheme);
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

    const start = draftYearStart ? parseInt(draftYearStart, 10) : undefined;
    const end = draftYearEnd ? parseInt(draftYearEnd, 10) : undefined;
    dispatch(applySearch({
      query: draftQuery,
      filters: {
        author: draftAuthor.trim() || undefined,
        yearRange: start === undefined && end === undefined ? undefined : [start, end],
      },
      sort: draftSort,
    }));
    if (pathname !== '/2d' && pathname !== '/3d') navigate('/');
  };

  function clearFilters(query: string) {
    setDraftQuery(query);
    setDraftAuthor('');
    setDraftYearStart('');
    setDraftYearEnd('');
    setDraftSort('relevance');
    dispatch(applySearch({ query, filters: {}, sort: 'relevance' }));
  }

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
          <ThemeToggle theme={theme} onChange={value => {
            setTheme(value);
            updateTheme(value);
          }} />
          <button type="button" onClick={() => clearFilters(draftQuery)} className="btn btn-secondary">
            Clear filters
          </button>
          <button type="button" onClick={() => clearFilters('')} className="btn btn-secondary">
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
