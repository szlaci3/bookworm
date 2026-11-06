import { createBrowserRouter, redirect } from 'react-router-dom';
import Layout from './Layout';
import CatalogPage from '../pages/CatalogPage';
import BookDetailsPage from '../pages/BookDetailsPage';
import CollectionsPage from '../pages/CollectionsPage';
import CollectionDetailPage from '../features/collections/pages/CollectionDetailPage';

import { readCatalogView } from './viewPreference';
import LazyNavePage from '../pages/LazyNavePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        loader: async () => redirect('/' + await readCatalogView()),
      },
      {
        path: '/2d',
        element: <CatalogPage />,
      },
      {
        path: '/3d',
        element: <LazyNavePage />,
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
