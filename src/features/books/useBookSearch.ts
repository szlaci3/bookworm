import { skipToken } from '@reduxjs/toolkit/query';
import { useAppSelector } from '../../app/hooks';
import { booksApi } from './booksApi';

export function useBookSearch(page: number) {
  const { query, filters, sort } = useAppSelector(state => state.catalogUI);
  return booksApi.useSearchInfiniteQuery(
    query.trim() ? { query, ...filters, sort, page } : skipToken,
  );
}
