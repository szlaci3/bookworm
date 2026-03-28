import React from 'react';
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
  selectSearchError 
} from '../features/books/books.selectors';
import { 
  setQuery, 
  setPage,
  setAuthorFilter,
  setYearRange,
  setSort
} from '../features/catalog/catalogUISlice';
import { searchBooksThunk } from '../features/books/books.thunks';
import type { CatalogUISort } from '../features/catalog/catalogUI.types';

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  
  // Read query, page, sort, filters from catalogUI
  const query = useAppSelector(selectCatalogQuery);
  const page = useAppSelector(selectCatalogPage);
  const sort = useAppSelector(selectCatalogSort);
  const filters = useAppSelector(selectCatalogFilters);

  // Read search results and status from books slice
  const results = useAppSelector(selectSearchResults);
  const status = useAppSelector(selectSearchStatus);
  const error = useAppSelector(selectSearchError);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep input controlled via catalogUI state
    dispatch(setQuery(e.target.value));
  };

  const handleSearchSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      // Trigger search thunk only on explicit submit
      dispatch(searchBooksThunk());
    }
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    // Trigger search thunk on page change
    dispatch(searchBooksThunk());
  };

  // --- Handlers for Filters and Sort ---
  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    dispatch(setAuthorFilter(val ? val : undefined));
    if (query.trim()) {
      dispatch(searchBooksThunk());
    }
  };

  const handleYearChange = (index: 0 | 1, value: string) => {
    const num = value ? parseInt(value, 10) : undefined;
    const currentRange = filters.yearRange || [undefined, undefined];
    const newRange: [number | undefined, number | undefined] = [...currentRange] as [number | undefined, number | undefined];
    newRange[index] = Number.isNaN(num) ? undefined : num;

    if (newRange[0] === undefined && newRange[1] === undefined) {
      dispatch(setYearRange(undefined));
    } else {
      dispatch(setYearRange(newRange));
    }
    
    if (query.trim()) {
      dispatch(searchBooksThunk());
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSort(e.target.value as CatalogUISort));
    if (query.trim()) {
      dispatch(searchBooksThunk());
    }
  };

  return (
    <div className="catalog-page">
      <h1>Book Catalog</h1>
      
      {/* Search Input and Submit/Search Trigger */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for books (e.g. 'Lord of the Rings')"
          style={{ padding: '0.5rem', width: '300px' }}
        />
        <button type="submit" disabled={status === 'loading'} style={{ padding: '0.5rem' }}>
          {status === 'loading' ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Filter and Sort Controls */}
      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Filters & Sort (Server-side)</h3>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Author Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Author contains:</label>
            <input 
              type="text" 
              value={filters.author || ''} 
              onChange={handleAuthorChange} 
              placeholder="e.g. Tolkien"
              style={{ padding: '0.25rem' }}
            />
          </div>

          {/* Year Range Filter */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Year Range:</label>
            <input 
              type="number" 
              value={filters.yearRange?.[0] ?? ''} 
              onChange={(e) => handleYearChange(0, e.target.value)} 
              placeholder="From"
              style={{ padding: '0.25rem', width: '80px', marginRight: '0.5rem' }}
            />
            <input 
              type="number" 
              value={filters.yearRange?.[1] ?? ''} 
              onChange={(e) => handleYearChange(1, e.target.value)} 
              placeholder="To"
              style={{ padding: '0.25rem', width: '80px' }}
            />
          </div>

          {/* Sort */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Sort by:</label>
            <select value={sort} onChange={handleSortChange} style={{ padding: '0.25rem' }}>
              <option value="relevance">Relevance</option>
              <option value="year_asc">Year (Oldest First)</option>
              <option value="year_desc">Year (Newest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Status: <strong>{status}</strong> | Query: "{query}" | Page: {page}
        <br />
        Showing {results.length} results on this page
      </p>

      {/* Loading State */}
      {status === 'loading' && <p>Loading search results...</p>}

      {/* Error State */}
      {status === 'failed' && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>
          Error: {error || 'Something went wrong while searching.'}
        </p>
      )}

      {/* Results List */}
      {status === 'succeeded' && results.length === 0 && <p>No results found.</p>}

      {results.length > 0 && (
        <div className="results-container">
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {results.map((book) => (
              <li key={book.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{book.title}</div>
                <div style={{ fontSize: '0.9rem' }}>
                  by {book.authors.join(', ') || 'Unknown Author'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                  First published: {book.firstPublishYear || 'N/A'}
                </div>
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
            <span>Page {page}</span>
            <button 
              onClick={() => handlePageChange(page + 1)} 
              disabled={status === 'loading'}
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
