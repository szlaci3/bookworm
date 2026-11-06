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


## 3D and 2D catalog

`/3d` opens a church nave with alternating, staggered books. `/2d` opens the
paginated catalog. `/` restores `catalogView` from Dexie, defaulting to 3D.
Explicit page URLs always take precedence over the saved preference. The version
3 database adds only the preferences table and preserves existing collections.

Search and filters live in the shared top bar. The magnifier submits the search;
the ellipsis opens author/year/sort and clear actions, plus navigation on phones.
A new search retains the chosen view and starts at page 1 / book 1.

Hold **W / Up** to walk forward or **S / Down** to walk backward, or hold the
on-screen arrows. There is no turning, mouse look or lateral movement. Focused
form fields and controls do not move the camera. Movement stops at the first and
last loaded book; while approaching the end, the next results page loads and
extends the aisle. Failed pages can be retried without losing the current book.
The sidebar follows the nearest book and can be collapsed. It starts collapsed
on narrow screens. If WebGL is unavailable, a link opens the 2D catalog.

### Starting data

`src/data/kingdom.json` is the real first 100 search results from Open Library,
retrieved November 6, 2026, including the total result count and cover IDs.
`kingdom-details.json` stores the first three works' descriptions and subjects.
Seven available starting covers are bundled in `public/covers/kingdom`, indexed
by `local-covers.json`; other covers load from Open Library. Missing images use
a title cover. The unfiltered, relevance-sorted first page of “kingdom” uses the
snapshot; later pages and all other searches use the live API. Results and counts
may change upstream after the snapshot date.

### Rendering budget and tuning

The scene is loaded in a separate JavaScript chunk; 2D visitors do not load Three.js.
The nave uses shared geometry/materials and instanced pillars, bases, capitals,
wall segments and pointed arches. Canvas textures paint the frescoes and floor,
without ornament or lamp geometry. Distance fog fades the far end into darkness.
There are no shadow maps, reflections, post-processing passes or mirror floor.

Only 22 nearby books have GPU resources at once. Passed books are removed before
they become too large, and their textures are disposed. Each book uses three draw
calls: leather body, image cover, and right-hand page block. The left spine has no
lettering or decoration. Pixel ratio is capped at 1.5. Frames are rendered only
when moving, resizing or receiving a cover; the stationary view does not redraw.
The camera widens its vertical field of view on portrait displays to retain both
rows and the centered vanishing point.

`src/features/nave/navigation.ts` contains movement, spacing and visible-book
constants. `DETAIL_PRELOAD_COUNT = 2` fetches details for the next two works in
addition to the current one. `PAGE_PRELOAD_REMAINING = 12` controls when the next
100-result page loads. Details deduplicate cached and in-flight requests; search
request IDs prevent late responses from replacing a newer search.

For a later visual pass, baked light maps and a shared texture atlas would add
richer walls at low runtime cost. Compressed cover textures and a lower pixel
ratio on slow devices could reduce GPU memory and fill cost further. Floor
reflections can be considered separately; a static environment approximation
would be cheaper than rendering the full scene again for each reflected frame.

## Validation

```sh
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

Browser tests use Chromium at `/usr/bin/chromium` by default. Set `CHROMIUM_PATH`
for another installation. They start/reuse Vite locally and mock Open Library for
repeatable navigation, pagination, loading, retry and responsive checks. To run
the same tests against a deployed build:

```sh
BOOKWORM_TEST_URL=https://szlaci3-bookworm.netlify.app pnpm test:e2e
```

The state tests cover movement boundaries, bundled data, Dexie preference storage
and stale search responses. API calls remain client-side; network/CORS failures
show loading/error states and retry controls where applicable.

In a managed environment with an HTTPS proxy, set
`BOOKWORM_TEST_PROXY="$HTTPS_PROXY"` for deployed browser tests. Requests then
use Playwright's Node request layer, which honors the configured environment CA;
TLS verification stays enabled and the browser's persistent trust is unchanged.

The architectural pass widens the nave to 20 world units between column centers,
raises the pointed vault to 20 units, and adds clustered shafts, stepped capitals,
layered transverse arches and diagonal ribs. Vault surfaces close the ceiling.
Two deterministic shared canvas textures provide aged masonry and botanical
frescoes with painted blue banners and warm illumination gradients. Architecture
is instanced by bay, and textures/geometries are disposed with the scene. The
floor remains the simple original material; reflections are still deferred.
