import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { router } from './app/router';
import { useAppDispatch } from './app/hooks';
import { initializeCollectionsFromStorage } from './features/collections/collections.thunks';
import { getSyncChannel } from './features/collections/collections.sync';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial load
    dispatch(initializeCollectionsFromStorage());

    // Listen for changes from other tabs
    const syncChannel = getSyncChannel();
    if (syncChannel) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data === 'SYNC_COLLECTIONS') {
          dispatch(initializeCollectionsFromStorage());
        }
      };
      syncChannel.addEventListener('message', handleMessage);
      return () => {
        syncChannel.removeEventListener('message', handleMessage);
      };
    }
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;