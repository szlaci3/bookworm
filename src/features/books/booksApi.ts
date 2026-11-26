import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { openLibraryApi, type SearchBooksParams } from '../../services/openLibrary/openLibraryApi';
import { getAuthorMetadata, saveAuthorMetadataBatch } from '../collections/persistence/collectionsRepository';
import type { Book } from '../../types/books';
import seed from '../../data/kingdom.json';

type SearchPage = { results: Book[]; totalFound: number };
const seedBooks = new Map(seed.results.map(book => [book.id, book]));

export const booksApi = createApi({
  reducerPath: 'booksApi',
  baseQuery: fakeBaseQuery<string>(),
  endpoints: build => ({
    search: build.infiniteQuery<SearchPage, SearchBooksParams, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (last, _pages, offset, _offsets, args) => {
          const page = (args.page ?? 1) + offset;
          return last.results.length && page * 100 < last.totalFound ? offset + 1 : undefined;
        },
      },
      async queryFn({ queryArg, pageParam }, { signal }) {
        try {
          const page = await openLibraryApi.searchBooks({ ...queryArg, page: (queryArg.page ?? 1) + pageParam }, signal);
          await saveAuthorMetadataBatch(page.results.map(({ id, authors }) => ({ id, authors })));
          return { data: page };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Could not search the library.' };
        }
      },
    }),
    details: build.query<Book, string>({
      async queryFn(id, { signal }) {
        try {
          const details = await openLibraryApi.fetchWorkDetails(id, signal);
          const summary = seedBooks.get(id);
          const authors = summary?.authors ?? await getAuthorMetadata(id) ?? [];
          return { data: { ...summary, ...details, id, title: details.title || summary?.title || 'Unknown Title', authors } };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Could not load book details.' };
        }
      },
    }),
  }),
});

export function withDetails(summary: Book | undefined, details: Book | undefined) {
  if (!details) return summary;
  return { ...summary, ...details, authors: summary?.authors.length ? summary.authors : details.authors };
}
