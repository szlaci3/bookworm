import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectAllCollections, selectMemberships } from '../features/collections/collections.selectors';
import { createCollection, renameCollection, deleteCollection } from '../features/collections/collectionsSlice';

export default function CollectionsPage() {
  const dispatch = useAppDispatch();
  const collections = useAppSelector(selectAllCollections);
  const memberships = useAppSelector(selectMemberships);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormName('');
    setIsModalOpen(true);
  };

  const openEditModal = (id: string, currentName: string) => {
    setModalMode('edit');
    setEditingId(id);
    setFormName(currentName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (modalMode === 'create') {
      const generatedId = 'col_' + Date.now(); // simplistic ID generation for front-end demo
      dispatch(createCollection({ id: generatedId, name: formName.trim() }));
    } else if (modalMode === 'edit' && editingId) {
      dispatch(renameCollection({ id: editingId, newName: formName.trim() }));
    }
    
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this collection? This action cannot be undone.")) {
      dispatch(deleteCollection(id));
      closeModal();
    }
  };

  return (
    <div>
      <div className="collections-header">
        <h1>My Collections</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          + New Collection
        </button>
      </div>

      {collections.length === 0 && (
        <div className="state-message">
          You have no collections yet. Create one to start organizing books.
        </div>
      )}
      
      {collections.length > 0 && (
        <ul className="collections-grid">
          {collections.map((col) => {
            const bookCount = memberships[col.id]?.length || 0;
            return (
              <li key={col.id}>
                <div className="collection-card-shell">
                  <div className="collection-card">
                    <div className="collection-card__title">{col.name}</div>
                    <div className="collection-card__meta">
                      {bookCount} book{bookCount === 1 ? '' : 's'}
                    </div>
                    <div className="collection-card__actions">
                      {!col.isSystem && (
                        <button 
                          className="btn btn-secondary btn-light" 
                          onClick={() => openEditModal(col.id, col.name)}
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        >
                          Edit
                        </button>
                      )}
                      <Link 
                        to={`/collections/${col.id}`} 
                        className="btn btn-primary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>{modalMode === 'create' ? 'Create Collection' : 'Edit Collection'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="modal-form-group">
                <label>Collection Name</label>
                <input 
                  type="text" 
                  className="input-base" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. Summer Reading List"
                  autoFocus
                />
              </div>

              <div className="modal-actions" style={{ justifyContent: modalMode === 'edit' ? 'space-between' : 'flex-end' }}>
                {modalMode === 'edit' && editingId && (
                  <button 
                    type="button" 
                    className="btn btn-delete" 
                    onClick={() => handleDelete(editingId)}
                  >
                    Delete Collection
                  </button>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!formName.trim()}>
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
