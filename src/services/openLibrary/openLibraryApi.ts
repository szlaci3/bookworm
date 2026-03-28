import type { Book } from '../../types/books';

const BASE_URL = 'https://openlibrary.org';

interface OpenLibrarySearchResponse {
  numFound: number;
  docs: Array<{
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    edition_count?: number;
  }>;
}

interface OpenLibraryWorkResponse {
  description?: string | { value: string };
  subjects?: string[];
}

export interface SearchBooksParams {
  query: string;
  page?: number;
  author?: string;
  sort?: 'relevance' | 'year_asc' | 'year_desc';
  yearRange?: [number | undefined, number | undefined];
}

export const openLibraryApi = {
  /**
   * Search for books by querying the Open Library API.
   * Maps the response directly into our application's `Book` domain model.
   */
  async searchBooks(params: SearchBooksParams): Promise<{ results: Book[]; totalFound: number }> {
    const searchParams = new URLSearchParams();
    
    // Build query string
    let qString = params.query;

    if (params.yearRange) {
      const [start, end] = params.yearRange;
      if (start !== undefined && end !== undefined) {
        qString += ` first_publish_year:[${start} TO ${end}]`;
      } else if (start !== undefined) {
        qString += ` first_publish_year:[${start} TO *]`;
      } else if (end !== undefined) {
        qString += ` first_publish_year:[* TO ${end}]`;
      }
    }

    if (qString) {
      searchParams.append('q', qString);
    }

    if (params.author) searchParams.append('author', params.author);
    if (params.page) searchParams.append('page', params.page.toString());
    
    // Handle sorting
    if (params.sort === 'year_asc') {
      searchParams.append('sort', 'old');
    } else if (params.sort === 'year_desc') {
      searchParams.append('sort', 'new');
    }
    // 'relevance' is default when sort is omitted

    const response = await fetch(`${BASE_URL}/search.json?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.status}`);
    }

    const data: OpenLibrarySearchResponse = await response.json();

    const results: Book[] = data.docs.map((doc) => ({
      // Clean up the key from "/works/OL123W" to just "OL123W" for cleaner local IDs
      id: doc.key.replace('/works/', ''),
      title: doc.title,
      authors: doc.author_name || [],
      firstPublishYear: doc.first_publish_year,
      editionCount: doc.edition_count,
    }));

    return { results, totalFound: data.numFound };
  },

  /**
   * Fetch detailed metadata for a specific work.
   */
  async fetchWorkDetails(workId: string): Promise<Partial<Book>> {
    // Re-attach the /works/ prefix if it was stripped
    const formattedId = workId.startsWith('OL') ? `/works/${workId}` : workId;
    const response = await fetch(`${BASE_URL}${formattedId}.json`);

    if (!response.ok) {
      throw new Error(`Open Library API error: ${response.status}`);
    }

    const data: OpenLibraryWorkResponse = await response.json();

    return {
      // Description can sometimes be deeply nested in { value: string } format
      description: typeof data.description === 'string' 
        ? data.description 
        : data.description?.value,
      subjects: data.subjects || [],
    };
  },
};
