import { useAppDispatch, useAppSelector } from '../app/hooks';
import { 
  selectCatalogQuery, 
  selectCatalogPage,
} from '../features/catalog/catalogUI.selectors';
import { 
  setPage,
} from '../features/catalog/catalogUISlice';
import { useBookSearch } from '../features/books/useBookSearch';
import { BookCard } from '../app/components/BookCard';
import { useLibraryBook } from '../features/collections/useLibraryBook';
import type { Book } from '../types/books';

function BookResultItem({ book }: { book: Book }) {
  const { isSaved, toggleSaved } = useLibraryBook(book);
  return <li><BookCard book={book} action={isSaved ? 'Saved' : 'Save'} onAction={toggleSaved} /></li>;
}

function CatalogResults() {
  const dispatch = useAppDispatch();
  const query = useAppSelector(selectCatalogQuery);
  const page = useAppSelector(selectCatalogPage);
  const { currentData, isError, error } = useBookSearch(page);
  const result = currentData?.pages[0];
  const results = result?.results ?? [];
  const totalFound = result?.totalFound ?? 0;
  const totalPages = Math.ceil(totalFound / 100);
  const isLastPage = page >= totalPages;
  const status = !query.trim() ? 'idle' : result ? 'succeeded' : isError ? 'failed' : 'loading';

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
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
          <strong>Error:</strong> {typeof error === 'string' ? error : 'Something went wrong while searching.'}
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



export default function CatalogPage() {
  // Resubmitting a failed search retries its query subscription.
  const revision = useAppSelector(state => state.catalogUI.revision);
  return <CatalogResults key={revision} />;
}
