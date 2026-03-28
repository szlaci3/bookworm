import { useAppSelector } from '../app/hooks';
import { selectAllCollections } from '../features/collections/collections.selectors';

export default function CollectionsPage() {
  const collections = useAppSelector(selectAllCollections);

  return (
    <div>
      <h1>My Collections</h1>
      
      {/* Placeholder for Create Collection UI */}
      <button>+ New Collection</button>

      {collections.length === 0 && <p>You have no collections yet.</p>}
      
      <ul>
        {collections.map((col) => (
          <li key={col.id}>
            {col.name}
            {/* Connected components would map books here later inside this iteration */}
          </li>
        ))}
      </ul>
    </div>
  );
}
