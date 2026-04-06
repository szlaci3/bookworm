import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import CatalogPage from '../pages/CatalogPage';
import BookDetailsPage from '../pages/BookDetailsPage';
import CollectionsPage from '../pages/CollectionsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <CatalogPage />,
      },
      {
        path: '/books/:bookId',
        element: <BookDetailsPage />,
      },
      {
        path: '/collections',
        element: <CollectionsPage />,
      },
    ]
  }
]);
