import { useAppDispatch, useAppSelector } from '../../app/hooks';
import type { Book } from '../../types/books';
import { LIBRARY_COLLECTION_ID } from './collections.constants';
import { selectIsBookSaved } from './collections.selectors';
import { addBookToCollectionThunk, removeBookFromCollectionThunk } from './collections.thunks';

export function useLibraryBook(book: Book | undefined) {
  const dispatch = useAppDispatch();
  const isSaved = useAppSelector(state => book ? selectIsBookSaved(state, book.id) : false);

  function toggleSaved() {
    if (!book) return;
    if (isSaved) {
      dispatch(removeBookFromCollectionThunk({ collectionId: LIBRARY_COLLECTION_ID, bookId: book.id }));
    } else {
      dispatch(addBookToCollectionThunk({ collectionId: LIBRARY_COLLECTION_ID, book }));
    }
  }

  return { isSaved, toggleSaved };
}
