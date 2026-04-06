import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { 
  selectCatalogQuery, 
  selectCatalogPage,
  selectCatalogSort,
  selectCatalogFilters
} from '../features/catalog/catalogUI.selectors';
import { 
  selectSearchResults, 
  selectSearchStatus, 
  selectSearchError,
  selectSearchTotalFound,
  selectSearchTotalPages,
  selectIsLastPage,
} from '../features/books/books.selectors';
import { 
  setQuery, 
  setPage,
  setAuthorFilter,
  setYearRange,
  setSort,
  resetCatalogUI
} from '../features/catalog/catalogUISlice';
import { searchBooksThunk } from '../features/books/books.thunks';
import { clearSearch } from '../features/books/booksSlice';
import type { CatalogUISort } from '../features/catalog/catalogUI.types';

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  
  // Read applied state from catalogUI
  const query = useAppSelector(selectCatalogQuery);
  const page = useAppSelector(selectCatalogPage);
  const sort = useAppSelector(selectCatalogSort);
  const filters = useAppSelector(selectCatalogFilters);

  // Read search results and status from books slice
  const results = useAppSelector(selectSearchResults);
  const status = useAppSelector(selectSearchStatus);
  const error = useAppSelector(selectSearchError);
  const totalFound = useAppSelector(selectSearchTotalFound);
  const totalPages = useAppSelector(selectSearchTotalPages);
  const isLastPage = useAppSelector(selectIsLastPage);

  // Local draft state for explicit submit flow
  const [draftQuery, setDraftQuery] = useState(query);
  const [draftAuthor, setDraftAuthor] = useState(filters.author || '');
  const [draftYearStart, setDraftYearStart] = useState<string>(filters.yearRange?.[0]?.toString() ?? '');
  const [draftYearEnd, setDraftYearEnd] = useState<string>(filters.yearRange?.[1]?.toString() ?? '');
  const [draftSort, setDraftSort] = useState<CatalogUISort>(sort);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    // Trigger search thunk normally, using the currently applied filters in Redux
    dispatch(searchBooksThunk());
  };

  return (
    <div className="catalog-page">
      <h1>Book Catalog</h1>
      
      {/* Explicit Search Form containing all drafts */}
      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <div className="filter-bar__search">
          <input
            className="input-base"
            type="text"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search for books (e.g. 'Lord of the Rings')"
          />
          <button type="submit" disabled={status === 'loading'} className="btn btn-primary">
            {status === 'loading' ? 'Searching...' : 'Search'}
          </button>
          <button type="button" onClick={handleClearFilters} className="btn btn-secondary">
            Clear filters
          </button>
          <button type="button" onClick={handleClearSearch} className="btn btn-secondary">
            Clear search
          </button>
        </div>

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
              placeholder="e.g. Tolkien"
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
                placeholder="From"
              />
              <span>—</span>
              <input 
                className="input-base"
                type="number" 
                value={draftYearEnd} 
                onChange={(e) => setDraftYearEnd(e.target.value)} 
                placeholder="To"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select className="input-base" value={draftSort} onChange={(e) => setDraftSort(e.target.value as CatalogUISort)}>
              <option value="relevance">Relevance</option>
              <option value="year_asc">Year (Oldest First)</option>
              <option value="year_desc">Year (Newest First)</option>
            </select>
          </div>
        </div>
      </form>

      {/* Info panel */}
      {status === 'succeeded' && results.length > 0 && (
        <div className="results-meta">
          <span>Showing <strong>{results.length}</strong> results of <strong>{totalFound}</strong> total</span>
          <span>Query: "{query}"</span>
        </div>
      )}

      {/* Empty State */}
      {status === 'idle' && (
        <div className="state-message">
          Enter a search term and click Search to find books in the archive.
        </div>
      )}

      {/* Loading State */}
      {status === 'loading' && (
        <div className="state-message">
          Loading search results...
        </div>
      )}

      {/* Error State */}
      {status === 'failed' && (
        <div className="state-message state-message--error">
          <strong>Error:</strong> {error || 'Something went wrong while searching.'}
        </div>
      )}

      {/* Results List */}
      {status === 'succeeded' && results.length === 0 && (
        <div className="state-message">
          No results found for your search.
        </div>
      )}

      {results.length > 0 && (
        <div className="results-container">
          <ul className="results-grid">
            {results.map((book) => (
              <li key={book.id}>
                <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
                  <div className="book-card">
                    <div className="book-card__title">
                      {book.title}
                    </div>
                    <div className="book-card__author">
                      {book.authors.join(', ') || 'Unknown Author'}
                    </div>
                    <div className="book-card__meta">
                      {book.firstPublishYear ? `First published: ${book.firstPublishYear}` : 'Publication year unknown'}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Simple Pagination */}
          <div className="pagination-controls">
            <button 
              className="btn btn-secondary"
              onClick={() => handlePageChange(page - 1)} 
              disabled={page <= 1 || status === 'loading'}
            >
              Previous
            </button>
            <span>
              Page {page} {totalPages > 0 ? `of ${totalPages}` : ''}
            </span>
            <button 
              className="btn btn-secondary"
              onClick={() => handlePageChange(page + 1)} 
              disabled={isLastPage || status === 'loading'}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

