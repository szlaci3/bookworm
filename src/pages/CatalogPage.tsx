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
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search for books (e.g. 'Lord of the Rings')"
            style={{ padding: '0.5rem', width: '300px' }}
          />
          <button type="submit" disabled={status === 'loading'} style={{ padding: '0.5rem' }}>
            {status === 'loading' ? 'Searching...' : 'Search'}
          </button>
          <button type="button" onClick={handleClearFilters} style={{ padding: '0.5rem' }}>
            Clear filters
          </button>
          <button type="button" onClick={handleClearSearch} style={{ padding: '0.5rem' }}>
            Clear search
          </button>
        </div>

        {/* Filter and Sort Draft Controls */}
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>Filters & Sort (Drafting)</h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Author Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Author contains:</label>
              <input 
                type="text" 
                value={draftAuthor} 
                onChange={(e) => setDraftAuthor(e.target.value)} 
                placeholder="e.g. Tolkien"
                style={{ padding: '0.25rem' }}
              />
            </div>

            {/* Year Range Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Year Range:</label>
              <input 
                type="number" 
                value={draftYearStart} 
                onChange={(e) => setDraftYearStart(e.target.value)} 
                placeholder="From"
                style={{ padding: '0.25rem', width: '80px', marginRight: '0.5rem' }}
              />
              <input 
                type="number" 
                value={draftYearEnd} 
                onChange={(e) => setDraftYearEnd(e.target.value)} 
                placeholder="To"
                style={{ padding: '0.25rem', width: '80px' }}
              />
            </div>

            {/* Sort */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Sort by:</label>
              <select value={draftSort} onChange={(e) => setDraftSort(e.target.value as CatalogUISort)} style={{ padding: '0.25rem' }}>
                <option value="relevance">Relevance</option>
                <option value="year_asc">Year (Oldest First)</option>
                <option value="year_desc">Year (Newest First)</option>
              </select>
            </div>
          </div>
        </div>
      </form>

      {/* Info panel */}
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Status: <strong>{status}</strong> | Query: "{query}" | Page: {page}
        <br />
        Showing {results.length} results of {totalFound} total
      </p>

      {/* Empty State */}
      {status === 'idle' && <p style={{ fontStyle: 'italic', color: '#555' }}>Enter a search term and click Search to find books.</p>}

      {/* Loading State */}
      {status === 'loading' && <p>Loading search results...</p>}

      {/* Error State */}
      {status === 'failed' && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          Error: {error || 'Something went wrong while searching.'}
        </p>
      )}

      {/* Results List */}
      {status === 'succeeded' && results.length === 0 && <p>No results found for your search.</p>}

      {results.length > 0 && (
        <div className="results-container">
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {results.map((book) => (
              <li key={book.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <Link to={`/books/${book.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1a0dab', marginBottom: '0.2rem' }}>
                    {book.title}
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    by {book.authors.join(', ') || 'Unknown Author'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    First published: {book.firstPublishYear || 'N/A'}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Simple Pagination */}
          <div className="pagination" style={{ marginTop: '1rem' }}>
            <button 
              onClick={() => handlePageChange(page - 1)} 
              disabled={page <= 1 || status === 'loading'}
              style={{ marginRight: '0.5rem' }}
            >
              Previous
            </button>
            <span>
              Page {page} {totalPages > 0 ? `of ${totalPages}` : ''}
            </span>
            <button 
              onClick={() => handlePageChange(page + 1)} 
              disabled={isLastPage || status === 'loading'}
              style={{ marginLeft: '0.5rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

