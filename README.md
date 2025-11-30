# CrowdLens

> **Discover your event photos.** A modern platform for event photo sharing with intelligent face and bib number recognition.

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Data Model](#data-model)
- [Implementation Plan](#implementation-plan)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Scaling & Future Improvements](#scaling--future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

**CrowdLens** is a web platform that enables users to create public or private events—races, festivals, parties, and more—and upload photos tied to those events. The platform makes it easy for participants to discover their photos through intelligent search powered by face recognition and bib/runner number detection.

Core use cases:

- **Event organizers** create events with metadata (name, location, date range, visibility) and manage photo galleries.
- **Photographers** upload photos to events; the system automatically extracts EXIF data (GPS, timestamps) to match and deduplicate events.
- **Participants** find their photos by searching via face (selfie match) or bib number—no manual tagging required.

CrowdLens is architected to run entirely on **Cloudflare's edge infrastructure**: the frontend is deployed on **Cloudflare Pages**, the API runs on **Cloudflare Workers**, images are stored in **R2**, and relational data lives in **D1**. This provides global low-latency access, automatic scaling, and a simplified operational model.

---

## Features

### MVP (Current Scope)

- **User Accounts & Profiles** — Registration, login, profile management.
- **Event Creation & Management** — Create events with name, location, date range, description, and visibility (public/private).
- **Public Photo Uploads** — Anyone can upload photos to an event (subject to event permissions).
- **EXIF-Based Event Matching** — Photos are automatically matched to events using GPS coordinates and timestamps.
- **Photo Search by Event** — Browse and filter photos within an event gallery.
- **Photo Search by Bib Number** — Retrieve race photos by runner/bib number.
- **Photo Search by Face** — Upload a selfie to find photos containing your face.
- **Thumbnail Generation** — Optimized thumbnails for fast gallery loading.
- **Direct R2 Uploads** — Secure, signed URL uploads directly to Cloudflare R2.

### Future Enhancements

- **Vector Search for Faces** — Persistent face embeddings with similarity search for improved accuracy.
- **Advanced Event Deduplication** — Fuzzy name matching + location + time clustering to suggest event merges.
- **Admin Dashboard** — Moderation tools, analytics, and user management.
- **Batch Uploads** — Photographer-friendly bulk upload flows.
- **Watermarking & Purchase Flow** — Monetization options for event photographers.
- **Mobile Apps** — Native iOS/Android clients.

---

## Architecture Overview

CrowdLens follows a serverless, edge-first architecture leveraging Cloudflare's suite of products.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Cloudflare Edge                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐   │
│   │  Cloudflare     │       │  Cloudflare     │       │  Cloudflare     │   │
│   │  Pages          │──────▶│  Workers        │──────▶│  D1             │   │
│   │  (Next.js App)  │       │  (API Layer)    │       │  (SQLite DB)    │   │
│   └─────────────────┘       └────────┬────────┘       └─────────────────┘   │
│           │                          │                                      │
│           │                          ▼                                      │
│           │                 ┌─────────────────┐                             │
│           │                 │  Cloudflare     │                             │
│           └────────────────▶│  R2             │                             │
│             (Direct Upload) │  (Image Storage)│                             │
│                             └────────┬────────┘                             │
│                                      │                                      │
│                             ┌────────▼────────┐                             │
│                             │  Cloudflare     │                             │
│                             │  Queues         │                             │
│                             │  (Async Jobs)   │                             │
│                             └────────┬────────┘                             │
│                                      │                                      │
│                             ┌────────▼────────┐       ┌─────────────────┐   │
│                             │  Worker         │──────▶│  External ML    │   │
│                             │  Consumer       │       │  (Rekognition/  │   │
│                             │  (Processing)   │       │   Vision API)   │   │
│                             └─────────────────┘       └─────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| **Cloudflare Pages** | Hosts the Next.js frontend; serves static assets at the edge. |
| **Cloudflare Workers** | Handles all API requests (`/api/*`), authentication, and business logic. |
| **Cloudflare D1** | SQLite-based relational database for users, events, photos, and metadata. |
| **Cloudflare R2** | Object storage for original images and processed thumbnails. |
| **Cloudflare Queues** | Message queue for async tasks (EXIF extraction, ML processing, thumbnail generation). |
| **External ML Services** | AWS Rekognition or GCP Vision for face recognition and bib/text OCR. |

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14+, React 18, TypeScript | App Router for hybrid SSR/SSG, React Server Components, type safety. |
| **Styling** | Tailwind CSS, shadcn/ui | Utility-first CSS, accessible component primitives. |
| **Backend** | Cloudflare Workers, TypeScript | Edge compute with sub-millisecond cold starts, native bindings to D1/R2. |
| **Database** | Cloudflare D1 | Globally replicated SQLite, zero-config, integrated with Workers. (Optional: Neon/Supabase Postgres for complex queries.) |
| **Object Storage** | Cloudflare R2 | S3-compatible, zero egress fees, integrated with Workers. |
| **Async Processing** | Cloudflare Queues, Cron Triggers | Deferred processing without blocking user requests. |
| **Authentication** | JWT + Refresh Tokens (or Clerk/Auth0) | Stateless auth with secure token rotation. Clerk recommended for faster MVP. |
| **ML / Vision** | AWS Rekognition / GCP Vision API | Face detection/recognition, text/OCR for bib numbers. |
| **Monorepo Tooling** | pnpm, Turborepo | Fast installs, incremental builds, shared dependencies. |
| **Deployment** | Wrangler CLI, GitHub Actions | Automated CI/CD for Workers and Pages. |

---

## Repository Structure

```
crowdlens/
├── apps/
│   ├── frontend/              # Next.js frontend (Cloudflare Pages)
│   │   ├── src/
│   │   │   ├── app/           # App Router pages and layouts
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities, API clients
│   │   │   └── styles/        # Global styles
│   │   ├── public/            # Static assets
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── backend/               # Cloudflare Workers API
│       ├── src/
│       │   ├── index.ts       # Worker entry point
│       │   ├── routes/        # API route handlers
│       │   ├── services/      # Business logic
│       │   ├── db/            # D1 queries and migrations
│       │   └── utils/         # Helpers (auth, validation)
│       ├── wrangler.toml      # Cloudflare configuration
│       └── package.json
│
├── packages/
│   └── shared/                # Shared TypeScript code
│       ├── src/
│       │   ├── types/         # Shared type definitions
│       │   ├── schemas/       # Zod validation schemas
│       │   └── constants/     # Shared constants
│       └── package.json
│
├── migrations/                # D1 SQL migrations
├── scripts/                   # Dev/deploy scripts
├── .github/
│   └── workflows/             # CI/CD pipelines
├── package.json               # Root package.json (workspaces)
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## Data Model

### Core Entities

#### `User`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | string | Unique email address |
| `name` | string | Display name |
| `avatar_url` | string? | Profile picture URL |
| `created_at` | timestamp | Account creation date |

#### `Event`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | FK → User |
| `name` | string | Event name |
| `description` | text? | Event description |
| `location` | string? | Venue or address |
| `latitude` | float? | GPS latitude |
| `longitude` | float? | GPS longitude |
| `start_date` | date | Event start |
| `end_date` | date | Event end |
| `visibility` | enum | `public` / `private` |
| `created_at` | timestamp | Creation date |

#### `Photo`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | UUID? | FK → Event (nullable until matched) |
| `uploader_id` | UUID | FK → User |
| `r2_key` | string | Object key in R2 bucket |
| `thumbnail_r2_key` | string? | Thumbnail object key |
| `original_filename` | string | Original file name |
| `mime_type` | string | Image MIME type |
| `size_bytes` | int | File size |
| `exif_taken_at` | timestamp? | EXIF capture timestamp |
| `exif_latitude` | float? | EXIF GPS latitude |
| `exif_longitude` | float? | EXIF GPS longitude |
| `processing_status` | enum | `pending` / `processing` / `completed` / `failed` |
| `created_at` | timestamp | Upload timestamp |

#### `FaceMatch` (Future)
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `photo_id` | UUID | FK → Photo |
| `face_embedding` | blob | Vector embedding for face |
| `bounding_box` | json | Face location in image |

#### `BibMatch`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `photo_id` | UUID | FK → Photo |
| `bib_number` | string | Detected bib/runner number |
| `confidence` | float | OCR confidence score |
| `bounding_box` | json | Text location in image |

### R2 ↔ Database Mapping

Images in R2 are referenced by the `r2_key` field in the `Photo` table:

```
R2 Bucket: crowdlens-images
├── raw/{photo_id}.jpg          → Photo.r2_key
└── thumbnails/{photo_id}.webp  → Photo.thumbnail_r2_key
```

---

## Implementation Plan

### Phase 1 – Bootstrapping & Local Development

1. **Initialize the monorepo**

   ```bash
   # Create project and initialize pnpm workspace
   mkdir crowdlens && cd crowdlens
   pnpm init
   
   # Create workspace config
   cat > pnpm-workspace.yaml << EOF
   packages:
     - 'apps/*'
     - 'packages/*'
   EOF
   ```

2. **Set up Next.js frontend**

   ```bash
   cd apps
   pnpm create next-app frontend --typescript --tailwind --eslint --app --src-dir
   ```

3. **Set up Cloudflare Workers backend**

   ```bash
   cd apps
   pnpm create cloudflare backend --type worker-typescript
   ```

4. **Create shared package**

   ```bash
   mkdir -p packages/shared/src
   cd packages/shared
   pnpm init
   # Add TypeScript types, Zod schemas, shared utilities
   ```

5. **Configure Turborepo**

   ```json
   // turbo.json
   {
     "$schema": "https://turbo.build/schema.json",
     "pipeline": {
       "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
       "dev": { "cache": false, "persistent": true },
       "lint": {}
     }
   }
   ```

6. **Local development commands**

   ```bash
   # Run both frontend and backend
   pnpm dev

   # Or individually:
   pnpm --filter frontend dev      # Next.js on http://localhost:3000
   pnpm --filter backend dev       # Workers on http://localhost:8787
   ```

---

### Phase 2 – Cloudflare Pages (Frontend)

1. **Create a Pages project** in Cloudflare Dashboard or via Wrangler:

   ```bash
   wrangler pages project create crowdlens-web
   ```

2. **Configure build settings**:

   | Setting | Value |
   |---------|-------|
   | Build command | `pnpm --filter frontend build` |
   | Build output directory | `apps/frontend/.next` |
   | Root directory | `/` |

3. **Set environment variables** in Cloudflare Dashboard:

   ```
   NEXT_PUBLIC_API_URL=https://api.crowdlens.app
   ```

4. **Enable preview deployments** — automatic for every PR when connected to GitHub.

---

### Phase 3 – Cloudflare Workers (Backend API)

1. **Configure `wrangler.toml`**:

   ```toml
   # apps/backend/wrangler.toml
   name = "crowdlens-api"
   main = "src/index.ts"
   compatibility_date = "2024-01-01"
   
   # Routes
   routes = [
     { pattern = "api.crowdlens.app/*", zone_name = "crowdlens.app" }
   ]
   
   # D1 Database binding
   [[d1_databases]]
   binding = "DB"
   database_name = "crowdlens-db"
   database_id = "<your-database-id>"
   
   # R2 Bucket bindings
   [[r2_buckets]]
   binding = "IMAGES"
   bucket_name = "crowdlens-images"
   
   # Queue bindings
   [[queues.producers]]
   binding = "PROCESSING_QUEUE"
   queue = "photo-processing"
   
   [[queues.consumers]]
   queue = "photo-processing"
   max_batch_size = 10
   max_batch_timeout = 30
   
   # Secrets (set via `wrangler secret put`)
   # - ML_API_KEY
   # - JWT_SECRET
   ```

2. **Example Worker handler**:

   ```typescript
   // apps/backend/src/index.ts
   import { Hono } from 'hono';
   import { cors } from 'hono/cors';

   type Bindings = {
     DB: D1Database;
     IMAGES: R2Bucket;
     PROCESSING_QUEUE: Queue;
     JWT_SECRET: string;
   };

   const app = new Hono<{ Bindings: Bindings }>();

   app.use('/*', cors());

   // Get events
   app.get('/events', async (c) => {
     const { results } = await c.env.DB.prepare(
       'SELECT * FROM events WHERE visibility = ? ORDER BY start_date DESC'
     ).bind('public').all();
     return c.json(results);
   });

   // Upload photo (returns signed URL)
   app.post('/photos/upload-url', async (c) => {
     const { eventId, filename } = await c.req.json();
     const photoId = crypto.randomUUID();
     const r2Key = `raw/${photoId}`;
     
     // Create photo record
     await c.env.DB.prepare(
       'INSERT INTO photos (id, event_id, r2_key, processing_status) VALUES (?, ?, ?, ?)'
     ).bind(photoId, eventId, r2Key, 'pending').run();
     
     // Enqueue processing job
     await c.env.PROCESSING_QUEUE.send({ photoId, r2Key });
     
     // Return signed upload URL (simplified)
     return c.json({ photoId, uploadUrl: `https://r2.crowdlens.app/${r2Key}` });
   });

   export default app;
   ```

---

### Phase 4 – Database Setup (D1)

1. **Create the D1 database**:

   ```bash
   wrangler d1 create crowdlens-db
   # Note the database_id and add to wrangler.toml
   ```

2. **Create migrations**:

   ```sql
   -- migrations/0001_initial.sql
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     avatar_url TEXT,
     created_at TEXT DEFAULT (datetime('now'))
   );

   CREATE TABLE events (
     id TEXT PRIMARY KEY,
     owner_id TEXT REFERENCES users(id),
     name TEXT NOT NULL,
     description TEXT,
     location TEXT,
     latitude REAL,
     longitude REAL,
     start_date TEXT NOT NULL,
     end_date TEXT NOT NULL,
     visibility TEXT CHECK(visibility IN ('public', 'private')) DEFAULT 'public',
     created_at TEXT DEFAULT (datetime('now'))
   );

   CREATE TABLE photos (
     id TEXT PRIMARY KEY,
     event_id TEXT REFERENCES events(id),
     uploader_id TEXT REFERENCES users(id),
     r2_key TEXT NOT NULL,
     thumbnail_r2_key TEXT,
     original_filename TEXT,
     mime_type TEXT,
     size_bytes INTEGER,
     exif_taken_at TEXT,
     exif_latitude REAL,
     exif_longitude REAL,
     processing_status TEXT CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
     created_at TEXT DEFAULT (datetime('now'))
   );

   CREATE TABLE bib_matches (
     id TEXT PRIMARY KEY,
     photo_id TEXT REFERENCES photos(id),
     bib_number TEXT NOT NULL,
     confidence REAL,
     bounding_box TEXT
   );

   CREATE INDEX idx_photos_event ON photos(event_id);
   CREATE INDEX idx_photos_status ON photos(processing_status);
   CREATE INDEX idx_bib_matches_number ON bib_matches(bib_number);
   ```

3. **Run migrations**:

   ```bash
   wrangler d1 execute crowdlens-db --file=migrations/0001_initial.sql
   ```

---

### Phase 5 – R2 Buckets and Image Flow

1. **Create R2 buckets**:

   ```bash
   wrangler r2 bucket create crowdlens-images
   ```

2. **Configure CORS** (for direct browser uploads):

   ```json
   // r2-cors.json
   [
     {
       "AllowedOrigins": ["https://crowdlens.app", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

3. **Upload flow**:

   ```
   ┌──────────┐   1. Request upload URL   ┌──────────┐
   │ Frontend │ ─────────────────────────▶│ Worker   │
   │          │                           │ API      │
   │          │   2. Return signed URL    │          │
   │          │ ◀───────────────────────── │          │
   │          │                           │          │
   │          │   3. PUT image to R2      │          │
   │          │ ─────────────────────────▶│ R2       │
   │          │                           │          │
   │          │   4. Notify upload done   │          │
   │          │ ─────────────────────────▶│ Worker   │──▶ Queue job
   └──────────┘                           └──────────┘
   ```

---

### Phase 6 – Background Processing

1. **Queue consumer for photo processing**:

   ```typescript
   // apps/backend/src/queue.ts
   export async function handleQueue(
     batch: MessageBatch<{ photoId: string; r2Key: string }>,
     env: Bindings
   ) {
     for (const message of batch.messages) {
       const { photoId, r2Key } = message.body;
       
       try {
         // 1. Fetch image from R2
         const image = await env.IMAGES.get(r2Key);
         if (!image) throw new Error('Image not found');
         
         // 2. Extract EXIF
         const exifData = await extractExif(await image.arrayBuffer());
         
         // 3. Generate thumbnail
         const thumbnail = await generateThumbnail(await image.arrayBuffer());
         await env.IMAGES.put(`thumbnails/${photoId}.webp`, thumbnail);
         
         // 4. Call ML service for face/bib detection
         const mlResults = await callMLService(await image.arrayBuffer(), env.ML_API_KEY);
         
         // 5. Update database
         await env.DB.prepare(`
           UPDATE photos SET
             exif_taken_at = ?,
             exif_latitude = ?,
             exif_longitude = ?,
             thumbnail_r2_key = ?,
             processing_status = 'completed'
           WHERE id = ?
         `).bind(
           exifData.takenAt,
           exifData.latitude,
           exifData.longitude,
           `thumbnails/${photoId}.webp`,
           photoId
         ).run();
         
         // 6. Store bib matches
         for (const bib of mlResults.bibs) {
           await env.DB.prepare(
             'INSERT INTO bib_matches (id, photo_id, bib_number, confidence) VALUES (?, ?, ?, ?)'
           ).bind(crypto.randomUUID(), photoId, bib.number, bib.confidence).run();
         }
         
         message.ack();
       } catch (error) {
         console.error(`Failed to process ${photoId}:`, error);
         message.retry();
       }
     }
   }
   ```

2. **Cron triggers** for batch operations:

   ```toml
   # wrangler.toml
   [triggers]
   crons = ["0 * * * *"]  # Hourly
   ```

---

### Phase 7 – Frontend Integration

1. **Event listing page** (`/events`):

   ```tsx
   // apps/frontend/src/app/events/page.tsx
   async function getEvents() {
     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`);
     return res.json();
   }

   export default async function EventsPage() {
     const events = await getEvents();
     return (
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {events.map((event) => (
           <EventCard key={event.id} event={event} />
         ))}
       </div>
     );
   }
   ```

2. **Photo upload component**:

   ```tsx
   // apps/frontend/src/components/PhotoUploader.tsx
   'use client';
   
   export function PhotoUploader({ eventId }: { eventId: string }) {
     const handleUpload = async (file: File) => {
       // 1. Get signed URL
       const { uploadUrl, photoId } = await fetch('/api/photos/upload-url', {
         method: 'POST',
         body: JSON.stringify({ eventId, filename: file.name }),
       }).then(r => r.json());
       
       // 2. Upload directly to R2
       await fetch(uploadUrl, {
         method: 'PUT',
         body: file,
         headers: { 'Content-Type': file.type },
       });
       
       // 3. Confirm upload
       await fetch(`/api/photos/${photoId}/confirm`, { method: 'POST' });
     };
     
     return <DropZone onDrop={handleUpload} />;
   }
   ```

3. **Bib number search**:

   ```tsx
   // apps/frontend/src/app/search/bib/page.tsx
   export default function BibSearchPage() {
     const [bibNumber, setBibNumber] = useState('');
     const [results, setResults] = useState([]);
     
     const handleSearch = async () => {
       const res = await fetch(`/api/photos/search?bib=${bibNumber}`);
       setResults(await res.json());
     };
     
     return (
       <div>
         <input value={bibNumber} onChange={(e) => setBibNumber(e.target.value)} />
         <button onClick={handleSearch}>Search</button>
         <PhotoGrid photos={results} />
       </div>
     );
   }
   ```

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (for D1/R2 testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/QuentinLachaud/crowdlens.git
cd crowdlens

# Install dependencies
pnpm install

# Set up environment variables
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.dev.vars.example apps/backend/.dev.vars
```

### Environment Variables

**Frontend** (`apps/frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**Backend** (`apps/backend/.dev.vars`):
```
JWT_SECRET=your-dev-secret
ML_API_KEY=your-ml-service-key
```

### Running Locally

```bash
# Start all services (recommended)
pnpm dev

# Or run individually:
pnpm --filter frontend dev    # http://localhost:3000
pnpm --filter backend dev     # http://localhost:8787
```

### Database Seeding

```bash
# Create local D1 database
wrangler d1 execute crowdlens-db --local --file=migrations/0001_initial.sql

# Seed sample data
wrangler d1 execute crowdlens-db --local --file=scripts/seed.sql
```

---

## Deployment

### CI/CD Pipeline

The project uses GitHub Actions for automated deployment.

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter backend deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

  deploy-pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter frontend build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: crowdlens-web
          directory: apps/frontend/.next
```

### Secrets Management

Set secrets via Wrangler CLI:

```bash
wrangler secret put JWT_SECRET
wrangler secret put ML_API_KEY
```

### Routing Configuration

| Path | Destination |
|------|-------------|
| `crowdlens.app/*` | Cloudflare Pages (frontend) |
| `api.crowdlens.app/*` | Cloudflare Workers (API) |

Configure via Cloudflare Dashboard or `_routes.json`:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```

---

## Scaling & Future Improvements

### Scaling Characteristics

| Component | Scaling Behavior |
|-----------|------------------|
| **Cloudflare Pages** | Automatic global CDN distribution |
| **Workers** | Automatic scaling to millions of requests; 0ms cold starts |
| **D1** | Replicated globally; consider Neon/Supabase for >10GB or complex queries |
| **R2** | Unlimited storage; zero egress fees |
| **Queues** | Auto-scaling consumers based on queue depth |

### When to Consider External Postgres

- Dataset exceeds D1 limits (currently 10GB per database)
- Need for complex JOINs, full-text search, or PostGIS
- Require real-time subscriptions (Supabase)

Recommended options: **Neon** (serverless), **Supabase** (batteries-included).

### Roadmap

1. **Vector Search** — Store face embeddings in Pinecone/Weaviate for similarity search.
2. **Event Deduplication** — ML-powered clustering for automatic merge suggestions.
3. **Admin Dashboard** — React Admin or Retool for moderation and analytics.
4. **Watermarking** — On-the-fly watermarks for preview images.
5. **Purchase Flow** — Stripe integration for paid photo downloads.
6. **Mobile Apps** — React Native or Expo for iOS/Android.

---

### Development Guidelines

- Follow the existing code style (ESLint + Prettier).
- Write tests for new functionality.
- Update documentation as needed.
- Keep PRs focused and atomic.

---

## License

**© 2025 CrowdLens. All Rights Reserved.**

This software is proprietary and confidential. No license is granted for any use, copying, modification, distribution, or redistribution of this code.

**You may NOT:**

- Use this software for any purpose
- Copy, modify, or distribute this software
- Create derivative works based on this software
- Sublicense or sell copies of this software
- Use this software in commercial or non-commercial projects

Unauthorized use, reproduction, or distribution of this software is strictly prohibited and may result in legal action.

For licensing inquiries, please contact the project maintainers.

---

<p align="center">
  Built with ❤️ on Cloudflare
</p>
