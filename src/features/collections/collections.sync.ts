export const COLLECTIONS_SYNC_CHANNEL = 'bookworm_collections_sync';

let channel: BroadcastChannel | null = null;

/**
 * Get or create the broadcast channel for collection synchronization.
 */
export const getSyncChannel = () => {
  if (typeof window === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(COLLECTIONS_SYNC_CHANNEL);
  }
  return channel;
};

/**
 * Notify other tabs that collections have changed.
 */
export const broadcastCollectionChange = () => {
  const syncChannel = getSyncChannel();
  if (syncChannel) {
    syncChannel.postMessage('SYNC_COLLECTIONS');
  }
};
