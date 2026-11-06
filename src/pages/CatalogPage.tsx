import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { 
  selectCatalogQuery, 
  selectCatalogPage,
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
  setPage,
} from '../features/catalog/catalogUISlice';
import { searchBooksThunk } from '../features/books/books.thunks';
import { selectIsBookSaved } from '../features/collections/collections.selectors';
import { addBookToCollectionThunk, removeBookFromCollectionThunk } from '../features/collections/collections.thunks';
import { LIBRARY_COLLECTION_ID } from '../features/collections/collections.constants';
import type { Book } from '../types/books';

function BookResultItem({ book }: { book: Book }) {
  const dispatch = useAppDispatch();
  const isSaved = useAppSelector((state) => selectIsBookSaved(state, book.id));

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSaved) {
      dispatch(removeBookFromCollectionThunk({ collectionId: LIBRARY_COLLECTION_ID, bookId: book.id }));
    } else {
      dispatch(addBookToCollectionThunk({ collectionId: LIBRARY_COLLECTION_ID, bookId: book.id }));
    }
  };

  return (
    <li>
      <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
        <div className="book-card">
          <div className="book-card__main">
            <div className="book-card__thumbnail">
              {book.coverId ? (
                <img 
                  src={`https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`} 
                  alt={book.title} 
                  loading="lazy"
                />
              ) : (
                <div className="book-card__thumbnail-placeholder">📚</div>
              )}
            </div>
            <div className="book-card__info">
              <div className="book-card__title">
                {book.title}
              </div>
              <div className="book-card__author">
                {book.authors.join(', ') || 'Unknown Author'}
              </div>
            </div>
          </div>
          <div 
            className="book-card__meta" 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              {book.firstPublishYear ? `First published: ${book.firstPublishYear}` : 'Publication year unknown'}
            </span>
            <button 
              type="button" 
              className={`btn ${isSaved ? 'btn-secondary btn-light' : 'btn-primary'}`} 
              onClick={handleSaveToggle}
              style={{ fontSize: '0.8rem', padding: 'var(--space-1) var(--space-2)' }}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function CatalogPage() {
  const dispatch = useAppDispatch();
  const normalized = useRef(false);
  const cumulative = useAppSelector(state => state.books.search.cumulative);
  useEffect(() => {
    if (cumulative && !normalized.current) {
      normalized.current = true; dispatch(setPage(1)); dispatch(searchBooksThunk());
    }
  }, [dispatch, cumulative]);
  // Read applied state from catalogUI
  const query = useAppSelector(selectCatalogQuery);
  const page = useAppSelector(selectCatalogPage);

  // Read search results and status from books slice
  const results = useAppSelector(selectSearchResults);
  const status = useAppSelector(selectSearchStatus);
  const error = useAppSelector(selectSearchError);
  const totalFound = useAppSelector(selectSearchTotalFound);
  const totalPages = useAppSelector(selectSearchTotalPages);
  const isLastPage = useAppSelector(selectIsLastPage);

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
    // Trigger search thunk normally, using the currently applied filters in Redux
    dispatch(searchBooksThunk());
    window.scrollTo(0, 0);
  };

  const renderResultsMeta = (position: 'top' | 'bottom') => {
    return (
      <div className={`results-meta ${position === 'bottom' ? 'results-meta--bottom' : ''}`}>
        <div className="results-meta__info">
          <span>Showing <strong>{results.length}</strong> results of <strong>{totalFound}</strong> total</span>
          {query && <span>Query: "{query}"</span>}
        </div>

        <div className={`pagination-controls ${position === 'top' ? 'pagination-controls--top' : ''}`}>
          <button 
            className="btn btn-secondary"
            onClick={() => handlePageChange(page - 1)} 
            disabled={page <= 1}
          >
            Previous
          </button>
          <span>
            Page {page} {totalPages > 0 ? `of ${totalPages}` : ''}
          </span>
          <button 
            className="btn btn-secondary"
            onClick={() => handlePageChange(page + 1)} 
            disabled={isLastPage}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="catalog-page">
      <h1>Book Catalog</h1>
      
      {/* Info panel */}
      {status === 'succeeded' && results.length > 0 && renderResultsMeta('top')}

      {/* Empty State */}
      {status === 'idle' && (
        <div className="state-message">
          Enter a search term and click Search to find books in the archive.
        </div>
      )}

      {/* Loading State */}
      {status === 'loading' && (
        <div className="state-message state-message--loading">
          Searching the archives...
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
              <BookResultItem key={book.id} book={book} />
            ))}
          </ul>

          {/* Bottom results meta */}
          {renderResultsMeta('bottom')}
        </div>
      )}
    </div>
  );
}

