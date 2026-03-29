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
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading book information...</h2>
      </div>
    );
  }

  // If the API call failed and no book exists
  if (detailStatus === 'failed' && !book) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Book not found</h2>
        <p>This book could not be retrieved. Please check the ID or try searching for it.</p>
        <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem' }}>
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <button 
        onClick={handleBack} 
        style={{ marginBottom: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
        &larr; Back
      </button>

      {book ? (
        <>
          <h1>{book.title || 'Untitled Book'}</h1>
          {book.authors && book.authors.length > 0 ? (
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              by {book.authors.join(', ')}
            </p>
          ) : (
            <p style={{ color: '#888', fontStyle: 'italic' }}>Author information not available</p>
          )}
      {book.firstPublishYear && (
        <p style={{ color: '#666', marginBottom: '2rem' }}>First published in {book.firstPublishYear}</p>
      )}

      <div style={{ marginTop: '2rem' }}>
        {detailStatus === 'loading' && <p>Loading book details...</p>}
        {detailStatus === 'failed' && <p style={{ color: 'red' }}>Failed to load book details.</p>}

        {(detailStatus === 'succeeded' || book.description) && (
          <>
            <section style={{ marginBottom: '2rem' }}>
              <h2>Description</h2>
              <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {book.description || 'No description available for this work.'}
              </p>
            </section>

            {book.subjects && book.subjects.length > 0 && (
              <section>
                <h2>Subjects</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {book.subjects.slice(0, 15).map((subject, index) => (
                    <span 
                      key={`${subject}-${index}`} 
                      style={{
                        background: '#e0e0e0',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {subject}
                    </span>
                  ))}
                  {book.subjects.length > 15 && (
                    <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.9rem', color: '#666' }}>
                      +{book.subjects.length - 15} more
                    </span>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
    ) : null}
    </div>
  );
}
