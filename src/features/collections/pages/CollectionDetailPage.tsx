import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectCollectionById, selectBooksForCollection } from '../collections.selectors';
import { removeBookFromCollection } from '../collectionsSlice';
import type { Book } from '../../../types/books';
import type { CollectionId } from '../../../types/ids';

function CollectionBookItem({ book, collectionId }: { book: Book; collectionId: CollectionId }) {
  const dispatch = useAppDispatch();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(removeBookFromCollection({ collectionId, bookId: book.id }));
  };

  return (
    <li>
      <Link to={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
        <div className="book-card">
          <div className="book-card__title">
            {book.title}
          </div>
          <div className="book-card__author">
            {book.authors.join(', ') || 'Unknown Author'}
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
              className="btn btn-secondary btn-light" 
              onClick={handleRemove}
              style={{ fontSize: '0.8rem', padding: 'var(--space-1) var(--space-2)' }}
            >
              Remove
            </button>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  
  const id = collectionId as CollectionId;
  // Note: we use our factory selectors to get the specific data for this ID
  const collection = useAppSelector(selectCollectionById(id));
  const books = useAppSelector(selectBooksForCollection(id));

  if (!collection) {
    return (
      <div className="state-message state-message--error">
        <h2>Collection Not Found</h2>
        <p>The collection you are looking for does not exist or has been deleted.</p>
        <Link to="/collections" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
          Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="collection-detail-page">
      <div className="collections-header">
        <h1>{collection.name}</h1>
        <Link to="/collections" className="btn btn-secondary">
          Back to Collections
        </Link>
      </div>

      {collection.description && (
        <div 
          className="collection-description" 
          style={{ 
            marginBottom: 'var(--space-5)', 
            fontStyle: 'italic', 
            color: 'var(--text-secondary)',
            fontSize: '1.1rem',
            padding: '0 var(--space-1)'
          }}
        >
          {collection.description}
        </div>
      )}

      {books.length === 0 ? (
        <div className="state-message">
          This collection is currently empty.
        </div>
      ) : (
        <div className="results-container">
          <ul className="results-grid">
            {books.map((book) => (
              <CollectionBookItem key={book.id} book={book} collectionId={id} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
