import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectCatalogQuery, selectCatalogPage } from '../features/catalog/catalogUI.selectors';
import { selectSearchResults, selectSearchStatus } from '../features/books/books.selectors';

export default function CatalogPage() {
  const query = useAppSelector(selectCatalogQuery);
  const page = useAppSelector(selectCatalogPage);
  const results = useAppSelector(selectSearchResults);
  const status = useAppSelector(selectSearchStatus);

  return (
    <div>
      <h1>Catalog Directory</h1>
      <p>
        Status: <strong>{status}</strong> | Query: "{query}" | Page: {page}
      </p>

      {/* Placeholder for Search Input / Form */}
      <div>
        <input type="text" placeholder="Search books..." readOnly />
      </div>

      {/* Placeholder for Results */}
      <ul>
        {results.map((book) => (
          <li key={book.id}>
            {book.title} by {book.authors.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
