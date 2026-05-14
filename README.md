# Bookworm

**Bookworm** is a production-style front-end application designed to explore and organize books using the Open Library API.

The application combines two different data domains:

* large-scale remote API-driven book discovery
* locally persistent user-defined collections and libraries

Users can search books through Open Library, browse paginated results, inspect detailed work metadata, and curate their own collections such as Favorites, To Read, or genre-specific libraries.

A major focus of the project is architecture and state management. The application separates:

* remote API state
* UI/search state
* local persistent domain state

into dedicated Redux Toolkit slices. Book entities are normalized for efficient access and caching, while derived selectors provide scalable data composition across collections and views.

Local persistence is implemented with Dexie/IndexedDB, enabling the application to preserve user-created collections and saved books independently from the read-only external API.

The project also explores:

* async thunk orchestration
* memoized selectors
* pagination strategies
* client-side relational modeling
* persistence merge strategies
* scalable folder organization
* responsive UI architecture


**Tech stack:** React, TypeScript, Redux Toolkit, Dexie, Vite, Open Library API.

