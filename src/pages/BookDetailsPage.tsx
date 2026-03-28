import { useParams } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';
import { selectBooksById } from '../features/books/books.selectors';

export default function BookDetailsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const booksById = useAppSelector(selectBooksById);
  
  const book = bookId ? booksById[bookId] : null;

  return (
    <div>
      <h1>Work Details</h1>
      {book ? (
        <div>
          <h2>{book.title}</h2>
          <p>Key: {book.id}</p>
          <p>Author(s): {book.authors.join(', ')}</p>
          <p>First Published: {book.firstPublishYear || 'Unknown'}</p>
          
          <hr />
          <h3>Additional Details</h3>
          <p>{book.description || 'No description available yet.'}</p>
          
          {/* Placeholder for Add to Collection Dropdown */}
          <button>Add to Collection</button>
        </div>
      ) : (
        <p>Book not discovered in local cache. Fetching dynamically needs to be implemented.</p>
      )}
    </div>
  );
}
