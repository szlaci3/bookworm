# Book Explorer — Discovery & Collection App

**Book Explorer** is a scalable front-end application built on top of the Open Library API, designed to explore, organize, and curate books into personalized collections.

The application combines **remote book discovery** (searching a large public dataset) with **local user-defined organization**, allowing users to save books, group them into collections (e.g., *To Read*, *Favorites*, *Sci-Fi*), and analyze or compare them.

---

## Core Objective

Build a **production-style React + Redux Toolkit application** that demonstrates:

* API-driven data fetching and caching
* Structured state management (remote vs local)
* Relational data modeling (books ↔ collections)
* Scalable front-end architecture

---

## Core Features (Phase 1 — MVP)

### 1. Book Discovery (Remote)

* Search books via Open Library API
  (`/search.json?q=...`)
* Display paginated results
* Show key fields:

  * Title
  * Author(s)
  * First publish year
  * Edition count

### 2. Book Detail View (Remote)

* Fetch detailed data via Works API
  (`/works/{workId}.json`)
* Display:

  * Description
  * Subjects
  * Metadata (if available)

### 3. Personal Library (Local)

* Save / remove books to a personal library
* Maintain a persistent list of saved books

### 4. Collections (Local)

* Create, rename, delete collections
* Assign/unassign books to collections
* View books grouped by collection

---

## State Architecture (Redux Toolkit)

The app enforces a **strict separation of concerns**.

### Slice 1: `books` (Remote Data Layer)

Responsibilities:

* API interaction
* Normalized entity storage
* Request lifecycle

State shape:

```ts
{
  entities: {
    booksById: Record<string, Book>
  },
  search: {
    query: string,
    page: number,
    resultIds: string[],
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    error: string | null
  },
  detailsStatusById: Record<string, Status>
}
```

Key concerns:

* Async thunks for search + detail fetch
* Caching results
* Pagination handling

---

### Slice 2: `catalogUI` (UI State Layer)

Responsibilities:

* Search inputs and controls
* View-level state

State shape:

```ts
{
  query: string,
  filters: {
    author?: string,
    yearRange?: [number, number]
  },
  sort: 'relevance' | 'year',
  page: number
}
```

Key concerns:

* Drives API requests (connected to `books` slice)
* Resettable without affecting cached data

---

### Slice 3: `collections` (Local Domain Layer)

Responsibilities:

* User-defined data
* Relationships between entities

State shape:

```ts
{
  collectionsById: Record<string, Collection>,
  collectionIds: string[],
  membership: Record<string, string[]> // collectionId -> bookIds[]
}
```

Key concerns:

* CRUD operations
* Many-to-many relationships
* Derived selectors

---

## Data Flow

1. User updates search query → `catalogUI`
2. Trigger fetch thunk → `books`
3. API response normalized → `books.entities`
4. UI selects data via selectors
5. User saves book → `collections`
6. Collections derive grouped views via selectors

---

## Technical Highlights

* Redux Toolkit (slices, async thunks)
* Normalized entity storage
* Memoized selectors (Reselect)
* Separation of:

  * Remote API state
  * UI state
  * Local persistent domain state
* Scalable folder structure (feature-based)

---

## Persistence Strategy

Because Open Library is **read-only**:

* User data (collections, saved books) is stored locally:

  * `localStorage` or Redux Persist (MVP)
* Optional extension:

  * Replace with backend API for multi-device sync

---

## Phase 2 Enhancements (Optional)

* Infinite scroll / advanced pagination
* Multi-select (bulk add/remove to collections)
* Tags / notes per book
* Derived views:

  * “Books before 1950”
  * “Most prolific authors in library”
* Offline-first support
* Recently viewed books

---

## Portfolio Value

This project demonstrates:

* Real-world API integration (Open Library)
* Clean Redux architecture with multiple slices
* Handling of **read-only remote data + writable local state**
* Modeling relational data on the client
* Designing for scalability from the start

---

## Execution Guidance (for LLM or Developer)

Start with:

1. Implement `books` slice with search thunk
2. Build search UI connected to `catalogUI`
3. Display results list
4. Add book detail view
5. Implement `collections` slice
6. Enable save + assign to collections

Avoid premature complexity. Ensure each step is functional before proceeding.
