import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import CatalogPage from '../pages/CatalogPage';
import BookDetailsPage from '../pages/BookDetailsPage';
import CollectionsPage from '../pages/CollectionsPage';
import CollectionDetailPage from '../features/collections/pages/CollectionDetailPage';

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
      {
        path: '/collections/:collectionId',
        element: <CollectionDetailPage />,
      }
    ]
  }
]);
