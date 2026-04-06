import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchWorkDetailsThunk } from '../features/books/books.thunks';
import { selectBookById, selectBookDetailStatusById } from '../features/books/books.selectors';

export default function BookDetailsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Make sure we have a valid ID parameter
  const id = bookId || '';

  const book = useAppSelector((state) => selectBookById(state, id));
  const detailStatus = useAppSelector((state) => selectBookDetailStatusById(state, id));

  useEffect(() => {
    // Fetch if the status is idle, regardless of whether we have the book object yet.
    if (id && detailStatus === 'idle') {
      dispatch(fetchWorkDetailsThunk(id));
    }
  }, [id, detailStatus, dispatch]);

  const handleBack = () => {
    // If we have history, go back; otherwise, go to the main catalog.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // If we haven't started or are loading the very first book info
  if (detailStatus === 'loading' && !book) {
    return (
      <div className="state-message">
        <h2>Loading book information...</h2>
      </div>
    );
  }

  // If the API call failed and no book exists
  if (detailStatus === 'failed' && !book) {
    return (
      <div className="state-message state-message--error">
        <h2>Book not found</h2>
        <p>This book could not be retrieved. Please check the ID or try searching for it.</p>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  // Fallback for cases where ID is invalid or missing
  if (!id) {
    navigate('/');
    return null;
  }

  return (
    <div>
      <button 
        onClick={handleBack} 
        className="btn btn-secondary"
        style={{ marginBottom: '1rem' }}
      >
        &larr; Back
      </button>

      {book ? (
        <div className="book-details">
          <div className="book-details__header">
            <h1 className="book-details__title">{book.title || 'Untitled Book'}</h1>
            {book.authors && book.authors.length > 0 ? (
              <div className="book-details__author">
                by {book.authors.join(', ')}
              </div>
            ) : (
              <div className="book-details__author" style={{ opacity: 0.5 }}>Author information not available</div>
            )}
            {book.firstPublishYear && (
              <div className="book-details__meta">First published in {book.firstPublishYear}</div>
            )}
          </div>

          <div>
            {detailStatus === 'loading' && <div className="state-message">Loading additional details...</div>}
            {detailStatus === 'failed' && <div className="state-message state-message--error">Failed to load detailed description and subjects.</div>}

            {(detailStatus === 'succeeded' || book.description) && (
              <>
                <section>
                  <h2 className="book-details__section-title">Description</h2>
                  <p className="book-details__description">
                    {book.description || 'No description available for this work.'}
                  </p>
                </section>

                {book.subjects && book.subjects.length > 0 && (
                  <section>
                    <h2 className="book-details__section-title">Subjects</h2>
                    <div className="subject-tags">
                      {book.subjects.slice(0, 15).map((subject, index) => (
                        <span key={`${subject}-${index}`} className="subject-tag">
                          {subject}
                        </span>
                      ))}
                      {book.subjects.length > 15 && (
                        <span className="subject-tag subject-tag--more">
                          +{book.subjects.length - 15} more
                        </span>
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
