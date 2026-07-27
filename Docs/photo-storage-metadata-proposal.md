# Photo Storage & Metadata Architecture

**Project:** andresravelocom
**Date:** 2026-07-27
**Status:** Proposal — pending review and decisions

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Problem Statement](#2-problem-statement)
3. [Investigation Findings](#3-investigation-findings)
4. [Architectural Options Considered](#4-architectural-options-considered)
5. [Proposed Architecture](#5-proposed-architecture)
6. [Data Model](#6-data-model)
7. [Admin Panel](#7-admin-panel)
8. [URL Structure](#8-url-structure)
9. [Workflow](#9-workflow)
10. [Cost Analysis](#10-cost-analysis)
11. [Implementation Phases](#11-implementation-phases)
12. [Open Questions](#12-open-questions)

---

## 1. Current State

### Image Storage: Cloudflare R2

Photography images are stored in a Cloudflare R2 bucket (`photography`) accessed via the S3-compatible API. The bucket is bound to the Astro app through the Cloudflare Workers integration.

**Key files:**

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | R2 bucket binding: `PHOTOGRAPHY` → `photography` bucket |
| `src/pages/api/photos.ts` | Lists all R2 objects, filters by image extension, returns paginated results |
| `src/pages/api/photos/[...key].ts` | Proxies single images from R2 (1-year cache headers) |
| `src/components/PhotoGallery.tsx` | Masonry gallery with infinite scroll, lazy loading, modal lightbox |
| `src/pages/photography.astro` | Server-rendered page that loads initial 12 photos + gear info |

### Content Collections (existing)

Three collections defined in `src/content.config.ts`:

| Collection | Types | Purpose |
|-----------|-------|---------|
| `photography` | `about`, `camera`, `lens` | Gear info and about text only — NO individual photo metadata |
| `dev` | `project`, `about` | Dev portfolio projects with cover images |
| `music` | *(flat)* | Music tracks — entirely commented out in pages |

### Deployment

- **Runtime:** Cloudflare Worker (SSR, `output: "server"`)
- **Adapter:** `@astrojs/cloudflare` v13.1.1
- **Image optimization:** `imageService: "compile"` (build-time only for local assets)
- **Build:** `astro build && wrangler deploy`

### What Exists Today

```
Browser → Cloudflare Worker (SSR Astro)
  ├── Static assets from Worker's ASSETS binding
  ├── /photography → fetches /api/photos → R2 bucket listing
  ├── /api/photos/[key] → proxy image from R2
  ├── /dev → prerendered content collection entries
  └── R2 "photography" bucket → raw image files, zero metadata
```

### The Gap

R2 images have **no metadata whatsoever** — no titles, no descriptions, no tags, no camera info, no alt text. The only data per image is: `key` (filename), `url` (proxy path), `size`, and `lastModified`. The `PhotoGallery` component uses `image.key` (the filename) as the alt text.

There is no mechanism for filtering, categorizing, or organizing photos beyond the flat R2 key listing sorted by upload date.

---

## 2. Problem Statement

### What We Want

1. **Tags** — technical metadata like camera (Leica M6, Minolta X-700), lens, film stock (Portra 400, HP5+), style (b&w, street, portrait)
2. **Collections** — curated groupings like "Street Cats", "Best of 2026", "Lisbon March 2026" (a photo can belong to multiple collections)
3. **Filterable gallery** — browse photos by tag or collection
4. **Individual photo pages** — each photo gets its own detail page (for future print selling)
5. **Full control** — metadata lives in the repo, exportable, no vendor lock-in
6. **No manual headaches** — managing 300+ photos needs a practical workflow, not creating hundreds of individual files by hand
7. **Local admin tool** — a way to manage photos and metadata visually, running locally only, not deployed to production
8. **Cost-effective** — no unnecessary paid services

### Constraints

- Photos are **scanned film rolls** — no EXIF data to auto-extract
- Metadata must be entered **manually** (title, tags, camera, film, description)
- Admin page must be **local-only** — not deployed to production
- The solution must work with the existing R2 bucket and Cloudflare Worker deployment
- Must be **exportable** — no vendor lock-in (explicitly avoiding services like Cloudinary)

---

## 3. Investigation Findings

### Cloudflare R2 Capabilities

- R2 is an S3-compatible object store — key-value, no relational queries
- Supports `customMetadata` on objects (up to 2KB), but the `list()` API **cannot filter by custom metadata** — you must fetch all objects and filter in code
- `list()` supports prefix filtering only (useful for directory-like organization)
- Very cheap: $0.015/GB/month, 10M free reads/month
- No built-in tagging system like S3

**Verdict:** R2 is excellent for image storage but cannot serve as a metadata/filtering layer.

### GitHub Repository Size

- GitHub recommends repos under 1GB, hard limit 100GB per repo
- A repo with 300 high-res images (5MB each) = ~1.5GB — over recommended limit
- GitHub LFS costs $0.25/month for 50GB + bandwidth fees
- Images stored in git also increase clone times and CI/CD costs

**Verdict:** Keep images in R2, not in git. Only metadata (JSON/MD) goes in the repo.

### Cloudflare Workers Deployment

- Free tier: 10ms CPU time per request, 128MB memory
- Static assets served separately from Worker script
- Worker script size limit: 10MB (but this is the compiled Worker, not total deployment)
- Static assets directory (`./dist`) can be much larger — served via ASSETS binding
- No practical limit for a photo site's static assets

**Verdict:** Deployment size is not a concern. R2 handles the heavy images, Worker just orchestrates.

### Astro Content Collections (v6)

Astro v6 Content Layer API supports:

- **`json()` loader** — load a JSON file as a collection, each top-level key becomes an entry
- **`glob()` loader** — load Markdown/MDX files from a directory
- **Custom loaders** — fetch from any API at build time
- Collections are queryable via `getCollection()` and `getEntry()` in both static and SSR modes
- Zod schemas validate all data at build time
- Entry IDs derive from JSON keys (for json loader) or filenames (for glob loader)

**Verdict:** The JSON loader is the key enabler — it lets us use a single JSON file as a proper Astro content collection with full Zod validation and querying.

---

## 4. Architectural Options Considered

### Option A: Individual Markdown Files per Photo

Each photo gets its own `.md` file in `src/content/photography/photos/` with rich frontmatter.

**Pros:** Full control, rich descriptions per photo, version controlled, granular.
**Cons:** 300+ files to create and maintain. Adding a photo requires creating a new file. High friction.

**Verdict:** Rejected — too much manual overhead for 300+ photos.

### Option B: Single JSON File as Metadata Store

One `photos.json` file mapping R2 keys to metadata.

**Pros:** Simple, one file to manage, version controlled, easy to export.
**Cons:** Less granular than individual files (but sufficient for this use case).

**Verdict:** Strong candidate — simplicity wins for this scale.

### Option C: R2 Custom Metadata

Store metadata directly on R2 objects via `customMetadata`.

**Pros:** Metadata travels with the image.
**Cons:** Cannot filter by metadata via list API. Editing requires re-uploading. Limited to 2KB. No rich descriptions.

**Verdict:** Rejected — R2 is not a queryable database.

### Option D: Store Images in Git (No R2)

Put images in `src/assets/` or `public/`, reference from content collections.

**Pros:** Everything in one place, full Astro optimization.
**Cons:** Repo grows to 1.5GB+. GitHub size limits. Slow clones. LFS costs.

**Verdict:** Rejected — wrong approach for a growing photo library.

### Option E: External Service (Cloudinary, etc.)

Use a cloud image service with built-in metadata and transformations.

**Pros:** Rich API, auto-optimization, CDN.
**Cons:** Vendor lock-in. Costs scale with usage. User explicitly wants exportability and control.

**Verdict:** Rejected — contradicts the "no vendor lock-in" requirement.

### Chosen: Option B (Single JSON) + Content Collections Integration

The JSON file becomes a proper Astro content collection via the `json()` loader. This gives us the simplicity of a single file with the power of Astro's content querying, Zod validation, and type safety.

---

## 5. Proposed Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LOCAL DEVELOPMENT                       │
│                                                             │
│  pnpm dev → Astro dev server + Cloudflare Worker (local)   │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ /admin   │───→│ Admin API    │───→│ R2 Bucket    │      │
│  │ (React)  │    │ (CRUD)       │    │ (remote)     │      │
│  └──────────┘    └──────┬───────┘    └──────────────┘      │
│                         │                                    │
│                    reads/writes                              │
│                         │                                    │
│                  ┌──────▼───────┐                           │
│                  │ photos.json  │ ← filesystem              │
│                  │ collections  │                           │
│                  │   .json      │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION                              │
│                                                             │
│  Cloudflare Worker (SSR Astro)                              │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ /photo-  │───→│ Enriched API │───→│ R2 Bucket    │      │
│  │ graphy   │    │ (merge JSON  │    │ (images)     │      │
│  └──────────┘    │  + R2 data)  │    └──────────────┘      │
│                  └──────────────┘                            │
│                                                             │
│  photos.json + collections.json → baked into Worker at      │
│  build time via content collections (json loader)           │
│                                                             │
│  /admin → 404 (import.meta.env.DEV = false)                │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **R2 stores images** — cheap, scalable, S3-compatible
2. **JSON files store metadata** — version controlled, exportable, human-readable
3. **Content collections bridge the two** — Astro's JSON loader treats metadata files as queryable collections
4. **Admin page is local-only** — gated by `import.meta.env.DEV`, writes to filesystem, never deployed
5. **Git is the deployment pipeline** — commit JSON changes → deploy → production reflects them

---

## 6. Data Model

### photos.json

Located at `src/data/photos.json`. Each top-level key is the R2 object key.

```json
{
  "street/dog-alfama-01.webp": {
    "title": "Street Dog in Alfama",
    "description": "Found this dog sleeping on warm cobblestones in the Alfama district. The morning light was perfect.",
    "tags": ["street", "b&w", "leica", "film"],
    "camera": "Leica M6",
    "lens": "Summicron 35mm f/2",
    "film": "Ilford HP5+",
    "date": "2026-03-15",
    "location": "Lisbon, Portugal",
    "featured": true,
    "forSale": false
  },
  "street/cat-porto-02.webp": {
    "title": "Porto Cat",
    "tags": ["street", "portra-400", "minolta"],
    "camera": "Minolta X-700",
    "lens": "Rokkor 50mm f/1.4",
    "film": "Kodak Portra 400",
    "date": "2026-04-02",
    "location": "Porto, Portugal"
  }
}
```

**Schema (Zod):**

```ts
z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  camera: z.string().optional(),
  lens: z.string().optional(),
  film: z.string().optional(),
  date: z.coerce.date().optional(),
  location: z.string().optional(),
  featured: z.boolean().default(false),
  forSale: z.boolean().default(false),
})
```

### collections.json

Located at `src/data/collections.json`. Each top-level key is the collection slug.

```json
{
  "street-cats": {
    "title": "Street Cats",
    "description": "Stray cats found wandering the streets of Portugal and Spain.",
    "coverPhoto": "street/cat-porto-02.webp",
    "photos": ["street/cat-porto-02.webp", "street/cat-lisbon-01.webp"]
  },
  "best-of-2026": {
    "title": "Best of 2026",
    "description": "Favorite shots from this year.",
    "coverPhoto": "street/dog-alfama-01.webp",
    "photos": ["street/dog-alfama-01.webp", "night/moon-01.webp"]
  }
}
```

**Schema (Zod):**

```ts
z.object({
  title: z.string(),
  description: z.string().optional(),
  coverPhoto: z.string().optional(),
  photos: z.array(z.string()).default([]),
})
```

### Relationships

- A **photo** belongs to a collection by having its R2 key listed in that collection's `photos` array
- A **photo can belong to multiple collections**
- No duplication of photo metadata — the photo entry exists once in `photos.json`, referenced by multiple collections
- **Tags** are freeform strings on each photo (no separate tags file needed)

### Content Collections Registration

```ts
// src/content.config.ts (additions)
import { json } from 'astro/loaders';

const photosCollection = defineCollection({
  loader: json({ path: './src/data/photos.json' }),
  schema: z.object({ /* as above */ }),
});

const collectionsCollection = defineCollection({
  loader: json({ path: './src/data/collections.json' }),
  schema: z.object({ /* as above */ }),
});
```

This makes `getCollection('photos')` and `getCollection('collections')` work normally, with Zod validation at build time.

---

## 7. Admin Panel

### Protection Strategy

The admin page is gated by `import.meta.env.DEV`. In Astro, this is `true` during `pnpm dev` and `false` in production builds. Both the page and its API routes return 404 when this flag is false.

**Double protection:**
1. `import.meta.env.DEV` check → returns 404 in production
2. Admin API routes use Node.js `fs` module → fails in Cloudflare Workers runtime (no filesystem access, even with `nodejs_compat`)

**No passwords needed** — the admin tool is simply unavailable outside local development.

### Admin API Routes

All under `/api/admin/`, all guarded by `import.meta.env.DEV`.

| Route | Method | Description |
|-------|--------|-------------|
| `/api/admin/photos` | GET | List all R2 objects merged with photos.json metadata |
| `/api/admin/photos/upload` | POST | Upload image to R2 + create entry in photos.json |
| `/api/admin/photos/[key]` | PUT | Update metadata for a photo in photos.json |
| `/api/admin/photos/[key]` | DELETE | Remove image from R2 + remove entry from photos.json |
| `/api/admin/collections` | GET | List all collections |
| `/api/admin/collections` | POST | Create a new collection |
| `/api/admin/collections/[slug]` | PUT | Update a collection |
| `/api/admin/collections/[slug]` | DELETE | Delete a collection |

### Admin Page UI

A React SPA at `/admin` using `client:only="react"`.

```
┌─────────────────────────────────────────────────────────────┐
│ Photo Admin                              [Upload] [Sync R2] │
├────────────┬────────────────────────────────────────────────┤
│ Sidebar    │  Main Content                                  │
│            │                                                │
│ Filters    │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ All (247)  │  │ 🖼️  │ │ 🖼️  │ │ 🖼️  │ │ 🖼️  │            │
│ Featured(5)│  │title│ │title│ │title│ │title│            │
│ Untagged(3)│  │tags │ │tags │ │tags │ │tags │            │
│            │  └─────┘ └─────┘ └─────┘ └─────┘            │
│ Collections│                                                │
│ · Street   │  Click photo → Edit panel:                     │
│ · Best 2026│  ┌────────────────────────────┐               │
│            │  │ Title:    [______________]  │               │
│ Tags       │  │ Desc:     [______________]  │               │
│ · leica    │  │ Camera:   [______________]  │               │
│ · b&w      │  │ Lens:     [______________]  │               │
│ · portra   │  │ Film:     [______________]  │               │
│            │  │ Tags:     [leica] [b&w] [+] │               │
│            │  │ Collections:                  │               │
│            │  │   [✓] Street Cats             │               │
│            │  │   [✓] Best of 2026            │               │
│            │  │ [Save]  [Delete]              │               │
│            │  └────────────────────────────┘               │
└────────────┴────────────────────────────────────────────────┘
```

### Admin Page Components

| Component | Purpose |
|-----------|---------|
| `AdminLayout.tsx` | Page layout with sidebar and header |
| `PhotoGrid.tsx` | Grid of photo thumbnails from R2, with metadata preview |
| `PhotoEditor.tsx` | Form for editing photo metadata (title, tags, camera, etc.) |
| `UploadZone.tsx` | Drag-and-drop upload area |
| `CollectionManager.tsx` | Sidebar list of collections, create/edit/delete |
| `CollectionEditor.tsx` | Form for editing collection metadata and assigning photos |

---

## 8. URL Structure

```
/photography                           → Gallery (all photos, masonry layout)
/photography?tag=leica                 → Filtered by tag
/photography?collection=street-cats    → Filtered by collection
/photography/[slug]                    → Individual photo detail page
/photography/collections               → All collections overview
/photography/collections/[slug]        → Single collection page

/admin                                 → Admin panel (DEV ONLY, 404 in production)
```

### Public API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/photos` | Enriched photo listing (merged R2 + metadata) |
| `/api/photos/[key]` | Proxy single image from R2 (existing, unchanged) |
| `/api/collections/[slug]` | Public collection data |

---

## 9. Workflow

### Day-to-Day Photo Management

```bash
# 1. Start local dev server
pnpm dev

# 2. Open admin panel in browser
#    http://localhost:4321/admin

# 3. Upload new scans (drag & drop)
#    → Image goes to R2
#    → Entry created in photos.json

# 4. Fill in metadata
#    → Title, description, tags, camera, lens, film
#    → Assign to collections

# 5. Stop dev server
#    Ctrl+C

# 6. Commit metadata changes
git add src/data/photos.json src/data/collections.json
git commit -m "Add Lisbon street photos"

# 7. Deploy
git push && pnpm deploy
```

### Initial Import of Existing 300+ Photos

```bash
# 1. Run sync script (lists R2, creates entries in photos.json)
pnpm photos:sync

# 2. Start dev server
pnpm dev

# 3. Open admin panel
#    http://localhost:4321/admin

# 4. Browse untagged photos, add metadata
#    → Photos show as thumbnails from R2
#    → Click to edit metadata

# 5. Commit and deploy when done
```

### Deleting a Photo

```bash
# Via admin panel:
# Click photo → Delete → removed from R2 + photos.json

# Or manually:
# 1. Delete from R2 bucket
# 2. Remove entry from photos.json
# 3. Remove from any collection's photos array in collections.json
# 4. Commit and deploy
```

---

## 10. Cost Analysis

| Service | Usage | Cost |
|---------|-------|------|
| Cloudflare R2 storage | 300 photos × ~5MB = 1.5GB | ~$0.02/month |
| Cloudflare R2 reads | <10M/month (free tier) | $0 |
| Cloudflare Workers | Free tier sufficient | $0 |
| GitHub | Free tier (images not in repo) | $0 |
| **Total** | | **~$0.02/month** |

### Why Not GitHub Storage

- 300 photos at 5MB each = 1.5GB → exceeds GitHub's recommended 1GB repo limit
- GitHub LFS: $0.25/month for 50GB + bandwidth fees
- Slow clones, large diffs, CI/CD overhead
- R2 is orders of magnitude cheaper and purpose-built for this

### Why Not Cloudinary / Similar

- Cloudinary free tier: 25 credits/month, 25GB storage
- Paid plans start at $89/month for meaningful usage
- Vendor lock-in: migration means re-uploading and re-processing all images
- Limited control over storage format and delivery
- User explicitly wants exportability and control

---

## 11. Implementation Phases

### Phase 1 — Data Layer (Foundation)

**Goal:** Establish the metadata system that everything else builds on.

- Create `src/data/photos.json` (empty initially)
- Create `src/data/collections.json` (empty initially)
- Extend `src/content.config.ts` with `photos` and `collections` collections
- Build `photos:sync` script (`scripts/photos-sync.ts`) for R2 ↔ JSON reconciliation
- Enrich `/api/photos` endpoint to merge R2 data with photos.json metadata

**Deliverable:** `getCollection('photos')` returns enriched photo data. Sync script works.

### Phase 2 — Admin Panel (Local Tool)

**Goal:** A visual interface for managing photos and metadata locally.

- Create admin page at `/admin` with `import.meta.env.DEV` guard
- Build admin API routes (CRUD for photos and collections)
- Build admin React components:
  - `AdminLayout.tsx` — page structure
  - `PhotoGrid.tsx` — thumbnail grid with metadata preview
  - `PhotoEditor.tsx` — metadata editing form
  - `UploadZone.tsx` — drag-and-drop upload to R2
  - `CollectionManager.tsx` — collection CRUD
  - `CollectionEditor.tsx` — collection metadata and photo assignment

**Deliverable:** Full admin UI for managing photos. Upload, edit, delete, organize into collections.

### Phase 3 — Public Gallery Overhaul

**Goal:** The public-facing gallery uses metadata for display and filtering.

- Rewrite `PhotoGallery.tsx` to consume enriched data
- Add tag/collection filtering UI (chips, dropdowns, or sidebar)
- Extract `PhotoCard.tsx` component showing metadata on hover
- Build photo detail page at `/photography/[slug]`
- Build collection pages at `/photography/collections/[slug]`
- Build collections overview at `/photography/collections`

**Deliverable:** Filterable gallery, collection pages, photo detail pages.

### Phase 4 — Polish

**Goal:** Production-ready quality.

- SEO: structured data (JSON-LD for photos), open graph meta tags
- Responsive admin panel
- Batch operations (select multiple photos, add to collection)
- Print selling placeholders (price field, "Buy Print" button)
- Performance: consider pre-computing tag/collection indexes if needed

**Deliverable:** Production-ready photo management system.

---

## 12. Open Questions

These decisions need to be made before or during implementation:

1. **Initial sync workflow:** Should the sync script read R2 and create `photos.json` entries automatically? Or should the admin panel handle the initial import?

2. **Pagination:** Should the public gallery load all photos at once (simpler, works for <1000) or keep server-side pagination with filtering (more complex, more scalable)?

3. **Photo detail pages:** Should every photo have a detail page, or only featured/photos marked `forSale`?

4. **Collection management:** Should collections be editable only through the admin panel, or also through direct JSON editing (both should work, but which is the primary workflow)?

5. **Tag vocabulary:** Should tags be freeform (any string) or constrained to a predefined set (enforced by the schema)?

6. **Admin page scope:** Should the initial admin implementation include collection management, or start with photo CRUD only and add collections in a later phase?

---

## Appendix: File Structure (Proposed)

New and modified files relative to the current project root:

```
src/
├── data/                                    # NEW
│   ├── photos.json                          # Photo metadata
│   └── collections.json                     # Collection definitions
├── content.config.ts                        # MODIFIED: +photos, +collections
├── pages/
│   ├── admin/
│   │   └── index.astro                      # NEW: admin page (dev only)
│   ├── photography.astro                    # MODIFIED: use enriched data
│   ├── photography/
│   │   ├── [slug].astro                     # NEW: photo detail page
│   │   └── collections/
│   │       ├── index.astro                  # NEW: all collections
│   │       └── [slug].astro                 # NEW: collection detail
│   └── api/
│       ├── photos/
│       │   ├── index.ts                     # MODIFIED: merge with metadata
│       │   └── [...key].ts                  # EXISTING (unchanged)
│       ├── admin/                           # NEW (all dev-only)
│       │   ├── photos/
│       │   │   ├── index.ts                 # List with metadata
│       │   │   ├── upload.ts                # Upload to R2 + JSON
│       │   │   └── [key].ts                 # Update/delete
│       │   └── collections/
│       │       ├── index.ts                 # List/create
│       │       └── [slug].ts                # Update/delete
│       └── collections/
│           └── [slug].ts                    # Public collection API
├── components/
│   ├── PhotoGallery.tsx                      # MODIFIED: metadata + filtering
│   ├── PhotoCard.tsx                         # NEW: extracted, shows metadata
│   ├── TagFilter.tsx                         # NEW: tag filter chips
│   ├── CollectionFilter.tsx                  # NEW: collection filter
│   └── admin/                               # NEW
│       ├── AdminLayout.tsx
│       ├── PhotoGrid.tsx
│       ├── PhotoEditor.tsx
│       ├── UploadZone.tsx
│       ├── CollectionManager.tsx
│       └── CollectionEditor.tsx
├── scripts/
│   └── photos-sync.ts                       # NEW: R2 ↔ JSON sync
└── styles/
    └── global.css                            # MODIFIED: admin styles
```
