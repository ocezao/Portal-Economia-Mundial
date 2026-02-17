# Image Processing and Uploads (CIN)

This document describes how image uploads work in the CIN project, including WebP conversion and SVG support.

## Overview

- Raster images are processed with Sharp and stored as `.webp`.
- Vector images (`.svg`) are stored as `.svg` (no Sharp processing), with basic server-side safety checks.
- Files are stored in Supabase Storage under `SUPABASE_UPLOAD_BUCKET` (default: `uploads`).
- Object paths follow: `yyyy/mm/<uuid>.(webp|svg)`

## Admin Panel

- Admin page: `/admin/arquivos`
  - Upload (uses `/api/upload`)
  - List/search/filter files (uses `/api/admin-files`)
  - Copy public URL
  - Delete file

## API Endpoints

### `POST /api/upload`

Uploads a file and stores it in Supabase Storage.

Auth:
- Required: `Authorization: Bearer <access_token>` (Supabase session token)
- Permission: admin-only (checked from user role metadata)

Limits:
- Max file size: 10MB
- Rate limit: 30 uploads/minute per IP (best-effort in-memory)

Accepted types:
- Raster: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
- Vector: `image/svg+xml` (or `.svg` extension fallback)

Raster behavior:
- Converted to WebP (`.webp`)
- Optional resize via `width`/`height` (clamped to 4096)
- Optional watermark (`watermark=true`)
- Metadata removal by default (`keepMetadata=false`)

SVG behavior:
- Stored as `.svg` (no conversion)
- Basic safety checks reject SVGs containing:
  - `<script ...>`
  - inline event handlers (`on*=` attributes)
  - `javascript:` URLs
  - `<foreignObject ...>`
  - `<!ENTITY ...>` (to avoid entity expansion)

Request (multipart/form-data):
- `file`: required
- `quality`: optional (1-95, default 85) for raster only
- `width`, `height`: optional for raster only
- `watermark`: optional (`true|false`) for raster only
- `keepMetadata`: optional (`true|false`) for raster only

Response (success):
```json
{
  "success": true,
  "file": {
    "filename": "uuid.webp",
    "url": "https://.../storage/v1/object/public/<bucket>/yyyy/mm/uuid.webp",
    "originalName": "original.ext",
    "originalSize": "123.45 KB",
    "processedSize": "67.89 KB",
    "reduction": "45.0%",
    "format": "webp",
    "metadata": { "removed": true, "hadGPS": false }
  }
}
```

### `GET|DELETE /api/admin-files`

Lists and deletes uploaded files (recursive listing).

Auth:
- Required: `Authorization: Bearer <access_token>` (Supabase session token)
- Permission: user must have `profiles.role = 'admin'`

`GET /api/admin-files` response:
```json
{
  "ok": true,
  "bucket": "uploads",
  "files": [
    {
      "name": "uuid.webp",
      "path": "yyyy/mm/uuid.webp",
      "size": 12345,
      "contentType": "image/webp",
      "updatedAt": "2026-02-17T00:00:00.000Z",
      "publicUrl": "https://.../storage/v1/object/public/<bucket>/yyyy/mm/uuid.webp",
      "isVector": false
    }
  ]
}
```

`DELETE /api/admin-files` body:
```json
{ "path": "yyyy/mm/uuid.webp" }
```

## Environment Variables

- `SUPABASE_UPLOAD_BUCKET`: Supabase Storage bucket for uploads (default: `uploads`)

## Key Files

- `src/app/api/upload/route.ts`
- `src/components/upload/ImageUploader.tsx`
- `src/app/admin/arquivos/page.tsx`
- `src/app/api/admin-files/route.ts`

