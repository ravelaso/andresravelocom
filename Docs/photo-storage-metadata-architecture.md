# Photo Storage & Metadata Architecture

**Project:** andresravelocom
**Date:** 2026-07-29
**Status:** Implemented

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [The Workerd Problem](#4-the-workerd-problem)
5. [Integration Middleware](#5-integration-middleware)
6. [Admin Panel](#6-admin-panel)
7. [API Routes](#7-api-routes)
8. [File Reference](#8-file-reference)
9. [Workflow](#9-workflow)
10. [Cost Analysis](#10-cost-analysis)
11. [Key Decisions & Tradeoffs](#11-key-decisions--tradeoffs)

---

## 1. Overview

Photography images live in **Cloudflare R2**. Metadata (titles, tags, camera, lens, film, collections) lives in local **JSON files** (`src/data/photos.json`, `src/data/collections.json`) that are version-controlled in git.

The admin panel runs **only in local development** (`import.meta.env.DEV` guard). It writes metadata to the JSON files through an Astro integration middleware, which runs on Node.js and has direct filesystem access.

The public API endpoint merges R2 image data with build-time metadata from the JSON files. Metadata is deployed by committing changes and rebuilding.

### Key Design Decisions

- **R2 stores images only** — cheap ($0.02/month), S3-compatible, no query capabilities
- **JSON files store metadata** — version controlled, human-readable, exportable, no vendor lock-in
- **Admin panel is local-only** — gated by `import.meta.env.DEV`, never deployed to production
- **Content collections NOT used** — Astro's `file()` loader triggers full page reloads on every write, and workerd cannot read/write the filesystem anyway
- **Integration middleware bridges the gap** — workerd API routes run in a sandbox without filesystem access, so all file I/O is handled by a Node.js middleware registered via `astro:server:setup`

### Data Flow

```
ADMIN PANEL (browser):
  Save metadata
    → fetch POST /_admin-io/write { file: 'photos.json', data: {...} }
    → Astro integration middleware (Node.js)
    → writeFileSync to src/data/photos.json
    → Vite ignores src/data/ (server.watch.ignored)
    → NO page reload
    → React state updates locally → UI reflects changes immediately

  Load data
    → fetch GET /api/admin/photos (R2 list, no metadata)
    → fetch GET /_admin-io/read?file=photos.json (metadata, from Node.js)
    → fetch GET /_admin-io/read?file=collections.json (collections)
    → Merge on client → full data

PUBLIC API (/api/photos):
  → import rawPhotosData from '@/data/photos.json' (build-time snapshot)
  → List R2 objects
  → Merge metadata from the imported JSON
  → Return enriched response

PRODUCTION BUILD:
  → JSON files are bundled into the Worker at build time (via Vite import)
  → No runtime filesystem access needed
  → Admin panel returns 404 (import.meta.env.DEV = false)
```

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                        │
│                                                            │
│  Browser ──→ Astro dev server (Node.js + Vite)             │
│                │                                           │
│                ├── Vite dev server                          │
│                │   ├── serves pages, React hydration        │
│                │   ├── compiles workerd-isolate modules     │
│                │   └── does NOT watch src/data/*.json       │
│                │       (vite.server.watch.ignored)          │
│                │                                           │
│                ├── Integration middleware (Node.js)         │
│                │   ├── GET /_admin-io/read?file=photos.json │
│                │   └── POST /_admin-io/write                │
│                │       (reads/writes to src/data/ directly) │
│                │                                           │
│                └── workerd sandbox                          │
│                    ├── /api/admin/photos/* (R2 operations)  │
│                    └── /api/photos (R2 list + metadata)     │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    PRODUCTION                               │
│                                                            │
│  Cloudflare Worker (SSR Astro)                             │
│    ├── /api/photos → R2 list + imported JSON metadata       │
│    ├── /api/photos/[key] → proxy image from R2             │
│    ├── /photography → fetches /api/photos                   │
│    └── /admin → 404 (DEV guard)                            │
│                                                            │
│  JSON files are embedded in the Worker at build time        │
│  via import — no runtime filesystem access needed           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Data Model

### photos.json

Located at `src/data/photos.json`. Each top-level key is the R2 object key.

```json
{
  "street/dog-alfama-01.webp": {
    "title": "Street Dog in Alfama",
    "description": "Found this dog sleeping on warm cobblestones.",
    "tags": ["street", "b&w"],
    "camera": "Leica M6",
    "lens": "Summicron 35mm f/2",
    "film": "Ilford HP5+",
    "date": "2026-03-15",
    "location": "Lisbon, Portugal",
    "featured": true,
    "forSale": false
  }
}
```

**Schema** (`src/types/photo.ts`):

```ts
export const PhotoMetaSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  camera: z.string().optional(),
  lens: z.string().optional(),
  film: z.string().optional(),
  date: z.string().optional(),   // "yyyy-MM-dd" format in JSON
  location: z.string().optional(),
  featured: z.boolean().default(false),
  forSale: z.boolean().default(false),
});

export type PhotoMeta = z.infer<typeof PhotoMetaSchema>;
```

### collections.json

Located at `src/data/collections.json`. Each top-level key is the collection slug.

```json
{
  "street-cats": {
    "title": "Street Cats",
    "description": "Stray cats found wandering the streets.",
    "coverPhoto": "street/cat-porto-02.webp",
    "photos": ["street/cat-porto-02.webp", "street/cat-lisbon-01.webp"]
  }
}
```

**Schema** (`src/types/photo.ts`):

```ts
export const CollectionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  coverPhoto: z.string().optional(),
  photos: z.array(z.string()).default([]),
});

export type PhotoCollection = z.infer<typeof CollectionSchema>;
```

### Relationships

- A photo belongs to a collection by having its R2 key listed in that collection's `photos` array
- A photo can belong to **multiple collections**
- No duplication of photo metadata — entries exist once in `photos.json`
- Tags are freeform strings on each photo (no separate tags file)

---

## 4. The Workerd Problem

`@astrojs/cloudflare` runs API routes inside a **workerd sandbox** during development. This sandbox:
- **Cannot read or write the local filesystem** — `node:fs` throws ENOENT at runtime
- **Cannot `fetch()` back to localhost** — workerd's networking is remote (connects to Cloudflare), so `fetch('http://127.0.0.1:4321/_admin-io/write')` fails with "Network connection lost"

This means:
- API routes cannot `readFileSync` or `writeFileSync` to `src/data/*.json`
- API routes cannot proxy writes through the dev server via fetch

**The solution**: An Astro integration (`astro:server:setup` + `server.middlewares.use`) registers middleware on the **Node.js dev server host**, not inside workerd. The browser talks to both:
1. **workerd API routes** for R2 operations (list, upload, delete)
2. **Node.js middleware** for filesystem operations (read/write metadata)

This is the correct separation: workerd handles what it can (R2), Node.js handles what it can (filesystem), and the browser orchestrates both.

### Why Not Content Collections

Astro's `file()` loader (which loads a single JSON file as a content collection) was initially used for photos and collections. This caused two problems:

1. **workerd cannot read the files** — `getCollection('photos')` returns empty `{}` in workerd because the file doesn't exist in the sandbox
2. **File writes trigger full page reloads** — content collection watchers detect changes to `src/data/*.json` and trigger a full Astro/HMR reload

Removing content collections for photos/collections and using **direct JSON import** (`import rawData from '@/data/photos.json'`) solves both: no watcher (via `vite.server.watch.ignored`), and the import is bundled at build time for production.

---

## 5. Integration Middleware

**File**: `src/integrations/admin-io.ts`

A custom Astro integration that registers two middleware endpoints on the Node.js dev server:

### `GET /_admin-io/read?file=photos.json`

Reads a JSON file from `src/data/` and returns its contents. Used by the admin panel to load metadata on mount. Returns `{}` if the file doesn't exist.

### `POST /_admin-io/write`

Accepts `{ file: string, data: any }` and writes `data` to `src/data/{file}`. Used by the admin panel to persist metadata changes. Creates the file if it doesn't exist.

### Registration

```ts
// astro.config.ts
import { adminIo } from './src/integrations/admin-io';

export default defineConfig({
  integrations: [react(), adminIo()],
});
```

### Why a middleware instead of a separate endpoint

Astro's `server.middlewares` API runs on the **Node.js dev server** (not workerd). This is the only place with actual filesystem access. We can't register this as a regular API route because API routes run in workerd.

---

## 6. Admin Panel

**Entry point**: `src/pages/admin/index.astro` (guarded by `import.meta.env.DEV`)

**React SPA**: AdminApp (client:only="react")

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `AdminApp` | `src/components/admin/AdminApp.tsx` | Root component, data fetching, state management |
| `AdminLayout` | `src/components/admin/AdminLayout.tsx` | Page layout with sidebar and header |
| `PhotoGrid` | `src/components/admin/PhotoGrid.tsx` | Grid of photo thumbnails from R2 |
| `PhotoEditor` | `src/components/admin/PhotoEditor.tsx` | Side panel for editing photo metadata |
| `UploadZone` | `src/components/admin/UploadZone.tsx` | Drag-and-drop upload area |
| `CollectionManager` | `src/components/admin/CollectionManager.tsx` | Sidebar list of collections |
| `CollectionEditor` | `src/components/admin/CollectionEditor.tsx` | Form for editing collection metadata |
| `NotificationToast` | `src/components/admin/NotificationToast.tsx` | Toast notification system |

### Data Flow on Mount

1. `GET /api/admin/photos` → lists R2 objects (keys, URLs, sizes, timestamps) — no metadata
2. `GET /_admin-io/read?file=photos.json` → read existing metadata from filesystem
3. `GET /_admin-io/read?file=collections.json` → read existing collections
4. Merge R2 photos with metadata by key
5. Detect new photos (in R2 but not in metadata) → create default entries, persist
6. Show toast for new photos found

### Metadata Persistence

Every mutation (save meta, upload, delete, toggle collection, save collection, delete collection) updates React state immediately AND persists to the filesystem via `POST /_admin-io/write`. The UI is optimistic — it updates state first, writes asynchronously.

### File Write Guard (`vite.server.watch.ignored`)

Without this, Vite detects file writes to `src/data/*.json` and triggers a full page reload (because `api/photos.ts` imports them). The admin panel becomes unusable.

```ts
// astro.config.ts
vite: {
  server: {
    watch: {
      ignored: ['**/src/data/**'],
    },
  },
},
```

This tells Vite to ignore `src/data/` for file watching. The admin reads/writes via the integration middleware (outside Vite's module graph), so it gets fresh data immediately. The public API uses the build-time snapshot, which is correct for production.

---

## 7. API Routes

### Admin API Routes (DEV only, guarded by `requireDev()`)

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/admin/photos` | GET | List R2 objects (keys, urls, sizes, lastModified) — no metadata |
| `/api/admin/photos/upload` | POST | Upload image to R2 via form data |
| `/api/admin/photos/[key]` | DELETE | Delete image from R2 |

These routes run in workerd and handle ONLY R2 operations. Metadata operations are handled by the React admin panel through the integration middleware.

### Public API Routes

| Route | Method | What it does |
|-------|--------|-------------|
| `/api/photos` | GET | List R2 objects enriched with metadata from imported JSON |
| `/api/photos/[key]` | GET | Proxy single image from R2 |

`/api/photos` imports `@/data/photos.json` directly at build time:
```ts
import type { PhotoMeta } from '@/types/photo';
import rawPhotosData from '@/data/photos.json';

const allMeta = rawPhotosData as Record<string, PhotoMeta>;
const metadataMap = new Map<string, PhotoMeta>(Object.entries(allMeta));
```

This is bundled into the Worker at build time. In dev, Vite resolves the import once at server start.

### Removed Routes

The following routes were removed because they became dead code when metadata management moved to the frontend:

- `PUT /api/admin/photos/[key]` — metadata update, now client-side
- `GET|POST /api/admin/collections` — collection CRUD, now client-side
- `PUT|DELETE /api/admin/collections/[slug]` — collection CRUD, now client-side
- `POST /api/admin/sync` — sync is automatic on mount

---

## 8. File Reference

### Core Data

| File | Purpose |
|------|---------|
| `src/data/photos.json` | Photo metadata, keyed by R2 object key |
| `src/data/collections.json` | Collection definitions, keyed by slug |
| `src/types/photo.ts` | Zod schemas and TypeScript types for photos and collections |

### Integration

| File | Purpose |
|------|---------|
| `src/integrations/admin-io.ts` | Astro integration with `/_admin-io/read` and `/_admin-io/write` middleware |
| `astro.config.ts` | Registers `adminIo()`, `vite.server.watch.ignored` |

### API Routes

| File | Purpose |
|------|---------|
| `src/pages/api/photos.ts` | Public photo listing (R2 + metadata merge) |
| `src/pages/api/photos/[...key].ts` | Single image proxy from R2 |
| `src/pages/api/admin/photos/index.ts` | Admin R2 listing |
| `src/pages/api/admin/photos/upload.ts` | Upload to R2 |
| `src/pages/api/admin/photos/[key].ts` | Delete from R2 |

### Admin Components

| File | Purpose |
|------|---------|
| `src/components/admin/AdminApp.tsx` | Root admin component, state management |
| `src/components/admin/AdminLayout.tsx` | Layout with sidebar |
| `src/components/admin/PhotoGrid.tsx` | Photo thumbnail grid |
| `src/components/admin/PhotoEditor.tsx` | Photo metadata editor |
| `src/components/admin/UploadZone.tsx` | Drag-and-drop upload |
| `src/components/admin/CollectionManager.tsx` | Collection list |
| `src/components/admin/CollectionEditor.tsx` | Collection editor |
| `src/components/admin/NotificationToast.tsx` | Toast notifications |

### Utilities

| File | Purpose |
|------|---------|
| `src/lib/admin-guard.ts` | `requireDev()` — returns 404 if not in DEV mode |
| `scripts/photos-sync.ts` | Lists R2 photos (for CI/reference, not needed for admin workflow) |

### Public Components

| File | Purpose |
|------|---------|
| `src/components/PhotoGallery.tsx` | Masonry gallery with infinite scroll |
| `src/pages/photography.astro` | Photography page (fetches `/api/photos`) |

---

## 9. Workflow

### Day-to-Day Photo Management

```bash
# 1. Start local dev server
pnpm dev

# 2. Open admin panel
#    http://localhost:4321/admin

# 3. Upload new scans (drag & drop)
#    → Image uploaded to R2
#    → New photo appears in grid with auto-generated title
#    → Metadata persisted to src/data/photos.json

# 4. Edit metadata
#    → Click photo → side panel opens
#    → Edit title, description, tags, camera, lens, film
#    → Toggle featured, forSale
#    → Add/remove from collections
#    → Click Save → React state updates + JSON file written
#    → NO page reload — UI stays exactly where it is

# 5. Stop dev server
#    Ctrl+C

# 6. Commit metadata changes
git add src/data/
git commit -m "Add Lisbon street photo metadata"

# 7. Deploy
git push
# (CI runs: pnpm build && wrangler deploy)
```

### Initial Sync (First Time or After Adding Photos Directly to R2)

Sync is automatic — the admin panel detects new photos (in R2 but missing from metadata) on mount, creates default entries, and shows a toast. No manual sync step needed.

The old sync endpoint and script have been removed. The CLI script at `scripts/photos-sync.ts` now just lists the photo count for reference.

### Deleting a Photo

Click photo → Delete → confirmed from R2 + metadata cleaned up automatically.

### Tags

Freeform strings per photo. Type and press Enter/Add. No predefined vocabulary, no separate tag management.

---

## 10. Cost Analysis

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare R2 storage | ~300 photos × ~5MB = 1.5GB | ~$0.02/month |
| Cloudflare R2 reads | <1M/month | $0 |
| Cloudflare Workers | Free tier | $0 |
| GitHub (metadata only) | ~100KB JSON files | $0 |
| **Total** | | **~$0.02/month** |

---

## 11. Key Decisions & Tradeoffs

### Why not content collections?

The `file()` loader initially seemed like the right fit — it builds collection entries from a JSON file with schema validation. In practice:

- **Dev mode (workerd)**: `getCollection('photos')` always returns empty because workerd can't read the filesystem at runtime. The file IS accessible during Vite module resolution (as an import), but NOT through the content layer API.
- **Dev HMR**: Content collection watchers trigger a full page reload on every file write, making the admin unusable.
- **Build mode**: Content collections work correctly (files are read during prerendering), but the same result is achieved with a direct JSON import.

**Verdict**: Direct JSON import is simpler, has no runtime filesystem dependency, and avoids watcher conflicts.

### Why the integration middleware instead of a separate Node.js server?

An Astro integration is the official way to add server middleware. It lives in the same process as the dev server, shares the same port, and requires no additional infrastructure. A separate server would mean different ports, CORS, and more complexity.

### Why not sync metadata to R2 as customMetadata?

R2's `customMetadata` is limited to 2KB total, cannot be filtered via the `list()` API, and editing requires re-uploading the object. It's not a practical metadata store.

### Why not use S3 metadata with a separate database?

That would require a database (D1, SQLite, etc.) at an additional cost and operational complexity. The metadata model is simple enough (key-value, flat fields) that JSON files in git are sufficient and more transparent.

### What about the date field?

`date` is stored as a string (`"yyyy-MM-dd"`) rather than a typed Date. This keeps the JSON human-readable, sortable, and avoids timezone ambiguity. The Zod schema validates it as `z.string()`, and the admin panel treats it as plain text.

### Why Vite ignore instead of removing the import?

The public API (`api/photos.ts`) needs metadata at runtime in production (Cloudflare Workers). The only way to embed it is through a build-time import. In dev, ignoring `src/data/` from Vite's watcher means the API serves a build-time snapshot, but the admin panel reads directly from `/_admin-io/read` (immediate), so there's no stale-data problem for the UI.
