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
import { setQuery, setPage } from '../features/catalog/catalogUISlice';
import { searchBooksThunk } from '../features/books/books.thunks';

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
      dispatch(searchBooksThunk(query, 1));
    }
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    // Trigger search thunk on page change
    dispatch(searchBooksThunk(query, newPage));
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

      {/* Info panel */}
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Status: <strong>{status}</strong> | Query: "{query}" | Page: {page} | Sort: {sort}
        {filters.author && ` | Author: ${filters.author}`}
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
      {status === 'succeeded' && results.length === 0 && <p>No results found for "{query}".</p>}

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
