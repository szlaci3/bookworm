import { createBrowserRouter } from 'react-router-dom';
import CatalogPage from '../pages/CatalogPage';
import BookDetailsPage from '../pages/BookDetailsPage';
import CollectionsPage from '../pages/CollectionsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <CatalogPage />,
  },
  {
    path: '/book/:bookId',
    element: <BookDetailsPage />,
  },
  {
    path: '/collections',
    element: <CollectionsPage />,
  },
]);
